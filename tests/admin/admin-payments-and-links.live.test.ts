import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin payment links and subscriptions smoke', () => {
  it('loads payment links and subscriptions endpoints', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/admin/payments`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(payload?.paymentLinks)).toBe(true)
    expect(Array.isArray(payload?.subscriptions)).toBe(true)
  }, 90_000)
})
