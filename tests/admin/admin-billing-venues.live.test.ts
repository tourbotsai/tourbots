import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin billing venues smoke', () => {
  it('loads active plans, add-ons, and venue billing rows', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/admin/billing/venues`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(payload?.plans)).toBe(true)
    expect(Array.isArray(payload?.addons)).toBe(true)
    expect(Array.isArray(payload?.rows)).toBe(true)
  }, 60_000)
})
