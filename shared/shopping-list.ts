import { AISLES, type AisleId } from './constants'
import type { ShoppingItem } from './schemas'

export interface ListItem extends ShoppingItem {
  id: string
  checked: boolean
}

export interface ManualItem {
  id: string
  name: string
  checked: boolean
}

export interface AisleGroup<T extends ShoppingItem = ListItem> {
  id: AisleId
  label: string
  icon: string
  items: T[]
}

/**
 * Reste à acheter : un article non coché, ou un produit de placard coché
 * (sur la page Courses, on coche les produits de placard à racheter).
 */
export function isToBuy(item: ListItem): boolean {
  return item.pantryCheck ? item.checked : !item.checked
}

/** « Crème légère 15 % 20 cl x3 » */
export function itemLabel(item: ShoppingItem): string {
  return item.packages > 1 ? `${item.product} x${item.packages}` : item.product
}

export function itemTotal(item: ShoppingItem): number {
  return Math.max(item.packages, 0) * Math.max(item.unitPrice, 0)
}

/** Total estimé des achats, hors produits « à vérifier dans les placards ». */
export function listTotal(items: ShoppingItem[]): number {
  return items.filter(item => !item.pantryCheck).reduce((sum, item) => sum + itemTotal(item), 0)
}

export function groupByAisle<T extends ShoppingItem>(items: T[]): AisleGroup<T>[] {
  return AISLES
    .map(aisle => ({
      id: aisle.id,
      label: aisle.label,
      icon: aisle.icon,
      items: items.filter(item => item.aisle === aisle.id),
    }))
    .filter(group => group.items.length > 0)
}

const euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

export function formatEuros(value: number): string {
  return euros.format(value)
}

/** Version texte de la liste, pour la copier ou la partager. */
export function shoppingListToText(items: ListItem[], manualItems: ManualItem[], title: string): string {
  const lines: string[] = [title, '']

  for (const group of groupByAisle(items.filter(isToBuy))) {
    lines.push(group.label.toUpperCase())
    for (const item of group.items) lines.push(`- ${itemLabel(item)}`)
    lines.push('')
  }

  const extras = manualItems.filter(item => !item.checked)
  if (extras.length) {
    lines.push('AJOUTS PERSO')
    for (const item of extras) lines.push(`- ${item.name}`)
    lines.push('')
  }

  const pantry = items.filter(item => item.pantryCheck && !item.checked)
  if (pantry.length) {
    lines.push('À VÉRIFIER DANS LES PLACARDS')
    for (const item of pantry) lines.push(`- ${item.name} (${item.needed})`)
    lines.push('')
  }

  lines.push(`Total estimé : ${formatEuros(listTotal(items))}`)
  return lines.join('\n')
}

/** Une ligne par article à acheter, dans l'ordre des rayons : un rappel par ligne. */
export function remindersLines(items: ListItem[], manualItems: ManualItem[]): string[] {
  return [
    ...groupByAisle(items.filter(isToBuy)).flatMap(group => group.items.map(itemLabel)),
    ...manualItems.filter(item => !item.checked).map(item => item.name),
  ]
}

/** Lien qui lance un raccourci de l'app Raccourcis (iPhone, iPad, Mac) avec du texte en entrée. */
export function shortcutUrl(shortcutName: string, lines: string[]): string {
  const name = encodeURIComponent(shortcutName)
  const text = encodeURIComponent(lines.join('\n'))
  return `shortcuts://run-shortcut?name=${name}&input=text&text=${text}`
}
