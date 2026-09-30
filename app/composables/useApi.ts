/** $fetch vers nos routes /api, avec le code d'accès éventuel. */
export function useApi() {
  const accessCode = usePersistedState('accessCode', () => '')

  return $fetch.create({
    onRequest({ options }) {
      if (accessCode.value) options.headers.set('x-app-password', accessCode.value)
    },
  })
}

/** Message d'erreur lisible, quel que soit le type d'erreur. */
export function errorMessage(error: unknown): string {
  const fetchError = error as { name?: string, statusCode?: number, data?: { message?: unknown } } | null
  if (typeof fetchError?.data?.message === 'string') return fetchError.data.message
  if (fetchError?.statusCode === 504) return 'Le serveur a mis trop de temps à répondre. Réessaie.'
  if (fetchError?.name === 'FetchError') return 'Le serveur ne répond pas. Vérifie ta connexion.'
  if (error instanceof Error) return error.message
  return 'Une erreur inattendue est survenue.'
}
