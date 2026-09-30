<script setup lang="ts">
import { formatEuros, groupByAisle, itemTotal, listTotal, shoppingListToText } from '#shared/shopping-list'

const planner = usePlanner()
const { plan, preferences, shoppingList, manualItems, generatingList, meals, readyCount, allRecipesReady, listOutdated } = planner
const toast = useToast()

const hideChecked = usePersistedState('hideChecked', () => false)
const newItem = ref('')

const items = computed(() => shoppingList.value?.items ?? [])
const groups = computed(() => groupByAisle(items.value.filter(item => !item.pantryCheck)))
const pantryItems = computed(() => items.value.filter(item => item.pantryCheck))
const total = computed(() => listTotal(items.value))
const remaining = computed(() => listTotal(items.value.filter(item => !item.checked)))

const toBuy = computed(() => [...items.value.filter(item => !item.pantryCheck), ...manualItems.value])
const checkedCount = computed(() => toBuy.value.filter(item => item.checked).length)

const canShare = import.meta.client && typeof navigator.share === 'function'

function listText() {
  const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
  return shoppingListToText(items.value, manualItems.value, `Courses Lidl du ${date}`)
}

async function copy() {
  try {
    await navigator.clipboard.writeText(listText())
    toast.add({ title: 'Liste copiée', icon: 'i-lucide-check', color: 'success' })
  }
  catch {
    toast.add({ title: 'Copie impossible', description: 'Ton navigateur bloque le presse-papiers.', color: 'error' })
  }
}

async function share() {
  try {
    await navigator.share({ title: 'Liste de courses Lidl', text: listText() })
  }
  catch {
    // Partage annulé par l'utilisateur.
  }
}

