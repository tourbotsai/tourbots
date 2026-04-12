import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'

let ctx: LiveChatbotContext

beforeAll(async () => {
  ctx = await getLiveChatbotContext()
}, 30_000)

describe('live app chatbot triggers smoke', () => {
  it('returns trigger list and tour points for the live chatbot config', async () => {
    const query = new URLSearchParams({
      chatbotConfigId: ctx.chatbotConfigId,
    })

    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/triggers?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toHaveProperty('triggers')
    expect(payload).toHaveProperty('tourPoints')
    expect(Array.isArray(payload.triggers)).toBe(true)
    expect(Array.isArray(payload.tourPoints)).toBe(true)
  }, 30_000)
})
