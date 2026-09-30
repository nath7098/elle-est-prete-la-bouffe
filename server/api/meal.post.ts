import { MealIdeaSchema, SwapMealRequestSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const input = await readValidatedBody(event, SwapMealRequestSchema.parse)

  const meal = await askClaude({
    system: SYSTEM_PROMPT,
    prompt: buildSwapPrompt(input),
    schema: MealIdeaSchema,
    effort: 'medium',
  })

  return { ...meal, day: input.day, mealType: input.mealType }
})
