import { AISLES, DAY_LABELS, DIET_LABELS, LEVEL_LABELS, MEAL_TYPE_LABELS, type Day, type MealType } from '#shared/constants'
import { formatQuantity } from '#shared/ingredients'
import type { IngredientNeed, MealIdea, Preferences } from '#shared/schemas'

export const SYSTEM_PROMPT = `Tu es le chef et planificateur de repas de l'application « Elle est prête la bouffe ? ».
Tu aides un foyer français à manger bien, varié et pas cher, en faisant toutes ses courses chez Lidl France.
Tes estimations de prix s'appuient sur les prix habituels pratiqués par Lidl en France métropolitaine.
Tu réponds toujours en français, dans le format JSON demandé.`

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

function or(value: string, fallback: string): string {
  return value.trim() || fallback
}

function list(values: string[], fallback: string): string {
  return values.length ? values.join(', ') : fallback
}

export function servingsOf(preferences: Preferences): number {
  return preferences.adults + preferences.children
}

function household(preferences: Preferences): string {
  const children = preferences.children
    ? `, ${preferences.children} enfant${preferences.children > 1 ? 's' : ''}`
    : ''
  return `${preferences.adults} adulte${preferences.adults > 1 ? 's' : ''}${children}`
}

function constraints(preferences: Preferences): string {
  return `- Foyer : ${household(preferences)}
- Régime : ${DIET_LABELS[preferences.diet]}
- Contraintes alimentaires : ${list(preferences.exclusions, 'aucune')}
- N'aime pas / allergies : ${or(preferences.dislikes, 'rien de particulier')}
- Équipement disponible : ${list(preferences.equipment, 'plaques de cuisson')}
- Temps maximum par repas (préparation + cuisson) : ${preferences.maxMinutes} min
- Niveau en cuisine : ${LEVEL_LABELS[preferences.level]}`
}

function slotLabel(day: Day, mealType: MealType): string {
  return `${DAY_LABELS[day]} ${MEAL_TYPE_LABELS[mealType].toLowerCase()}`
}

export function planSlots(preferences: Preferences): { day: Day, mealType: MealType }[] {
  return preferences.days.flatMap(day => preferences.mealTypes.map(mealType => ({ day, mealType })))
}

const MEAL_IDEA_RULES = `- day et mealType reprennent exactement les valeurs du créneau (ex. day « lundi », mealType « diner »).
- Respecte strictement le régime, les contraintes alimentaires et les allergies.
- Chaque plat doit être faisable avec l'équipement disponible, dans le temps maximum et au niveau indiqué.
- Des plats familiaux et réalistes, avec des produits qu'on trouve toute l'année chez Lidl ou de saison.
- totalMinutes : temps total préparation + cuisson, en minutes.
- estimatedCost : coût en euros des ingrédients utilisés par le plat pour tout le foyer, aux prix Lidl France.
- keyIngredients : les 3 à 6 ingrédients principaux.
- tags : 1 à 3 étiquettes courtes (ex. « rapide », « végé », « four », « enfants », « comfort food »).`

export function buildPlanPrompt(preferences: Preferences, now = new Date()): string {
  const slots = planSlots(preferences)
  return `Compose le menu de la semaine de ce foyer.

## Foyer
${constraints(preferences)}
- Déjà dans les placards : ${or(preferences.pantry, 'rien de déclaré')}
- Envies pour cette semaine : ${or(preferences.wishes, 'aucune en particulier')}

## Créneaux à remplir (${slots.length})
${slots.map(slot => `- ${slot.day} / ${slot.mealType} (${slotLabel(slot.day, slot.mealType)})`).join('\n')}

## Budget
${preferences.weeklyBudget} € pour l'ensemble des courses de ces repas, chez Lidl France.

## Règles
- Exactement un plat par créneau, dans l'ordre des créneaux ci-dessus.
${MEAL_IDEA_RULES}
- Varie les protéines, les féculents et les cuisines ; jamais deux fois le même plat.
- Nous sommes en ${MONTHS[now.getMonth()]} : privilégie les fruits et légumes de saison.
- Mutualise les ingrédients d'un plat à l'autre (ex. un chou-fleur pour deux recettes, un pot de crème partagé) pour limiter le gaspillage et le coût.
- La somme des estimatedCost doit rester sous environ 85 % du budget, car on achète des conditionnements entiers.
- summary : 1 à 2 phrases chaleureuses qui présentent la semaine.`
}