function addItem() {
  planner.addManualItem(newItem.value)
  newItem.value = ''
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          Liste de courses Lidl
        </h1>
        <p class="mt-1 max-w-2xl text-muted">
          Tous les ingrédients de la semaine, regroupés et rangés dans l'ordre des rayons. Coche au fur et à mesure en magasin.
        </p>
      </div>
      <div v-if="shoppingList" class="flex shrink-0 flex-wrap gap-2">
        <UButton icon="i-lucide-copy" label="Copier" color="neutral" variant="outline" @click="copy" />
        <UButton v-if="canShare" icon="i-lucide-share-2" label="Partager" color="neutral" variant="outline" @click="share" />
      </div>
    </div>

    <!-- Pas encore de menu -->
    <UCard v-if="!plan || !meals.length">
      <div class="flex flex-col items-center gap-4 py-8 text-center">
        <UIcon name="i-lucide-calendar-days" class="size-12 text-primary" />
        <p class="max-w-md text-muted">
          Compose d'abord ta semaine : la liste de courses sera préparée à partir des recettes.
        </p>
        <UButton to="/" label="Composer ma semaine" icon="i-lucide-sparkles" />
      </div>
    </UCard>

    <template v-else>
      <!-- Liste à (re)générer -->
      <UAlert
        v-if="!allRecipesReady"
        icon="i-lucide-loader-circle"
        color="neutral"
        variant="subtle"
        title="Recettes en préparation"
        :description="`${readyCount} recette(s) prête(s) sur ${meals.length}. La liste pourra être préparée dès qu'elles seront toutes prêtes.`"
      />
      <UAlert
        v-else-if="!shoppingList || listOutdated"
        :icon="listOutdated ? 'i-lucide-refresh-cw' : 'i-lucide-list-checks'"
        :color="listOutdated ? 'warning' : 'primary'"
        variant="subtle"
        :title="listOutdated ? 'Le menu a changé' : 'Toutes les recettes sont prêtes'"
        :description="listOutdated
          ? 'Mets la liste à jour pour qu\'elle corresponde aux plats de la semaine. Les articles déjà cochés le resteront.'
          : 'Claude va regrouper les ingrédients et choisir les produits et conditionnements Lidl.'"
        :actions="[{
          label: listOutdated ? 'Mettre à jour la liste' : 'Préparer ma liste Lidl',
          icon: 'i-lucide-sparkles',
          loading: generatingList,
          onClick: () => planner.generateShoppingList(),
        }]"
      />

      <div v-if="shoppingList" class="grid gap-6 lg:grid-cols-3">
        <div class="space-y-6 lg:col-span-2">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-muted">
              {{ checkedCount }} / {{ toBuy.length }} articles dans le chariot
            </p>
            <div class="flex items-center gap-2">
              <USwitch v-model="hideChecked" label="Masquer les articles pris" size="sm" />
              <UButton
                v-if="checkedCount"
                icon="i-lucide-rotate-ccw"
                color="neutral"
                variant="ghost"
                size="sm"
                aria-label="Tout décocher"
                @click="planner.uncheckAll()"
              />
            </div>
          </div>

          <UCard v-for="group in groups" :key="group.id" :ui="{ header: 'py-3', body: 'p-0 sm:p-0' }">
            <template #header>
              <h2 class="flex items-center gap-2 font-semibold text-highlighted">
                <UIcon :name="group.icon" class="size-5 text-primary" />
                {{ group.label }}
              </h2>
            </template>
            <ul class="divide-y divide-default">
              <template v-for="item in group.items" :key="item.id">
                <li v-if="!(hideChecked && item.checked)" class="flex items-start gap-3 px-4 py-3 sm:px-6">
                  <UCheckbox v-model="item.checked" :aria-label="item.product" class="mt-0.5" />
                  <button
                    type="button"
                    class="min-w-0 flex-1 text-start"
                    :class="item.checked && 'line-through opacity-50'"
                    @click="item.checked = !item.checked"
                  >
                    <span class="font-medium text-highlighted">{{ item.product }}</span>
                    <span v-if="item.packages > 1" class="ms-1 font-semibold text-primary">×{{ item.packages }}</span>
                    <span class="block text-xs text-muted">{{ item.needed }} · {{ item.meals.join(', ') }}</span>
                  </button>
                  <span class="shrink-0 text-sm tabular-nums text-muted">{{ formatEuros(itemTotal(item)) }}</span>
                </li>
              </template>
            </ul>
          </UCard>

          <UCard :ui="{ header: 'py-3' }">
            <template #header>
              <h2 class="flex items-center gap-2 font-semibold text-highlighted">
                <UIcon name="i-lucide-plus" class="size-5 text-primary" />
                Ajouts perso
              </h2>
            </template>
            <form class="flex gap-2" @submit.prevent="addItem">
              <UInput v-model="newItem" placeholder="Café, lessive, yaourts…" class="flex-1" />
              <UButton type="submit" icon="i-lucide-plus" label="Ajouter" :disabled="!newItem.trim()" />
            </form>
            <ul v-if="manualItems.length" class="mt-3 divide-y divide-default">
              <template v-for="item in manualItems" :key="item.id">
                <li v-if="!(hideChecked && item.checked)" class="flex items-center gap-3 py-2">
                  <UCheckbox v-model="item.checked" :aria-label="item.name" />
                  <span class="flex-1" :class="item.checked && 'line-through opacity-50'">{{ item.name }}</span>
                  <UButton
                    icon="i-lucide-x"
                    color="neutral"
                    variant="ghost"
                    size="xs"
                    aria-label="Supprimer"
                    @click="planner.removeManualItem(item.id)"
                  />
                </li>
              </template>
            </ul>
          </UCard>
        </div>

        <div class="space-y-6">
          <UCard>
            <div class="space-y-4">
              <BudgetGauge label="Total estimé" :value="total" :budget="preferences.weeklyBudget" />
              <div class="flex items-baseline justify-between text-sm">
                <span class="text-muted">Reste à prendre</span>
                <span class="font-semibold text-highlighted">{{ formatEuros(remaining) }}</span>
              </div>
              <p class="text-xs text-muted">
                Prix estimés par Claude à partir des tarifs Lidl habituels : ils peuvent varier selon le magasin et les promos.
              </p>
            </div>
          </UCard>

          <UCard v-if="pantryItems.length" :ui="{ header: 'py-3' }">
            <template #header>
              <h2 class="font-semibold text-highlighted">
                À vérifier dans tes placards
              </h2>
              <p class="text-xs text-muted">
                Non comptés dans le total. Coche ce que tu dois racheter pour t'en souvenir.
              </p>
            </template>
            <ul class="space-y-2">
              <li v-for="item in pantryItems" :key="item.id" class="flex items-start gap-3 text-sm">
                <UCheckbox v-model="item.checked" :aria-label="item.name" class="mt-0.5" />
                <span>
                  <span class="text-highlighted">{{ item.name }}</span>
                  <span class="text-muted"> · {{ item.needed }}</span>
                </span>
              </li>
            </ul>
          </UCard>

          <UCard v-if="shoppingList.tips.length" :ui="{ header: 'py-3' }">
            <template #header>
              <h2 class="flex items-center gap-2 font-semibold text-highlighted">
                <UIcon name="i-lucide-lightbulb" class="size-5 text-primary" />
                Pour payer moins cher
              </h2>
            </template>
            <ul class="list-disc space-y-1 ps-5 text-sm text-muted">
              <li v-for="tip in shoppingList.tips" :key="tip">
                {{ tip }}
              </li>
            </ul>
          </UCard>

          <UAlert
            icon="i-lucide-store"
            color="neutral"
            variant="soft"
            title="Et l'appli Lidl Plus ?"
            description="Lidl ne permet pas à une autre application de remplir la liste de courses de ton compte Lidl Plus : l'envoi direct n'est pas possible pour l'instant. Utilise cette page en magasin (elle reste enregistrée sur ton téléphone), ou copie et partage la liste."
          />
        </div>
      </div>
    </template>
  </div>
</template>
