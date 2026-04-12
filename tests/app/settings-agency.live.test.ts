import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 30_000)

describe('live app settings agency smoke', () => {
  it('returns agency settings and share inventory', async () => {
    const settingsResponse = await fetch(`${ctx.baseUrl}/api/app/agency-portal/settings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const settingsPayload = await settingsResponse.json()

    expect(settingsResponse.status).toBe(200)
    expect(settingsPayload).toHaveProperty('settings')
    expect(settingsPayload).toHaveProperty('entitlement')
    expect(settingsPayload?.settings?.venue_id).toBe(ctx.venueId)

    const sharesResponse = await fetch(`${ctx.baseUrl}/api/app/agency-portal/shares`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const sharesPayload = await sharesResponse.json()

    expect(sharesResponse.status).toBe(200)
    expect(sharesPayload).toHaveProperty('entitlement')
    expect(Array.isArray(sharesPayload?.tours)).toBe(true)
    expect(Array.isArray(sharesPayload?.shares)).toBe(true)
  }, 30_000)
})
