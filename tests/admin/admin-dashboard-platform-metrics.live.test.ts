import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin dashboard metrics smoke', () => {
  it('loads full metrics payload and typed metric view', async () => {
    const fullResponse = await fetch(`${ctx.baseUrl}/api/admin/platform-metrics`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const fullPayload = await fullResponse.json()
    expect(fullResponse.status).toBe(200)
    expect(fullPayload).toHaveProperty('data')

    const typedResponse = await fetch(`${ctx.baseUrl}/api/admin/platform-metrics?type=metrics`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const typedPayload = await typedResponse.json()
    expect(typedResponse.status).toBe(200)
    expect(typedPayload).toHaveProperty('data')
  }, 60_000)
})
