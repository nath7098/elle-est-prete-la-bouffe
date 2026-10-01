<script setup lang="ts">
import type { Plate } from '#shared/schemas'

const props = defineProps<{ plate: Plate }>()

const rows = computed(() => [
  { label: 'Légumes', icon: 'i-lucide-leafy-green', value: props.plate.vegetables },
  { label: 'Protéines', icon: 'i-lucide-drumstick', value: props.plate.protein },
  { label: 'Féculents', icon: 'i-lucide-wheat', value: props.plate.starch },
].filter(row => row.value.trim()))
</script>

<template>
  <dl class="space-y-1 text-xs">
    <div v-for="row in rows" :key="row.label" class="flex gap-2">
      <dt class="flex w-24 shrink-0 items-center gap-1.5 font-medium text-highlighted">
        <UIcon :name="row.icon" class="size-3.5 text-success" />
        {{ row.label }}
      </dt>
      <dd class="text-muted">
        {{ row.value }}
      </dd>
    </div>
  </dl>
</template>
