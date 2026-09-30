import { DAYS, EQUIPMENT_OPTIONS } from '#shared/constants'
import { aggregateNeeds } from '#shared/ingredients'
import type { MealIdea, Preferences, Recipe, ShoppingListOutput } from '#shared/schemas'
import type { ListItem, ManualItem } from '#shared/shopping-list'

export interface PlannedMeal extends MealIdea {
  id: string
  recipe: Recipe | null
  status: 'pending' | 'loading' | 'ready' | 'error'
  error?: string
  swapping?: boolean
}

export interface WeekPlan {
  id: string
  createdAt: string
  summary: string
  meals: PlannedMeal[]
}

export interface ShoppingListState {
  signature: string
  generatedAt: string
  items: ListItem[]
  tips: string[]
}

export function defaultPreferences(): Preferences {
  return {
    adults: 2,
    children: 0,
    days: [...DAYS],
    mealTypes: ['diner'],
    weeklyBudget: 60,
    diet: 'omnivore',
    exclusions: [],
    dislikes: '',
    equipment: EQUIPMENT_OPTIONS.slice(0, 3),
    maxMinutes: 45,
    level: 'intermediaire',
    pantry: 'sel, poivre, huile d\'olive, huile de tournesol, vinaigre, moutarde, farine, sucre, épices courantes',
    wishes: '',
  }
}

// Nombre de recettes demandées en parallèle à Claude.
const RECIPE_CONCURRENCY = 3
const inFlight = new Set<string>()
let activeWorkers = 0

function toPlanned(idea: MealIdea): PlannedMeal {
  return { ...idea, id: uid(), recipe: null, status: 'pending' }
}

function toIdea(meal: PlannedMeal): MealIdea {
  const { day, mealType, title, description, keyIngredients, totalMinutes, estimatedCost, tags } = meal
  return { day, mealType, title, description, keyIngredients, totalMinutes, estimatedCost, tags }
}

function signatureOf(plan: WeekPlan | null): string {
  return plan ? plan.meals.map(meal => meal.id).join(',') : ''
}

