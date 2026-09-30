<script setup lang="ts">
import { DAY_LABELS, MEAL_TYPE_LABELS } from '#shared/constants'
import { formatEuros } from '#shared/shopping-list'
import type { PlannedMeal } from '~/composables/usePlanner'

const props = defineProps<{ meal: PlannedMeal }>()

const emit = defineEmits<{
  open: []
  swap: [instruction: string]
  remove: []
  retry: []
}>()

const SUGGESTIONS = ['plus rapide', 'moins cher', 'végétarien', 'sans four', 'plus léger', 'que les enfants aiment']

const swapOpen = ref(false)
const instruction = ref('')

function swap(text = instruction.value) {
  emit('swap', text.trim())
  swapOpen.value = false
  instruction.value = ''
}

const busy = computed(() => props.meal.swapping === true)
</script>

<template>
  <UCard class="relative flex flex-col" :ui="{ body: 'flex-1 space-y-3', footer: 'flex items-center gap-1' }">
    <div class="flex items-center justify-between gap-2">
      <span class="text-xs font-semibold uppercase tracking-wide text-primary">
        {{ DAY_LABELS[meal.day] }} · {{ MEAL_TYPE_LABELS[meal.mealType] }}
      </span>
      <UBadge
        :label="formatEuros(meal.estimatedCost)"
        icon="i-lucide-wallet"
        color="neutral"
        variant="subtle"
        size="sm"
      />
    </div>

    <div>
      <h3 class="text-base font-semibold text-highlighted">
        {{ meal.title }}
      </h3>
      <p class="mt-1 text-sm text-muted">
        {{ meal.description }}
      </p>
    </div>

    <div class="flex flex-wrap gap-1.5">
      <UBadge :label="`${meal.totalMinutes} min`" icon="i-lucide-clock" color="neutral" variant="outline" size="sm" />
      <UBadge v-for="tag in meal.tags" :key="tag" :label="tag" color="primary" variant="soft" size="sm" />
    </div>

    <template #footer>
      <UButton
        v-if="meal.status === 'ready'"
        label="Recette"
        icon="i-lucide-book-open"
        variant="soft"
        @click="emit('open')"
      />
      <UTooltip v-else-if="meal.status === 'error'" :text="meal.error ?? 'Erreur'">
        <UButton label="Réessayer" icon="i-lucide-rotate-ccw" color="error" variant="soft" @click="emit('retry')" />
      </UTooltip>
      <UButton v-else label="Recette en préparation…" variant="ghost" color="neutral" loading disabled />

      <div class="ms-auto flex items-center gap-1">
        <UPopover v-model:open="swapOpen" :content="{ align: 'end' }">
          <UButton icon="i-lucide-shuffle" color="neutral" variant="ghost" aria-label="Changer de plat" :disabled="busy" />

          <template #content>
            <form class="w-72 space-y-3 p-3" @submit.prevent="swap()">
              <p class="text-sm font-medium text-highlighted">
                Changer ce plat
              </p>
              <UInput v-model="instruction" placeholder="Une envie ? (facultatif)" class="w-full" autofocus />
              <div class="flex flex-wrap gap-1">
                <UButton
                  v-for="suggestion in SUGGESTIONS"
                  :key="suggestion"
                  :label="suggestion"
                  size="xs"
                  color="neutral"
                  variant="outline"
                  @click="swap(suggestion)"
                />
              </div>
              <UButton type="submit" label="Proposer autre chose" icon="i-lucide-sparkles" block />
            </form>
          </template>
        </UPopover>

        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          aria-label="Retirer ce repas"
          :disabled="busy"
          @click="emit('remove')"
        />
      </div>
    </template>

    <div
      v-if="busy"
      class="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-lg bg-default/80 text-sm text-muted backdrop-blur-sm"
    >
      <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin text-primary" />
      Claude cherche une autre idée…
    </div>
  </UCard>
</template>
