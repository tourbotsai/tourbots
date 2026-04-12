import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, getLiveAgencyPortalHeaders, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal CSRF enforcement smoke', () => {
  it('rejects settings mutation without csrf header', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/public/agency-portal/settings`, {
      method: 'PUT',
      headers: getLiveAgencyPortalHeaders(ctx, { withJson: true }),
      body: JSON.stringify({
        shareSlug: ctx.shareSlug,
        updates: {
          welcome_message: 'CSRF test update',
        },
      }),
    })
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload?.error).toContain('CSRF')
  }, 60_000)
})
