import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 30_000)

describe('live app settings account smoke', () => {
  it('reads and patches venue account settings', async () => {
    const venueResponse = await fetch(`${ctx.baseUrl}/api/venues/${ctx.venueId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const venuePayload = await venueResponse.json()

    expect(venueResponse.status).toBe(200)
    expect(venuePayload?.id).toBe(ctx.venueId)

    const nextName = String(venuePayload?.name || '').trim() || 'TourBots Venue'
    const patchResponse = await fetch(`${ctx.baseUrl}/api/venues/${ctx.venueId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: nextName,
      }),
    })
    const patchPayload = await patchResponse.json()

    expect(patchResponse.status).toBe(200)
    expect(patchPayload?.success).toBe(true)
    expect(patchPayload?.venue?.id).toBe(ctx.venueId)
  }, 30_000)

  it('ignores disallowed sensitive venue fields in patch payloads', async () => {
    const venueResponse = await fetch(`${ctx.baseUrl}/api/venues/${ctx.venueId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const venuePayload = await venueResponse.json()
    expect(venueResponse.status).toBe(200)

    const originalOwnerId = venuePayload?.owner_id

    const patchResponse = await fetch(`${ctx.baseUrl}/api/venues/${ctx.venueId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: String(venuePayload?.name || '').trim() || 'TourBots Venue',
        owner_id: '00000000-0000-0000-0000-000000000000',
      }),
    })
    const patchPayload = await patchResponse.json()
    expect(patchResponse.status).toBe(200)
    expect(patchPayload?.success).toBe(true)

    const verifyResponse = await fetch(`${ctx.baseUrl}/api/venues/${ctx.venueId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const verifyPayload = await verifyResponse.json()
    expect(verifyResponse.status).toBe(200)
    expect(verifyPayload?.owner_id).toBe(originalOwnerId)
  }, 30_000)
})
