import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'

let ctx: LiveChatbotContext

beforeAll(async () => {
  ctx = await getLiveChatbotContext()
}, 30_000)

describe('live app chatbot analytics smoke', () => {
  it('returns chatbot analytics stats for the live venue and tour', async () => {
    const query = new URLSearchParams({
      venueId: ctx.venueId,
      tourId: ctx.tourId,
      chatbotType: 'tour',
      type: 'stats',
    })

    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/analytics?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(typeof payload.totalMessages).toBe('number')
    expect(typeof payload.totalConversations).toBe('number')
    expect(typeof payload.totalSessions).toBe('number')
    expect(payload).toHaveProperty('venueStats')
  }, 30_000)
})
