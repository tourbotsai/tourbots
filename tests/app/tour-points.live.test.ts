import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, type LiveAppContext } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext

beforeAll(async () => {
  ctx = await getLiveAppContext()
}, 30_000)

describe('live app tour points smoke', () => {
  it('returns points for selected tour and all venue points', async () => {
    const perTourResponse = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/points`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const perTourPayload = await perTourResponse.json()

    expect(perTourResponse.status).toBe(200)
    expect(perTourPayload).toHaveProperty('points')
    expect(Array.isArray(perTourPayload.points)).toBe(true)

    const venuePointsResponse = await fetch(`${ctx.baseUrl}/api/app/tours/venue/${ctx.venueId}/points`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const venuePointsPayload = await venuePointsResponse.json()

    expect(venuePointsResponse.status).toBe(200)
    expect(Array.isArray(venuePointsPayload)).toBe(true)
  }, 40_000)
})
