import { AISLES, type AisleId, type Unit } from './constants'
import type { Ingredient, IngredientNeed } from './schemas'

/** Clé de regroupement : minuscules, sans accents ni espaces superflus. */
export function ingredientKey(name: string, unit: Unit): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
  return `${normalized}|${unit}`
}

/**
 * Additionne les ingrédients de toutes les recettes de la semaine : un même produit
 * (même nom, même unité) utilisé dans plusieurs plats ne compte qu'une fois.
 */
export function aggregateNeeds(meals: { title: string, ingredients: Ingredient[] }[]): IngredientNeed[] {
  const needs = new Map<string, IngredientNeed>()

  for (const meal of meals) {
    for (const ingredient of meal.ingredients) {
      const key = ingredientKey(ingredient.name, ingredient.unit)
      const existing = needs.get(key)
      if (existing) {
        existing.quantity += ingredient.quantity
        if (!existing.meals.includes(meal.title)) existing.meals.push(meal.title)
      }
      else {
        needs.set(key, {
          name: ingredient.name.trim(),
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          aisle: ingredient.aisle,
          meals: [meal.title],
        })
      }
    }
  }

  return [...needs.values()]
    .map(need => ({ ...need, quantity: roundQuantity(need.quantity) }))
    .sort((a, b) => aisleRank(a.aisle) - aisleRank(b.aisle) || a.name.localeCompare(b.name, 'fr'))
}

export function aisleRank(aisle: AisleId): number {
  return AISLES.findIndex(a => a.id === aisle)
}

function roundQuantity(quantity: number): number {
  return Math.round(quantity * 100) / 100
}

const numberFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })

/** « 1,2 kg », « 750 ml », « 3 pièces », « 2 c. à soupe »… */
export function formatQuantity(quantity: number, unit: Unit): string {
  if (unit === 'g' && quantity >= 1000) return `${numberFormat.format(quantity / 1000)} kg`
  if (unit === 'ml' && quantity >= 1000) return `${numberFormat.format(quantity / 1000)} l`
  if (unit === 'g' || unit === 'ml') return `${numberFormat.format(quantity)} ${unit}`

  const plural = quantity > 1 && ['pièce', 'pincée', 'gousse', 'tranche', 'botte', 'boîte'].includes(unit)
  return `${numberFormat.format(quantity)} ${unit}${plural ? 's' : ''}`
}
