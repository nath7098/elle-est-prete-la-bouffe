import { RecipeRequestSchema, RecipeSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const { preferences, meal } = await readValidatedBody(event, RecipeRequestSchema.parse)

  return askClaude({
    system: SYSTEM_PROMPT,
    prompt: buildRecipePrompt(preferences, meal),
    schema: RecipeSchema,
    effort: 'low',
  })
})
