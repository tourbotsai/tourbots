import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'

let ctx: LiveChatbotContext

beforeAll(async () => {
  ctx = await getLiveChatbotContext()
}, 90_000)

describe('live app chatbot chat tour scoping', () => {
  it('does not fail config resolution when tourId is provided', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: ctx.venueId,
        tourId: ctx.tourId,
        chatbotType: 'tour',
        message: 'Quick test message for chatbot route scoping.',
        conversationHistory: [],
      }),
    })

    expect([200, 402, 429]).toContain(response.status)

    if (response.status !== 200) {
      const payload = await response.json()
      expect(payload?.error).not.toContain('chatbot configuration not found')
    }
  }, 45_000)

  it('does not fail config resolution when tourId is omitted', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/chat`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: ctx.venueId,
        chatbotType: 'tour',
        message: 'Quick fallback config-selection test message.',
        conversationHistory: [],
      }),
    })

    expect([200, 402, 429]).toContain(response.status)

    if (response.status !== 200) {
      const payload = await response.json()
      expect(payload?.error).not.toContain('chatbot configuration not found')
    }
  }, 45_000)
})
