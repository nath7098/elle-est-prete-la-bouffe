const PREFIX = 'bouffe:'
const persisted = new Set<string>()

/**
 * État partagé (useState) sauvegardé dans le localStorage du navigateur.
 * La sauvegarde est rattachée à un scope détaché pour survivre aux changements de page.
 */
export function usePersistedState<T>(key: string, init: () => T) {
  const state = useState<T>(key, () => {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      if (raw !== null) return JSON.parse(raw) as T
    }
    catch {
      // Stockage indisponible (navigation privée…) : on repart des valeurs par défaut.
    }
    return init()
  })

  if (!persisted.has(key)) {
    persisted.add(key)
    effectScope(true).run(() => {
      watch(state, (value) => {
        try {
          localStorage.setItem(PREFIX + key, JSON.stringify(value))
        }
        catch {
          // Quota dépassé ou stockage bloqué : l'appli continue sans sauvegarde.
        }
      }, { deep: true })
    })
  }

  return state
}
