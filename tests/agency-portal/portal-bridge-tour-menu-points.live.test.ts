import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, getLiveAgencyPortalHeaders, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal tour bridge smoke', () => {
  it('loads tour menu and points through portal session cookies', async () => {
    const menuResponse = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/menu`, {
      method: 'GET',
      headers: getLiveAgencyPortalHeaders(ctx),
    })
    const menuPayload = await menuResponse.json()

    expect(menuResponse.status).toBe(200)
    expect(menuPayload).toHaveProperty('settings')
    expect(Array.isArray(menuPayload?.blocks)).toBe(true)

    const pointsResponse = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/points`, {
      method: 'GET',
      headers: getLiveAgencyPortalHeaders(ctx),
    })
    const pointsPayload = await pointsResponse.json()

    expect(pointsResponse.status).toBe(200)
    expect(Array.isArray(pointsPayload?.points)).toBe(true)
  }, 60_000)
})
