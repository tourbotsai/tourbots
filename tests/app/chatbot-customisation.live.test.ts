import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'

let ctx: LiveChatbotContext

beforeAll(async () => {
  ctx = await getLiveChatbotContext()
}, 30_000)

describe('live app chatbot customisation smoke', () => {
  it('returns customisation for the live venue and tour', async () => {
    const query = new URLSearchParams({
      venueId: ctx.venueId,
      chatbotType: 'tour',
      tourId: ctx.tourId,
    })

    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/customisation?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toBeTruthy()
    expect(payload.venue_id).toBe(ctx.venueId)
    expect(payload.tour_id).toBe(ctx.tourId)
    expect(payload.chatbot_type).toBe('tour')
  }, 30_000)
})
