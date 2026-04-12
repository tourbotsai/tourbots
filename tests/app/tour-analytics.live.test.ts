import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, type LiveAppContext } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext

beforeAll(async () => {
  ctx = await getLiveAppContext()
}, 30_000)

describe('live app tour analytics smoke', () => {
  it('returns analytics summary for selected tour', async () => {
    const query = new URLSearchParams({
      venueId: ctx.venueId,
      tourId: ctx.tourId,
    })

    const response = await fetch(`${ctx.baseUrl}/api/app/tours/analytics?${query.toString()}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toHaveProperty('data')
    expect(payload).toHaveProperty('summary')
    expect(Array.isArray(payload.data)).toBe(true)
    expect(typeof payload.summary.tourViews).toBe('number')
    expect(typeof payload.summary.totalConversations).toBe('number')
    expect(typeof payload.summary.tourChatMessages).toBe('number')
    expect(typeof payload.summary.uniqueDomains).toBe('number')
  }, 40_000)
})
