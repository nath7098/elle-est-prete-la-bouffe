<script setup lang="ts">
import {
  DAYS,
  DAY_LABELS,
  DIETS,
  DIET_LABELS,
  EQUIPMENT_OPTIONS,
  EXCLUSION_OPTIONS,
  LEVELS,
  LEVEL_LABELS,
  MEAL_TYPES,
  MEAL_TYPE_LABELS,
} from '#shared/constants'
import { PreferencesSchema, type Preferences } from '#shared/schemas'

const { preferences, preferencesSaved } = usePlanner()
const accessCode = usePersistedState('accessCode', () => '')
const toast = useToast()

const state = reactive<Preferences>(structuredClone(toRaw(preferences.value)))

const dayItems = DAYS.map(day => ({ label: DAY_LABELS[day], value: day }))
const mealTypeItems = MEAL_TYPES.map(mealType => ({ label: MEAL_TYPE_LABELS[mealType], value: mealType }))
const dietItems = DIETS.map(diet => ({ label: DIET_LABELS[diet], value: diet }))
const levelItems = LEVELS.map(level => ({ label: LEVEL_LABELS[level], value: level }))

function reset() {
  Object.assign(state, defaultPreferences())
}

async function onSubmit() {
  preferences.value = structuredClone(toRaw(state))
  preferencesSaved.value = true
  toast.add({ title: 'Réglages enregistrés', description: 'Ils seront utilisés pour les prochains menus.', icon: 'i-lucide-check', color: 'success' })
  await navigateTo('/')
}
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-8">
    <div>
      <h1 class="text-2xl font-bold text-highlighted sm:text-3xl">
        Réglages
      </h1>
      <p class="mt-1 text-muted">
        Ce que Claude doit savoir pour composer tes menus.
      </p>
    </div>

    <UForm :schema="PreferencesSchema" :state="state" class="space-y-6" @submit="onSubmit">
      <UCard>
        <template #header>
          <h2 class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-users" class="size-5 text-primary" /> Le foyer
          </h2>
        </template>
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField label="Adultes" name="adults">
            <UInputNumber v-model="state.adults" :min="1" :max="12" class="w-full" />
          </UFormField>
          <UFormField label="Enfants" name="children">
            <UInputNumber v-model="state.children" :min="0" :max="12" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-calendar-days" class="size-5 text-primary" /> Les repas à prévoir
          </h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Jours" name="days">
            <UCheckboxGroup v-model="state.days" :items="dayItems" orientation="horizontal" class="flex-wrap" />
          </UFormField>
          <UFormField label="Repas" name="mealTypes">
            <UCheckboxGroup v-model="state.mealTypes" :items="mealTypeItems" orientation="horizontal" />
          </UFormField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField label="Budget courses de la semaine" name="weeklyBudget" help="Pour l'ensemble de ces repas.">
              <UInputNumber
                v-model="state.weeklyBudget"
                :min="5"
                :max="1000"
                :step="5"
                :format-options="{ style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Temps max par repas" name="maxMinutes" help="Préparation + cuisson, en minutes.">
              <UInputNumber v-model="state.maxMinutes" :min="10" :max="240" :step="5" class="w-full" />
            </UFormField>
          </div>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-salad" class="size-5 text-primary" /> Alimentation
          </h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Régime" name="diet">
            <USelect v-model="state.diet" :items="dietItems" class="w-full sm:w-72" />
          </UFormField>
          <UFormField label="Contraintes" name="exclusions">
            <UCheckboxGroup v-model="state.exclusions" :items="EXCLUSION_OPTIONS" orientation="horizontal" class="flex-wrap" />
          </UFormField>
          <UFormField label="Ce que vous n'aimez pas, allergies" name="dislikes">
            <UTextarea v-model="state.dislikes" placeholder="Ex. : pas de champignons, allergie aux crevettes…" :rows="2" autoresize class="w-full" />
          </UFormField>
          <UFormField label="Envies du moment" name="wishes">
            <UTextarea v-model="state.wishes" placeholder="Ex. : des soupes, un plat mexicain, un gratin le dimanche…" :rows="2" autoresize class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <UCard>
        <template #header>
          <h2 class="flex items-center gap-2 font-semibold text-highlighted">
            <UIcon name="i-lucide-cooking-pot" class="size-5 text-primary" /> En cuisine
          </h2>
        </template>
        <div class="space-y-4">
          <UFormField label="Équipement" name="equipment">
            <UCheckboxGroup v-model="state.equipment" :items="EQUIPMENT_OPTIONS" orientation="horizontal" class="flex-wrap" />
          </UFormField>
          <UFormField label="Niveau" name="level">
            <URadioGroup v-model="state.level" :items="levelItems" orientation="horizontal" />
          </UFormField>
          <UFormField label="Déjà dans les placards" name="pantry" help="Ces produits seront listés à part, à vérifier avant d'acheter.">
            <UTextarea v-model="state.pantry" :rows="2" autoresize class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <div class="flex flex-wrap justify-end gap-2">
        <UButton label="Valeurs par défaut" color="neutral" variant="ghost" @click="reset" />
        <UButton type="submit" label="Enregistrer" icon="i-lucide-check" size="lg" />
      </div>
    </UForm>

    <UCard>
      <template #header>
        <h2 class="flex items-center gap-2 font-semibold text-highlighted">
          <UIcon name="i-lucide-key-round" class="size-5 text-primary" /> Code d'accès
        </h2>
      </template>
      <UFormField
        label="Code d'accès à l'appli"
        help="Seulement si le serveur a été configuré avec NUXT_APP_PASSWORD. Enregistré sur cet appareil uniquement."
      >
        <UInput v-model="accessCode" type="password" autocomplete="current-password" class="w-full sm:w-72" />
      </UFormField>
    </UCard>
  </div>
</template>
