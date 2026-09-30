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

  for (const group of groupByAisle(items.filter(item => !item.pantryCheck && !item.checked))) {
    lines.push(group.label.toUpperCase())
    for (const item of group.items) {
      const packages = item.packages > 1 ? ` x${item.packages}` : ''
      lines.push(`- ${item.product}${packages}`)
    }
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
