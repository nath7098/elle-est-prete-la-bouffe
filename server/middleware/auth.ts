import { timingSafeEqual } from 'node:crypto'

// Si NUXT_APP_PASSWORD est défini, toutes les routes /api exigent ce code
// (en-tête x-app-password) : sans lui, n'importe qui pourrait consommer les crédits Claude.
export default defineEventHandler((event) => {
  const { appPassword } = useRuntimeConfig(event)
  if (!appPassword || !event.path.startsWith('/api/')) return

  const provided = getHeader(event, 'x-app-password') ?? ''
  const expected = Buffer.from(appPassword)
  const actual = Buffer.from(provided)
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
    throw createError({ statusCode: 401, message: 'Code d\'accès manquant ou incorrect. Renseigne-le dans les Réglages.' })
  }
})
