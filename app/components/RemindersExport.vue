<script setup lang="ts">
import { shortcutUrl } from '#shared/shopping-list'

const props = defineProps<{ lines: string[] }>()

const DEFAULT_SHORTCUT = 'Ajouter aux Courses'

const toast = useToast()
const shortcutName = usePersistedState('remindersShortcut', () => DEFAULT_SHORTCUT)
const setupDone = usePersistedState('remindersSetupDone', () => false)
const guideOpen = ref(false)

function send() {
  if (!props.lines.length) {
    toast.add({ title: 'Rien à envoyer', description: 'Tous les articles sont déjà cochés.', icon: 'i-lucide-info' })
    return
  }
  // La première fois, on explique comment créer le raccourci.
  if (!setupDone.value) {
    guideOpen.value = true
    return
  }
  launch()
}

function launch() {
  setupDone.value = true
  guideOpen.value = false
  window.location.href = shortcutUrl(shortcutName.value.trim() || DEFAULT_SHORTCUT, props.lines)
}

async function copyLines() {
  try {
    await navigator.clipboard.writeText(props.lines.join('\n'))
    toast.add({
      title: 'Liste copiée, une ligne par article',
      description: 'Dans Rappels, ouvre ta liste Courses, touche « Nouveau rappel » et colle : chaque ligne devient un rappel.',
      icon: 'i-lucide-check',
      color: 'success',
    })
  }
  catch {
    toast.add({ title: 'Copie impossible', description: 'Ton navigateur bloque le presse-papiers.', color: 'error' })
  }
}
</script>

<template>
  <div class="flex">
    <UFieldGroup>
      <UButton icon="i-lucide-list-todo" label="Rappels" @click="send" />
      <UButton icon="i-lucide-settings-2" aria-label="Configurer l'envoi vers Rappels" variant="subtle" @click="guideOpen = true" />
    </UFieldGroup>

    <UModal
      v-model:open="guideOpen"
      title="Envoyer vers Rappels"
      description="Le site ne peut pas écrire directement dans Rappels : il passe par un raccourci de l'app Raccourcis, à créer une seule fois."
    >
      <template #body>
        <div class="space-y-5 text-sm">
          <ol class="list-decimal space-y-2 ps-5">
            <li>
              Ouvre l'app <strong>Raccourcis</strong>, touche <strong>+</strong> et nomme le raccourci
              <strong>{{ shortcutName || DEFAULT_SHORTCUT }}</strong> (le même nom que ci-dessous).
            </li>
            <li>
              Ajoute l'action <strong>Séparer le texte</strong>. Touche « Texte » et choisis
              <strong>Entrée du raccourci</strong>, puis règle le séparateur sur <strong>Nouvelles lignes</strong>.
              Si un bloc « Recevoir … en entrée » apparaît en haut, laisse-le tel quel.
            </li>
            <li>Ajoute l'action <strong>Répéter avec chaque élément</strong> : elle utilise le texte séparé.</li>
            <li>
              Dans la boucle, ajoute <strong>Ajouter un nouveau rappel</strong> : touche « Rappel » et choisis
              <strong>Élément répété</strong>, puis touche la liste et choisis <strong>Courses</strong>.
            </li>
            <li>Touche <strong>OK</strong>. La première fois, l'iPhone te demandera d'autoriser l'accès à Rappels.</li>
          </ol>

          <UFormField label="Nom du raccourci" help="Doit être identique au nom donné dans l'app Raccourcis.">
            <UInput v-model="shortcutName" :placeholder="DEFAULT_SHORTCUT" class="w-full" />
          </UFormField>

          <p class="text-muted">
            Pas envie de créer le raccourci ? Copie la liste et colle-la directement dans ta liste Courses :
            l'iPhone crée un rappel par ligne.
          </p>
        </div>
      </template>

      <template #footer>
        <div class="flex w-full flex-wrap justify-end gap-2">
          <UButton label="Copier une ligne par article" icon="i-lucide-copy" color="neutral" variant="outline" @click="copyLines" />
          <UButton label="Envoyer vers Rappels" icon="i-lucide-send" :disabled="!lines.length" @click="launch" />
        </div>
      </template>
    </UModal>
  </div>
</template>
