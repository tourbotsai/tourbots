import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, getLiveAgencyPortalHeaders, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal public auth smoke', () => {
  it('returns authenticated session then logs out successfully', async () => {
    const sessionResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/auth/session?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      {
        method: 'GET',
        headers: getLiveAgencyPortalHeaders(ctx),
      }
    )
    const sessionPayload = await sessionResponse.json()

    expect(sessionResponse.status).toBe(200)
    expect(sessionPayload?.authenticated).toBe(true)
    expect(sessionPayload?.share?.shareSlug).toBe(ctx.shareSlug)
    expect(typeof sessionPayload?.csrfToken).toBe('string')

    const logoutResponse = await fetch(`${ctx.baseUrl}/api/public/agency-portal/auth/logout`, {
      method: 'POST',
      headers: getLiveAgencyPortalHeaders(ctx),
    })
    const logoutPayload = await logoutResponse.json()

    expect(logoutResponse.status).toBe(200)
    expect(logoutPayload?.success).toBe(true)

    const afterLogoutResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/auth/session?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      {
        method: 'GET',
        headers: getLiveAgencyPortalHeaders(ctx),
      }
    )
    const afterLogoutPayload = await afterLogoutResponse.json()

    expect(afterLogoutResponse.status).toBe(200)
    expect(afterLogoutPayload?.authenticated).toBe(false)
  }, 60_000)
})
