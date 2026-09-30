import { ShoppingListOutputSchema, ShoppingListRequestSchema } from '#shared/schemas'

export default defineEventHandler(async (event) => {
  const { preferences, needs } = await readValidatedBody(event, ShoppingListRequestSchema.parse)

  const list = await askClaude({
    system: SYSTEM_PROMPT,
    prompt: buildShoppingListPrompt(preferences, needs),
    schema: ShoppingListOutputSchema,
    effort: 'medium',
  })

  return {
    tips: list.tips,
    items: list.items.map(item => ({
      ...item,
      packages: Math.max(1, Math.round(item.packages)),
      unitPrice: Math.max(0, Math.round(item.unitPrice * 100) / 100),
    })),
  }
})
