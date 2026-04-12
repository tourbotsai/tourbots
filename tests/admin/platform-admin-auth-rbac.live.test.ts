import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin platform auth and RBAC smoke', () => {
  it('rejects missing auth and accepts platform admin bearer token', async () => {
    const unauthorisedResponse = await fetch(`${ctx.baseUrl}/api/admin/platform-metrics`, {
      method: 'GET',
    })
    expect(unauthorisedResponse.status).toBe(401)

    const authorisedResponse = await fetch(`${ctx.baseUrl}/api/admin/platform-metrics`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const payload = await authorisedResponse.json()
    expect(authorisedResponse.status).toBe(200)
    expect(payload).toHaveProperty('data')
  }, 60_000)
})