export function buildSwapPrompt(input: {
  preferences: Preferences
  day: Day
  mealType: MealType
  replacing: string
  otherMeals: string[]
  instruction: string
}): string {
  const { preferences } = input
  const slotsCount = Math.max(planSlots(preferences).length, 1)
  const perMeal = preferences.weeklyBudget / slotsCount

  return `Propose un nouveau plat pour le créneau ${input.day} / ${input.mealType} (${slotLabel(input.day, input.mealType)}), à la place de « ${input.replacing} ».

## Foyer
${constraints(preferences)}
- Déjà dans les placards : ${or(preferences.pantry, 'rien de déclaré')}

## Déjà au menu cette semaine
${input.otherMeals.length ? input.otherMeals.map(title => `- ${title}`).join('\n') : '- (aucun autre plat)'}
Ne propose ni l'un de ces plats ni « ${input.replacing} », mais tu peux réutiliser leurs ingrédients.

## Demande de l'utilisateur
${or(input.instruction, 'Juste une autre idée, dans le même esprit.')}

## Règles
${MEAL_IDEA_RULES}
- Budget indicatif pour ce plat : environ ${perMeal.toFixed(2)} €.`
}

export function buildRecipePrompt(preferences: Preferences, meal: MealIdea): string {
  const servings = servingsOf(preferences)
  return `Écris la recette de « ${meal.title} » (${slotLabel(meal.day, meal.mealType)}) pour ${servings} personne${servings > 1 ? 's' : ''}.

## Le plat
- Description : ${meal.description}
- Ingrédients principaux prévus : ${list(meal.keyIngredients, 'libre')}
- Temps visé : ${meal.totalMinutes} min au total

## Foyer
${constraints(preferences)}

## Règles
- servings : ${servings}.
- ingredients : tous les ingrédients, y compris sel, poivre, huile et épices.
  - name : nom du produit tel qu'on l'achète, au singulier, sans quantité ni préparation (ex. « oignon jaune », « crème fraîche épaisse », « blanc de poulet », « pâtes penne »). Écris toujours le même produit de la même façon.
  - unit : « g » ou « ml » pour tout ce qui se pèse ou se mesure (pas de kg ni de litres) ; « pièce » pour les légumes, fruits et œufs comptés à l'unité ; « c. à soupe », « c. à café » ou « pincée » pour les petites quantités ; « gousse » pour l'ail ; « tranche », « botte », « boîte » ou « sachet » seulement si c'est la façon naturelle de compter.
  - quantity : la quantité pour ${servings} personne${servings > 1 ? 's' : ''}, dans cette unité.
  - aisle : le rayon Lidl du produit parmi ${AISLES.map(a => `« ${a.id} »`).join(', ')}.
  - preparation : « émincé », « en dés », « râpé »… ou une chaîne vide.
- prepMinutes et cookMinutes : temps de préparation et de cuisson, en minutes.
- equipment : le matériel utilisé, choisi dans l'équipement disponible.
- steps : 4 à 8 étapes courtes et concrètes, avec temps de cuisson et températures.
- tip : une astuce utile (variante pour les enfants, conservation, utilisation des restes) ou une chaîne vide.`
}

export function buildShoppingListPrompt(preferences: Preferences, needs: IngredientNeed[]): string {
  const lines = needs.map(need =>
    `- ${need.name} : ${formatQuantity(need.quantity, need.unit)} — rayon ${need.aisle} — pour : ${need.meals.join(' ; ')}`,
  )

  return `Transforme ces besoins en liste de courses à faire chez Lidl France.

## Foyer
- ${household(preferences)}
- Déjà dans les placards (déclaré par l'utilisateur) : ${or(preferences.pantry, 'rien de déclaré')}
- Budget de la semaine : ${preferences.weeklyBudget} €

## Besoins de la semaine (quantités totales)
${lines.join('\n')}

## Règles
- Une ligne par produit à acheter. Regroupe les besoins qui correspondent au même produit en magasin (ex. « crème fraîche » et « crème fraîche épaisse », ou un même légume compté en pièces et en grammes).
- name : nom court du produit (ex. « Oignons jaunes »).
- product : le produit tel qu'on le trouve en rayon chez Lidl France, avec son conditionnement habituel (ex. « Filet d'oignons jaunes 1 kg », « Pâtes penne 500 g », « Crème fraîche épaisse 20 cl »). Cite une marque propre Lidl seulement si tu es sûr qu'elle correspond.
- needed : la quantité nécessaire pour la semaine, lisible (ex. « 350 g », « 3 pièces »).
- packages : le nombre entier de conditionnements à acheter pour couvrir le besoin (au moins 1).
- unitPrice : le prix estimé d'un conditionnement, en euros, au prix Lidl France habituel.
- aisle : le rayon, parmi ${AISLES.map(a => `« ${a.id} »`).join(', ')}.
- pantryCheck : true pour les produits de base qu'on a généralement déjà (sel, poivre, huile, vinaigre, épices, farine, sucre, moutarde…) et pour tout ce que l'utilisateur a déclaré avoir dans ses placards ; false pour le reste.
- meals : les plats qui utilisent ce produit (repris des besoins).
- tips : 0 à 3 conseils courts pour payer moins cher cette liste chez Lidl (surgelé plutôt que frais, format familial, alternative moins chère…).`
}
