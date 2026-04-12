import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin help centre and support smoke', () => {
  it('loads help articles and support conversations', async () => {
    const helpResponse = await fetch(`${ctx.baseUrl}/api/admin/help`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const helpPayload = await helpResponse.json()
    expect(helpResponse.status).toBe(200)
    expect(helpPayload?.success).toBe(true)
    expect(Array.isArray(helpPayload?.articles)).toBe(true)

    const conversationsResponse = await fetch(`${ctx.baseUrl}/api/admin/help/conversations`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const conversationsPayload = await conversationsResponse.json()
    expect(conversationsResponse.status).toBe(200)
    expect(Array.isArray(conversationsPayload?.conversations)).toBe(true)
  }, 60_000)
})
