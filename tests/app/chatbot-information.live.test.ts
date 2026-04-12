import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'

let ctx: LiveChatbotContext

beforeAll(async () => {
  ctx = await getLiveChatbotContext()
}, 30_000)

describe('live app chatbot information smoke', () => {
  it('returns information sections for the live chatbot config', async () => {
    const query = new URLSearchParams({
      chatbotConfigId: ctx.chatbotConfigId,
    })

    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/info-sections?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload)).toBe(true)
    expect(payload.length).toBeGreaterThan(0)
    expect(payload[0]).toHaveProperty('id')
    expect(payload[0]).toHaveProperty('section_key')
    expect(payload[0]).toHaveProperty('fields')
  }, 30_000)
})
