import { describe, expect, it } from 'vitest'
import { groupByAisle, listTotal, shoppingListToText, type ListItem } from '../shared/shopping-list'

function item(overrides: Partial<ListItem>): ListItem {
  return {
    id: overrides.product ?? 'id',
    name: 'Produit',
    product: 'Produit',
    needed: '1 pièce',
    packages: 1,
    unitPrice: 1,
    aisle: 'epicerie-salee',
    pantryCheck: false,
    meals: [],
    checked: false,
    ...overrides,
  }
}

const items = [
  item({ product: 'Pâtes penne 500 g', packages: 2, unitPrice: 0.89, aisle: 'epicerie-salee' }),
  item({ product: 'Filet d\'oignons jaunes 1 kg', unitPrice: 1.49, aisle: 'fruits-legumes' }),
  item({ product: 'Crème fraîche 20 cl', unitPrice: 0.99, aisle: 'cremerie', checked: true }),
  item({ name: 'Sel', product: 'Sel fin 1 kg', needed: '1 pincée', unitPrice: 0.6, pantryCheck: true }),
]

describe('listTotal', () => {
  it('additionne les conditionnements sans les produits de placard', () => {
    expect(listTotal(items)).toBeCloseTo(0.89 * 2 + 1.49 + 0.99)
  })
})

describe('groupByAisle', () => {
  it('range les rayons dans l\'ordre du magasin et omet les rayons vides', () => {
    expect(groupByAisle(items).map(group => group.id)).toEqual(['fruits-legumes', 'cremerie', 'epicerie-salee'])
  })
})

describe('shoppingListToText', () => {
  it('liste ce qui reste à prendre, rayon par rayon', () => {
    const text = shoppingListToText(items, [{ id: 'm', name: 'Café', checked: false }], 'Courses')

    expect(text).toBe([
      'Courses',
      '',
      'FRUITS & LÉGUMES',
      '- Filet d\'oignons jaunes 1 kg',
      '',
      'ÉPICERIE SALÉE',
      '- Pâtes penne 500 g x2',
      '',
      'AJOUTS PERSO',
      '- Café',
      '',
      'À VÉRIFIER DANS LES PLACARDS',
      '- Sel (1 pincée)',
      '',
      `Total estimé : ${new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(0.89 * 2 + 1.49 + 0.99)}`,
    ].join('\n'))
  })
})
