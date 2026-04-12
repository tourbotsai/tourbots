import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal embed SSR smoke', () => {
  it('loads embed page for an active real share slug', async () => {
    const response = await fetch(`${ctx.baseUrl}/embed/agency/${encodeURIComponent(ctx.shareSlug)}`, {
      method: 'GET',
      headers: {
        Referer: 'http://localhost:3000/',
        Origin: 'http://localhost:3000',
      },
    })

    const html = await response.text()
    expect(response.status).toBe(200)
    expect(html.toLowerCase()).toContain('<html')
  }, 60_000)
})
