import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal app shares smoke', () => {
  it('creates a real share and returns it in share inventory', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/agency-portal/shares`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload?.entitlement?.addon_agency_portal).toBe(true)
    expect(Array.isArray(payload?.shares)).toBe(true)

    const createdShare = payload.shares.find((share: any) => share.id === ctx.shareId)
    expect(createdShare).toBeTruthy()
    expect(createdShare?.share_slug).toBe(ctx.shareSlug)
    expect(Array.isArray(createdShare?.users)).toBe(true)
    expect(createdShare.users.some((user: any) => user.email === ctx.clientEmail)).toBe(true)
  }, 60_000)
})
