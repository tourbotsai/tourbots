import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin outbound leads and notes smoke', () => {
  it('loads outbound leads and lead notes for an existing lead', async () => {
    const leadsResponse = await fetch(`${ctx.baseUrl}/api/admin/outbound/leads`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const leadsPayload = await leadsResponse.json()
    expect(leadsResponse.status).toBe(200)
    expect(leadsPayload?.success).toBe(true)
    expect(Array.isArray(leadsPayload?.leads)).toBe(true)

    const leadId = leadsPayload?.leads?.[0]?.id as string | undefined
    if (!leadId) return

    const notesResponse = await fetch(
      `${ctx.baseUrl}/api/admin/outbound/leads/${encodeURIComponent(leadId)}/notes`,
      {
        method: 'GET',
        headers: getLiveAdminHeaders(ctx),
      }
    )
    const notesPayload = await notesResponse.json()
    expect(notesResponse.status).toBe(200)
    expect(notesPayload?.success).toBe(true)
    expect(Array.isArray(notesPayload?.notes)).toBe(true)
  }, 60_000)
})
