import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin resources CMS smoke', () => {
  it('loads blogs and guides catalogues', async () => {
    const blogsResponse = await fetch(`${ctx.baseUrl}/api/admin/resources/blogs`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const blogsPayload = await blogsResponse.json()
    expect(blogsResponse.status).toBe(200)
    expect(blogsPayload?.success).toBe(true)
    expect(Array.isArray(blogsPayload?.blogs)).toBe(true)

    const guidesResponse = await fetch(`${ctx.baseUrl}/api/admin/resources/guides`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const guidesPayload = await guidesResponse.json()
    expect(guidesResponse.status).toBe(200)
    expect(guidesPayload?.success).toBe(true)
    expect(Array.isArray(guidesPayload?.guides)).toBe(true)
  }, 60_000)
})
