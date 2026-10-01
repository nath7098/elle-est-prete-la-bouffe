import { describe, expect, it } from 'vitest'
import type { MealIdea, Preferences } from '../shared/schemas'
import {
  BALANCED_DIET_RULES,
  buildPlanPrompt,
  buildRecipePrompt,
  buildShoppingListPrompt,
  buildSwapPrompt,
  SYSTEM_PROMPT,
} from '../server/utils/prompts'

const preferences: Preferences = {
  adults: 2,
  children: 1,
  days: ['lundi', 'mardi'],
  mealTypes: ['diner'],
  weeklyBudget: 40,
  diet: 'omnivore',
  exclusions: [],
  dislikes: '',
  equipment: ['four'],
  maxMinutes: 40,
  level: 'intermediaire',
  pantry: 'sel, poivre',
  wishes: 'un gratin',
}

const meal: MealIdea = {
  day: 'lundi',
  mealType: 'diner',
  title: 'Gratin léger de courgettes',
  description: 'Gratin au fromage blanc.',
  plate: { vegetables: 'courgettes, tomates', protein: 'blanc de poulet', starch: 'riz complet' },
  keyIngredients: ['courgette', 'blanc de poulet', 'riz complet'],
  totalMinutes: 35,
  estimatedCost: 7.5,
  tags: ['four'],
}

describe('rééquilibrage alimentaire', () => {
  it('est la règle prioritaire du système', () => {
    expect(SYSTEM_PROMPT).toContain('rééquilibrage alimentaire')
  })

  it('s\'applique au menu, aux remplacements et aux recettes', () => {
    const prompts = [
      buildPlanPrompt(preferences),
      buildSwapPrompt({ preferences, day: 'lundi', mealType: 'diner', replacing: 'Lasagnes', otherMeals: [], instruction: '' }),
      buildRecipePrompt(preferences, meal),
    ]
    for (const prompt of prompts) expect(prompt).toContain(BALANCED_DIET_RULES)
  })

  it('transmet la composition de l\'assiette à la recette', () => {
    expect(buildRecipePrompt(preferences, meal)).toContain('légumes (courgettes, tomates), protéines (blanc de poulet), féculent (riz complet)')
  })

  it('accepte les plats enregistrés avant la composition de l\'assiette', () => {
    const { plate: _plate, ...withoutPlate } = meal
    expect(buildRecipePrompt(preferences, withoutPlate)).not.toContain('Assiette prévue')
  })

  it('garde les variantes allégées dans la liste de courses', () => {
    const prompt = buildShoppingListPrompt(preferences, [
      { name: 'crème légère', quantity: 200, unit: 'ml', aisle: 'cremerie', meals: [meal.title] },
    ])
    expect(prompt).toContain('garde exactement les variantes demandées')
  })
})
