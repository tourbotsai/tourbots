import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'

let ctx: LiveChatbotContext

beforeAll(async () => {
  ctx = await getLiveChatbotContext()
}, 90_000)

describe('live app chatbot config smoke', () => {
  it('returns tour chatbot config for the authenticated venue and tour', async () => {
    const query = new URLSearchParams({
      venueId: ctx.venueId,
      tourId: ctx.tourId,
      chatbotType: 'tour',
    })

    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/config?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toBeTruthy()
    expect(payload.id).toBe(ctx.chatbotConfigId)
    expect(payload.venue_id).toBe(ctx.venueId)
    expect(payload.tour_id).toBe(ctx.tourId)
  }, 30_000)
})