export function usePlanner() {
  const api = useApi()
  const toast = useToast()

  const preferences = usePersistedState<Preferences>('preferences', defaultPreferences)
  const preferencesSaved = usePersistedState('preferencesSaved', () => false)
  const plan = usePersistedState<WeekPlan | null>('plan', () => null)
  const shoppingList = usePersistedState<ShoppingListState | null>('shoppingList', () => null)
  const manualItems = usePersistedState<ManualItem[]>('manualItems', () => [])

  const generatingPlan = useState('generatingPlan', () => false)
  const generatingList = useState('generatingList', () => false)

  const meals = computed(() => plan.value?.meals ?? [])
  const readyCount = computed(() => meals.value.filter(meal => meal.status === 'ready').length)
  const allRecipesReady = computed(() => meals.value.length > 0 && readyCount.value === meals.value.length)
  const plannedCost = computed(() => meals.value.reduce((sum, meal) => sum + meal.estimatedCost, 0))
  const listOutdated = computed(() => !!shoppingList.value && shoppingList.value.signature !== signatureOf(plan.value))

  function findMeal(id: string) {
    return plan.value?.meals.find(meal => meal.id === id)
  }

  function notifyError(title: string, error: unknown) {
    toast.add({ title, description: errorMessage(error), color: 'error', icon: 'i-lucide-triangle-alert' })
  }

  async function generatePlan() {
    generatingPlan.value = true
    try {
      const result = await api<{ summary: string, meals: MealIdea[] }>('/api/plan', {
        method: 'POST',
        body: { preferences: preferences.value },
      })
      plan.value = {
        id: uid(),
        createdAt: new Date().toISOString(),
        summary: result.summary,
        meals: result.meals.map(toPlanned),
      }
      shoppingList.value = null
    }
    catch (error) {
      notifyError('Impossible de composer la semaine', error)
      return
    }
    finally {
      generatingPlan.value = false
    }
    void loadMissingRecipes()
  }

  async function loadRecipe(id: string) {
    const meal = findMeal(id)
    if (!meal || inFlight.has(id)) return

    inFlight.add(id)
    meal.status = 'loading'
    meal.error = undefined
    try {
      const recipe = await api<Recipe>('/api/recipe', {
        method: 'POST',
        body: { preferences: preferences.value, meal: toIdea(meal) },
      })
      // Le plat a pu être remplacé ou supprimé pendant la génération.
      const current = findMeal(id)
      if (current) {
        current.recipe = recipe
        current.status = 'ready'
      }
    }
    catch (error) {
      const current = findMeal(id)
      if (current) {
        current.status = 'error'
        current.error = errorMessage(error)
      }
    }
    finally {
      inFlight.delete(id)
    }
  }

  /** Génère en tâche de fond les recettes qui manquent, quelques-unes à la fois. */
  async function loadMissingRecipes() {
    const nextPending = () => plan.value?.meals.find(meal => meal.status === 'pending' && !inFlight.has(meal.id))

    const worker = async () => {
      activeWorkers++
      try {
        for (let meal = nextPending(); meal; meal = nextPending()) await loadRecipe(meal.id)
      }
      finally {
        activeWorkers--
      }
    }

    await Promise.all(Array.from({ length: Math.max(RECIPE_CONCURRENCY - activeWorkers, 0) }, worker))
  }

  function retryRecipe(id: string) {
    const meal = findMeal(id)
    if (!meal) return
    meal.status = 'pending'
    void loadMissingRecipes()
  }

  async function swapMeal(id: string, instruction = '') {
    const meal = findMeal(id)
    if (!plan.value || !meal) return

    meal.swapping = true
    try {
      const idea = await api<MealIdea>('/api/meal', {
        method: 'POST',
        body: {
          preferences: preferences.value,
          day: meal.day,
          mealType: meal.mealType,
          replacing: meal.title,
          otherMeals: plan.value.meals.filter(other => other.id !== id).map(other => other.title),
          instruction,
        },
      })
      const index = plan.value.meals.findIndex(other => other.id === id)
      if (index >= 0) plan.value.meals.splice(index, 1, toPlanned(idea))
    }
    catch (error) {
      notifyError('Impossible de remplacer ce plat', error)
      const current = findMeal(id)
      if (current) current.swapping = false
      return
    }
    void loadMissingRecipes()
  }

  function removeMeal(id: string) {
    if (!plan.value) return
    plan.value.meals = plan.value.meals.filter(meal => meal.id !== id)
  }

  async function generateShoppingList() {
    if (!plan.value || !allRecipesReady.value) return

    const needs = aggregateNeeds(plan.value.meals.map(meal => ({
      title: meal.title,
      ingredients: meal.recipe?.ingredients ?? [],
    })))
    const signature = signatureOf(plan.value)

    generatingList.value = true
    try {
      const result = await api<ShoppingListOutput>('/api/shopping-list', {
        method: 'POST',
        body: { preferences: preferences.value, needs },
      })
      // On garde cochés les produits déjà pris lors d'une mise à jour de la liste.
      const alreadyTaken = new Set(shoppingList.value?.items.filter(item => item.checked).map(item => item.product))
      shoppingList.value = {
        signature,
        generatedAt: new Date().toISOString(),
        tips: result.tips,
        items: result.items.map(item => ({ ...item, id: uid(), checked: alreadyTaken.has(item.product) })),
      }
    }
    catch (error) {
      notifyError('Impossible de préparer la liste de courses', error)
    }
    finally {
      generatingList.value = false
    }
  }

  function addManualItem(name: string) {
    const trimmed = name.trim()
    if (trimmed) manualItems.value.push({ id: uid(), name: trimmed, checked: false })
  }

  function removeManualItem(id: string) {
    manualItems.value = manualItems.value.filter(item => item.id !== id)
  }

  function uncheckAll() {
    shoppingList.value?.items.forEach((item) => { item.checked = false })
    manualItems.value.forEach((item) => { item.checked = false })
  }

  /** Au chargement : relance ce qu'un rechargement de page a pu interrompre. */
  function resume() {
    for (const meal of meals.value) {
      if (meal.status === 'loading' && !inFlight.has(meal.id)) meal.status = 'pending'
      meal.swapping = false
    }
    void loadMissingRecipes()
  }

  return {
    preferences,
    preferencesSaved,
    plan,
    shoppingList,
    manualItems,
    generatingPlan: readonly(generatingPlan),
    generatingList: readonly(generatingList),
    meals,
    readyCount,
    allRecipesReady,
    plannedCost,
    listOutdated,
    generatePlan,
    retryRecipe,
    swapMeal,
    removeMeal,
    generateShoppingList,
    addManualItem,
    removeManualItem,
    uncheckAll,
    resume,
  }
}
