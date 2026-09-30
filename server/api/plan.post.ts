import { PlanOutputSchema, PlanRequestSchema, type MealIdea } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const { preferences } = await readValidatedBody(event, PlanRequestSchema.parse)

  const plan = await askClaude({
    system: SYSTEM_PROMPT,
    prompt: buildPlanPrompt(preferences),
    schema: PlanOutputSchema,
    effort: 'medium',
  })

  // Un plat par créneau demandé, dans l'ordre de la semaine.
  const remaining = [...plan.meals]
  const meals = planSlots(preferences).flatMap((slot): MealIdea[] => {
    const index = remaining.findIndex(meal => meal.day === slot.day && meal.mealType === slot.mealType)
    const meal = index >= 0 ? remaining.splice(index, 1)[0] : remaining.shift()
    return meal ? [{ ...meal, ...slot }] : []
  })

  return { summary: plan.summary, meals }
})
