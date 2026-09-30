export const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const
export type Day = (typeof DAYS)[number]

export const DAY_LABELS: Record<Day, string> = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche',
}

export const MEAL_TYPES = ['dejeuner', 'diner'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  dejeuner: 'Déjeuner',
  diner: 'Dîner',
}

export const DIETS = ['omnivore', 'flexitarien', 'pescetarien', 'vegetarien', 'vegan'] as const
export type Diet = (typeof DIETS)[number]

export const DIET_LABELS: Record<Diet, string> = {
  omnivore: 'Omnivore',
  flexitarien: 'Flexitarien (peu de viande)',
  pescetarien: 'Pescétarien',
  vegetarien: 'Végétarien',
  vegan: 'Vegan',
}

export const LEVELS = ['debutant', 'intermediaire', 'confirme'] as const
export type Level = (typeof LEVELS)[number]

export const LEVEL_LABELS: Record<Level, string> = {
  debutant: 'Débutant',
  intermediaire: 'Intermédiaire',
  confirme: 'Confirmé',
}

export const EXCLUSION_OPTIONS = [
  'sans porc',
  'halal',
  'sans gluten',
  'sans lactose',
  'sans fruits à coque',
  'sans poisson ni fruits de mer',
  'peu épicé',
]

export const EQUIPMENT_OPTIONS = [
  'plaques de cuisson',
  'four',
  'micro-ondes',
  'airfryer',
  'multicuiseur (Cookeo…)',
  'robot cuiseur (Monsieur Cuisine, Thermomix…)',
  'mixeur',
  'plancha / barbecue',
]

// Unités autorisées dans les recettes : peu nombreuses pour pouvoir additionner
// les quantités d'une recette à l'autre.
export const UNITS = ['g', 'ml', 'pièce', 'c. à soupe', 'c. à café', 'pincée', 'gousse', 'tranche', 'botte', 'boîte', 'sachet'] as const
export type Unit = (typeof UNITS)[number]

// Rayons dans l'ordre d'un parcours type en magasin Lidl.
export const AISLES = [
  { id: 'fruits-legumes', label: 'Fruits & légumes', icon: 'i-lucide-carrot' },
  { id: 'boulangerie', label: 'Boulangerie', icon: 'i-lucide-croissant' },
  { id: 'cremerie', label: 'Crèmerie, œufs & fromages', icon: 'i-lucide-milk' },
  { id: 'boucherie', label: 'Viandes & volailles', icon: 'i-lucide-beef' },
  { id: 'poissonnerie', label: 'Poissons & fruits de mer', icon: 'i-lucide-fish' },
  { id: 'charcuterie-traiteur', label: 'Charcuterie & traiteur', icon: 'i-lucide-ham' },
  { id: 'epicerie-salee', label: 'Épicerie salée', icon: 'i-lucide-wheat' },
  { id: 'epicerie-sucree', label: 'Épicerie sucrée', icon: 'i-lucide-cookie' },
  { id: 'surgeles', label: 'Surgelés', icon: 'i-lucide-snowflake' },
  { id: 'boissons', label: 'Boissons', icon: 'i-lucide-cup-soda' },
  { id: 'autres', label: 'Autres', icon: 'i-lucide-package' },
] as const

export type AisleId = (typeof AISLES)[number]['id']
export const AISLE_IDS = AISLES.map(a => a.id) as [AisleId, ...AisleId[]]
