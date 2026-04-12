import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin venue detail and patch smoke', () => {
  it('loads a venue by id and applies a no-op patch', async () => {
    const accountsResponse = await fetch(`${ctx.baseUrl}/api/admin/accounts`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const accountsPayload = await accountsResponse.json()
    expect(accountsResponse.status).toBe(200)

    const venueId = accountsPayload?.accounts?.[0]?.id as string | undefined
    expect(Boolean(venueId)).toBe(true)
    if (!venueId) return

    const detailResponse = await fetch(`${ctx.baseUrl}/api/admin/venues/${encodeURIComponent(venueId)}`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const detailPayload = await detailResponse.json()
    expect(detailResponse.status).toBe(200)
    expect(detailPayload?.venue?.id).toBe(venueId)

    const patchResponse = await fetch(`${ctx.baseUrl}/api/admin/venues/${encodeURIComponent(venueId)}`, {
      method: 'PATCH',
      headers: {
        ...getLiveAdminHeaders(ctx),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // No-op update keeps data stable while still exercising live write path.
        name: detailPayload?.venue?.name,
      }),
    })
    const patchPayload = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchPayload?.success).toBe(true)
  }, 60_000)
})
