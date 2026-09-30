<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[] = [
  { label: 'Ma semaine', icon: 'i-lucide-calendar-days', to: '/' },
  { label: 'Courses', icon: 'i-lucide-shopping-cart', to: '/courses' },
  { label: 'Réglages', icon: 'i-lucide-settings', to: '/preferences' },
]

onMounted(() => usePlanner().resume())
</script>

<template>
  <UApp :locale="fr">
    <UHeader title="Elle est prête la bouffe ?" to="/">
      <template #title>
        <span class="flex items-center gap-2 font-bold">
          <UIcon name="i-lucide-chef-hat" class="size-6 text-primary" />
          <span>Elle est prête la bouffe&nbsp;?</span>
        </span>
      </template>

      <UNavigationMenu :items="links" />

      <template #right>
        <UColorModeButton />
      </template>

      <template #body>
        <UNavigationMenu :items="links" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <UContainer class="py-6 sm:py-10">
        <NuxtPage />
      </UContainer>
    </UMain>
  </UApp>
</template>
