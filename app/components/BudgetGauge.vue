<script setup lang="ts">
import { formatEuros } from '#shared/shopping-list'

const props = defineProps<{
  label: string
  value: number
  budget: number
}>()

const ratio = computed(() => (props.budget > 0 ? props.value / props.budget : 0))
const color = computed(() => {
  if (ratio.value <= 1) return 'success' as const
  if (ratio.value <= 1.1) return 'warning' as const
  return 'error' as const
})
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-baseline justify-between gap-4 text-sm">
      <span class="text-muted">{{ label }}</span>
      <span>
        <span class="font-semibold text-highlighted">{{ formatEuros(value) }}</span>
        <span class="text-muted"> / {{ formatEuros(budget) }}</span>
      </span>
    </div>
    <UProgress :model-value="Math.min(ratio, 1) * 100" :color="color" size="md" />
    <p v-if="ratio > 1" class="text-xs text-error">
      Dépassement de {{ formatEuros(value - budget) }} : remplace un plat ou deux par des idées moins chères.
    </p>
  </div>
</template>
