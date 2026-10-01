<script setup lang="ts">
import { DAY_LABELS, MEAL_TYPE_LABELS } from '#shared/constants'
import { formatQuantity } from '#shared/ingredients'
import { formatEuros } from '#shared/shopping-list'
import type { PlannedMeal } from '~/composables/usePlanner'

defineProps<{ meal: PlannedMeal | null }>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <USlideover
    v-model:open="open"
    :title="meal?.title ?? 'Recette'"
    :description="meal ? `${DAY_LABELS[meal.day]} · ${MEAL_TYPE_LABELS[meal.mealType]}` : undefined"
    :ui="{ content: 'max-w-xl' }"
  >
    <template #body>
      <div v-if="meal?.recipe" class="space-y-6">
        <p class="text-muted">
          {{ meal.description }}
        </p>

        <section v-if="meal.plate" class="rounded-lg border border-default p-3">
          <h3 class="mb-2 text-sm font-semibold text-highlighted">
            Assiette équilibrée
          </h3>
          <PlateSummary :plate="meal.plate" />
        </section>

        <div class="flex flex-wrap gap-2">
          <UBadge :label="`${meal.recipe.servings} pers.`" icon="i-lucide-users" color="neutral" variant="subtle" />
          <UBadge
            v-if="meal.recipe.kcalPerServing"
            :label="`≈ ${Math.round(meal.recipe.kcalPerServing)} kcal / portion`"
            icon="i-lucide-gauge"
            color="success"
            variant="subtle"
          />
          <UBadge :label="`Préparation ${meal.recipe.prepMinutes} min`" icon="i-lucide-clock" color="neutral" variant="subtle" />
          <UBadge :label="`Cuisson ${meal.recipe.cookMinutes} min`" icon="i-lucide-flame" color="neutral" variant="subtle" />
          <UBadge :label="`≈ ${formatEuros(meal.estimatedCost)}`" icon="i-lucide-wallet" color="neutral" variant="subtle" />
        </div>

        <section>
          <h3 class="mb-2 font-semibold text-highlighted">
            Ingrédients
          </h3>
          <ul class="divide-y divide-default rounded-lg border border-default">
            <li
              v-for="(ingredient, index) in meal.recipe.ingredients"
              :key="index"
              class="flex items-baseline justify-between gap-4 px-3 py-2 text-sm"
            >
              <span>
                <span class="text-highlighted">{{ ingredient.name }}</span>
                <span v-if="ingredient.preparation" class="text-muted">, {{ ingredient.preparation }}</span>
              </span>
              <span class="shrink-0 tabular-nums text-muted">{{ formatQuantity(ingredient.quantity, ingredient.unit) }}</span>
            </li>
          </ul>
        </section>

        <section>
          <h3 class="mb-2 font-semibold text-highlighted">
            Étapes
          </h3>
          <ol class="space-y-3">
            <li v-for="(step, index) in meal.recipe.steps" :key="index" class="flex gap-3 text-sm">
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {{ index + 1 }}
              </span>
              <span class="pt-0.5">{{ step }}</span>
            </li>
          </ol>
        </section>

        <p v-if="meal.recipe.equipment.length" class="text-sm text-muted">
          <UIcon name="i-lucide-cooking-pot" class="me-1 inline size-4 align-text-bottom" />
          Matériel : {{ meal.recipe.equipment.join(', ') }}
        </p>

        <UAlert
          v-if="meal.recipe.tip"
          title="L'astuce"
          :description="meal.recipe.tip"
          icon="i-lucide-lightbulb"
          color="primary"
          variant="soft"
        />
      </div>
    </template>
  </USlideover>
</template>
