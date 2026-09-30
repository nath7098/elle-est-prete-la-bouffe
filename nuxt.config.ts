// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-30',
  devtools: { enabled: true },

  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  icon: {
    // Toutes les icônes utilisées sont embarquées : aucun appel à l'API Iconify.
    clientBundle: {
      scan: { globInclude: ['app/**/*.{vue,ts}', 'shared/**/*.ts'] },
    },
  },

  // Tout l'état (préférences, menus, liste) vit dans le navigateur :
  // pas besoin de rendu serveur, seules les routes /api tournent côté serveur.
  ssr: false,

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'Elle est prête la bouffe ?',
      meta: [
        { name: 'description', content: 'Menus de la semaine proposés par Claude et liste de courses Lidl.' },
        { name: 'theme-color', content: '#f97316' },
      ],
    },
  },

  runtimeConfig: {
    // Surchargés par NUXT_APP_PASSWORD et NUXT_ANTHROPIC_MODEL.
    // La clé API est lue directement par le SDK dans ANTHROPIC_API_KEY.
    appPassword: '',
    anthropicModel: 'claude-opus-5-5',
  },

  nitro: {
    // Une semaine complète peut prendre plus d'une minute à générer.
    vercel: { functions: { maxDuration: 300 } },
  },
})
