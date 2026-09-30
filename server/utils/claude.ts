import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import type { z } from 'zod'

let client: Anthropic | undefined

function getClient(): Anthropic {
  // Lit ANTHROPIC_API_KEY dans l'environnement.
  client ??= new Anthropic()
  return client
}

interface AskOptions<T extends z.ZodType> {
  system: string
  prompt: string
  schema: T
  effort: 'low' | 'medium' | 'high'
}

/**
 * Appel à Claude avec une sortie JSON imposée par un schéma Zod.
 * Renvoie l'objet validé, ou lève une erreur HTTP lisible par l'appli.
 */
export async function askClaude<T extends z.ZodType>({ system, prompt, schema, effort }: AskOptions<T>): Promise<z.infer<T>> {
  const { anthropicModel } = useRuntimeConfig()

  let response
  try {
    response = await getClient().beta.messages.parse({
      model: anthropicModel,
      max_tokens: 16000,
      // Si le modèle décline la demande, l'API la rejoue d'elle-même sur le modèle de repli recommandé.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: {
        effort,
        format: betaZodOutputFormat(schema),
      },
      system,
      messages: [{ role: 'user', content: prompt }],
    })
  }
  catch (error) {
    throw toHttpError(error)
  }

  if (response.stop_reason === 'refusal') {
    throw createError({ statusCode: 422, message: 'Claude a refusé cette demande. Reformule tes préférences et réessaie.' })
  }
  if (response.stop_reason === 'max_tokens') {
    throw createError({ statusCode: 502, message: 'La réponse de Claude a été coupée (trop longue). Réessaie avec moins de repas.' })
  }
  if (!response.parsed_output) {
    throw createError({ statusCode: 502, message: 'Réponse de Claude inattendue. Réessaie.' })
  }
  return response.parsed_output
}

function toHttpError(error: unknown) {
  if (error instanceof Anthropic.AuthenticationError) {
    return createError({ statusCode: 500, message: 'Clé API Anthropic invalide ou absente (variable ANTHROPIC_API_KEY).' })
  }
  if (error instanceof Anthropic.RateLimitError) {
    return createError({ statusCode: 429, message: 'Trop de demandes envoyées à Claude. Patiente une minute et réessaie.' })
  }
  if (error instanceof Anthropic.APIError) {
    console.error('[claude]', error.status, error.message)
    return createError({ statusCode: 502, message: `Claude est indisponible pour le moment (erreur ${error.status ?? 'réseau'}).` })
  }
  if (error instanceof Anthropic.AnthropicError) {
    // JSON non conforme au schéma.
    console.error('[claude]', error.message)
    return createError({ statusCode: 502, message: 'Impossible d\'obtenir une réponse valide de Claude. Réessaie.' })
  }
  // Typiquement : aucune clé API configurée (le SDK lève alors une Error simple).
  console.error('[claude]', error)
  return createError({ statusCode: 500, message: 'Impossible d\'appeler Claude. Vérifie que la variable ANTHROPIC_API_KEY est bien configurée sur le serveur.' })
}
