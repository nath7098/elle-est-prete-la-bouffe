import { z } from 'zod'
import { AISLE_IDS, DAYS, DIETS, LEVELS, MEAL_TYPES, UNITS } from './constants'

// ---------------------------------------------------------------------------
// Préférences du foyer (saisies dans l'appli, validées côté serveur)
// ---------------------------------------------------------------------------

export const PreferencesSchema = z.object({
  adults: z.number().int().min(1, 'Au moins 1 adulte').max(12),
  children: z.number().int().min(0).max(12),
  days: z.array(z.enum(DAYS)).min(1, 'Choisis au moins un jour'),
  mealTypes: z.array(z.enum(MEAL_TYPES)).min(1, 'Choisis au moins un repas'),
  weeklyBudget: z.number().min(5, 'Budget minimum : 5 €').max(1000),
  diet: z.enum(DIETS),
  exclusions: z.array(z.string().max(80)).max(30),
  dislikes: z.string().max(500),
  equipment: z.array(z.string().max(80)).min(1, 'Choisis au moins un équipement').max(20),
  maxMinutes: z.number().int().min(10).max(240),
  level: z.enum(LEVELS),
  pantry: z.string().max(1000),
  wishes: z.string().max(1000),
})
export type Preferences = z.infer<typeof PreferencesSchema>

// ---------------------------------------------------------------------------
// Sorties de Claude (structured outputs). Pas de contraintes min/max ici :
// le schéma sert à la fois de format imposé au modèle et de validation.
// ---------------------------------------------------------------------------

/** Composition de l'assiette, imposée par le rééquilibrage alimentaire. */
export const PlateSchema = z.object({
  vegetables: z.string(),
  protein: z.string(),
  starch: z.string(),
})
export type Plate = z.infer<typeof PlateSchema>

export const MealIdeaSchema = z.object({
  day: z.enum(DAYS),
  mealType: z.enum(MEAL_TYPES),
  title: z.string(),
  description: z.string(),
  plate: PlateSchema,
  keyIngredients: z.array(z.string()),
  totalMinutes: z.number(),
  estimatedCost: z.number(),
  tags: z.array(z.string()),
})
export type MealIdea = z.infer<typeof MealIdeaSchema>

// Les menus enregistrés avant l'ajout de « plate » n'ont pas ce champ.
export const RecipeMealSchema = MealIdeaSchema.partial({ plate: true })
export type RecipeMeal = z.infer<typeof RecipeMealSchema>

export const PlanOutputSchema = z.object({
  summary: z.string(),
  meals: z.array(MealIdeaSchema),
})
export type PlanOutput = z.infer<typeof PlanOutputSchema>

export const IngredientSchema = z.object({
  name: z.string(),
  quantity: z.number(),
  unit: z.enum(UNITS),
  aisle: z.enum(AISLE_IDS),
  preparation: z.string(),
})
export type Ingredient = z.infer<typeof IngredientSchema>

export const RecipeSchema = z.object({
  servings: z.number(),
  kcalPerServing: z.number(),
  prepMinutes: z.number(),
  cookMinutes: z.number(),
  equipment: z.array(z.string()),
  ingredients: z.array(IngredientSchema),
  steps: z.array(z.string()),
  tip: z.string(),
})
export type Recipe = z.infer<typeof RecipeSchema>

export const ShoppingItemSchema = z.object({
  name: z.string(),
  product: z.string(),
  needed: z.string(),
  packages: z.number(),
  unitPrice: z.number(),
  aisle: z.enum(AISLE_IDS),
  pantryCheck: z.boolean(),
  meals: z.array(z.string()),
})
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>

export const ShoppingListOutputSchema = z.object({
  items: z.array(ShoppingItemSchema),
  tips: z.array(z.string()),
})
export type ShoppingListOutput = z.infer<typeof ShoppingListOutputSchema>

// ---------------------------------------------------------------------------
// Corps des requêtes vers /api
// ---------------------------------------------------------------------------

export const IngredientNeedSchema = z.object({
  name: z.string().max(120),
  quantity: z.number(),
  unit: z.enum(UNITS),
  aisle: z.enum(AISLE_IDS),
  meals: z.array(z.string().max(200)).max(30),
})
export type IngredientNeed = z.infer<typeof IngredientNeedSchema>

export const PlanRequestSchema = z.object({
  preferences: PreferencesSchema,
})

export const SwapMealRequestSchema = z.object({
  preferences: PreferencesSchema,
  day: z.enum(DAYS),
  mealType: z.enum(MEAL_TYPES),
  replacing: z.string().max(200),
  otherMeals: z.array(z.string().max(200)).max(30),
  instruction: z.string().max(300),
})

export const RecipeRequestSchema = z.object({
  preferences: PreferencesSchema,
  meal: RecipeMealSchema,
})

export const ShoppingListRequestSchema = z.object({
  preferences: PreferencesSchema,
  needs: z.array(IngredientNeedSchema).min(1).max(300),
})
