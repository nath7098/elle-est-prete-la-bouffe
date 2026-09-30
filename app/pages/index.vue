<script setup lang="ts">
const planner = usePlanner()
const { plan, preferences, preferencesSaved, generatingPlan, meals, readyCount, allRecipesReady, plannedCost } = planner

const selectedId = ref<string | null>(null)
const recipeOpen = ref(false)
const selectedMeal = computed(() => meals.value.find(meal => meal.id === selectedId.value) ?? null)

const slotsCount = computed(() => preferences.value.days.length * preferences.value.mealTypes.length)

function openRecipe(id: string) {
  selectedId.value = id
  recipeOpen.value = true
}

function compose() {
  if (plan.value && !window.confirm('Recomposer toute la semaine ? Les plats et la liste de courses actuels seront remplacés.')) return
  void planner.generatePlan()
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
          Ma semaine
        </h1>
        <p class="mt-1 max-w-2xl text-muted">
          {{ plan?.summary || 'Claude compose tes repas selon tes goûts, ton matériel et ton budget, puis prépare ta liste de courses Lidl.' }}
        </p>
      </div>
      <div v-if="plan || preferencesSaved" class="flex shrink-0 gap-2">
        <UButton to="/preferences" icon="i-lucide-settings" color="neutral" variant="outline" label="Réglages" />
        <UButton
          :label="plan ? 'Recomposer' : 'Composer ma semaine'"
          icon="i-lucide-sparkles"
          :loading="generatingPlan"
          @click="compose"
        />
      </div>
    </div>

    <!-- Première visite -->
    <UCard v-if="!plan && !preferencesSaved && !generatingPlan">
      <div class="flex flex-col items-center gap-4 py-8 text-center">
        <UIcon name="i-lucide-chef-hat" class="size-12 text-primary" />
        <div>
          <h2 class="text-lg font-semibold text-highlighted">
            Bienvenue !
          </h2>
          <p class="mt-1 max-w-md text-muted">
            Indique la taille de ton foyer, ton budget et tes goûts : Claude s'occupe du menu et de la liste de courses.
          </p>
        </div>
        <div class="flex flex-wrap justify-center gap-2">
          <UButton to="/preferences" label="Mes réglages" icon="i-lucide-settings" size="lg" />
          <UButton label="Essayer tout de suite" color="neutral" variant="outline" size="lg" @click="compose" />
        </div>
      </div>
    </UCard>

    <!-- Génération en cours -->
    <div v-else-if="generatingPlan" class="space-y-4">
      <p class="flex items-center gap-2 text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin text-primary" />
        Claude compose ta semaine… (compte une trentaine de secondes)
      </p>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <UCard v-for="index in slotsCount" :key="index">
          <div class="space-y-3">
            <USkeleton class="h-3 w-24" />
            <USkeleton class="h-5 w-3/4" />
            <USkeleton class="h-12 w-full" />
            <USkeleton class="h-5 w-1/2" />
          </div>
        </UCard>
      </div>
    </div>

    <!-- Semaine prévue -->
    <template v-else-if="plan">
      <div class="grid gap-4 md:grid-cols-3">
        <UCard class="md:col-span-2">
          <BudgetGauge label="Coût estimé des plats" :value="plannedCost" :budget="preferences.weeklyBudget" />
        </UCard>
        <UCard>
          <div class="space-y-2">
            <div class="flex items-baseline justify-between text-sm">
              <span class="text-muted">Recettes prêtes</span>
              <span class="font-semibold text-highlighted">{{ readyCount }} / {{ meals.length }}</span>
            </div>
            <UProgress :model-value="meals.length ? (readyCount / meals.length) * 100 : 0" size="md" />
            <UButton
              to="/courses"
              :label="allRecipesReady ? 'Ma liste de courses' : 'Recettes en cours…'"
              icon="i-lucide-shopping-cart"
              :variant="allRecipesReady ? 'solid' : 'soft'"
              block
              class="mt-2"
            />
          </div>
        </UCard>
      </div>

      <div v-if="meals.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MealCard
          v-for="meal in meals"
          :key="meal.id"
          :meal="meal"
          @open="openRecipe(meal.id)"
          @swap="planner.swapMeal(meal.id, $event)"
          @remove="planner.removeMeal(meal.id)"
          @retry="planner.retryRecipe(meal.id)"
        />
      </div>
      <UCard v-else>
        <p class="py-6 text-center text-muted">
          Tu as retiré tous les repas. Clique sur « Recomposer » pour une nouvelle semaine.
        </p>
      </UCard>
    </template>

    <UCard v-else>
      <div class="flex flex-col items-center gap-4 py-8 text-center">
        <UIcon name="i-lucide-utensils" class="size-12 text-primary" />
        <p class="max-w-md text-muted">
          Tes réglages sont enregistrés. Il ne reste plus qu'à composer ta semaine.
        </p>
        <UButton label="Composer ma semaine" icon="i-lucide-sparkles" size="lg" @click="compose" />
      </div>
    </UCard>

    <RecipeSlideover v-model:open="recipeOpen" :meal="selectedMeal" />
  </div>
</template>
