import { describe, expect, it } from 'vitest'
import { aggregateNeeds, formatQuantity } from '../shared/ingredients'
import type { Ingredient } from '../shared/schemas'

function ingredient(name: string, quantity: number, unit: Ingredient['unit'], aisle: Ingredient['aisle']): Ingredient {
  return { name, quantity, unit, aisle, preparation: '' }
}

describe('aggregateNeeds', () => {
  it('additionne un même produit utilisé dans plusieurs plats', () => {
    const needs = aggregateNeeds([
      { title: 'Gratin', ingredients: [ingredient('Crème fraîche épaisse', 200, 'ml', 'cremerie')] },
      { title: 'Pâtes carbo', ingredients: [ingredient('crème fraiche épaisse ', 100, 'ml', 'cremerie')] },
    ])

    expect(needs).toEqual([
      { name: 'Crème fraîche épaisse', quantity: 300, unit: 'ml', aisle: 'cremerie', meals: ['Gratin', 'Pâtes carbo'] },
    ])
  })

  it('garde séparées les unités différentes', () => {
    const needs = aggregateNeeds([
      { title: 'Soupe', ingredients: [ingredient('oignon jaune', 2, 'pièce', 'fruits-legumes')] },
      { title: 'Quiche', ingredients: [ingredient('oignon jaune', 150, 'g', 'fruits-legumes')] },
    ])

    expect(needs.map(need => `${need.quantity} ${need.unit}`)).toEqual(['2 pièce', '150 g'])
  })

  it('ne répète pas le plat quand un ingrédient y apparaît deux fois', () => {
    const needs = aggregateNeeds([
      {
        title: 'Curry',
        ingredients: [ingredient('ail', 1, 'gousse', 'fruits-legumes'), ingredient('Ail', 2, 'gousse', 'fruits-legumes')],
      },
    ])

    expect(needs).toHaveLength(1)
    expect(needs[0]).toMatchObject({ quantity: 3, meals: ['Curry'] })
  })

  it('trie par rayon dans l\'ordre du magasin', () => {
    const needs = aggregateNeeds([
      {
        title: 'Plat',
        ingredients: [
          ingredient('petits pois', 300, 'g', 'surgeles'),
          ingredient('pâtes', 500, 'g', 'epicerie-salee'),
          ingredient('carotte', 3, 'pièce', 'fruits-legumes'),
        ],
      },
    ])

    expect(needs.map(need => need.aisle)).toEqual(['fruits-legumes', 'epicerie-salee', 'surgeles'])
  })
})

describe('formatQuantity', () => {
  it('passe en kg et en litres au-delà de 1000', () => {
    expect(formatQuantity(1250, 'g')).toBe('1,25 kg')
    expect(formatQuantity(1500, 'ml')).toBe('1,5 l')
    expect(formatQuantity(250, 'g')).toBe('250 g')
  })

  it('accorde les unités comptables au pluriel', () => {
    expect(formatQuantity(3, 'pièce')).toBe('3 pièces')
    expect(formatQuantity(1, 'gousse')).toBe('1 gousse')
    expect(formatQuantity(2, 'c. à soupe')).toBe('2 c. à soupe')
  })
})
