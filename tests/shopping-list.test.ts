import { describe, expect, it } from 'vitest'
import { groupByAisle, listTotal, remindersLines, shoppingListToText, shortcutUrl, type ListItem } from '../shared/shopping-list'

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

describe('export vers Rappels', () => {
  const withPantryToRebuy = [
    ...items,
    item({ name: 'Huile d\'olive', product: 'Huile d\'olive 1 l', unitPrice: 5.99, aisle: 'epicerie-salee', pantryCheck: true, checked: true }),
  ]

  it('liste ce qui reste à acheter, dans l\'ordre des rayons, puis les ajouts perso', () => {
    const lines = remindersLines(withPantryToRebuy, [
      { id: 'a', name: 'Café', checked: false },
      { id: 'b', name: 'Lessive', checked: true },
    ])

    expect(lines).toEqual([
      'Filet d\'oignons jaunes 1 kg',
      'Pâtes penne 500 g x2',
      'Huile d\'olive 1 l',
      'Café',
    ])
  })

  it('met les produits de placard cochés « à racheter » dans la version texte', () => {
    expect(shoppingListToText(withPantryToRebuy, [], 'Courses')).toContain('ÉPICERIE SALÉE\n- Pâtes penne 500 g x2\n- Huile d\'olive 1 l\n')
  })

  it('construit le lien qui lance le raccourci avec une ligne par article', () => {
    const url = shortcutUrl('Ajouter aux Courses', ['Crème légère 15 % 20 cl x3', 'Café'])

    expect(url).toBe('shortcuts://run-shortcut?name=Ajouter%20aux%20Courses&input=text&text=Cr%C3%A8me%20l%C3%A9g%C3%A8re%2015%20%25%2020%20cl%20x3%0ACaf%C3%A9')
    const text = new URL(url).searchParams.get('text')
    expect(text?.split('\n')).toEqual(['Crème légère 15 % 20 cl x3', 'Café'])
  })
})
