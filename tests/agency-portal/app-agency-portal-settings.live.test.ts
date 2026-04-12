import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 60_000)

describe('live agency portal app settings smoke', () => {
  it('loads and updates agency portal settings with real auth', async () => {
    const getResponse = await fetch(`${ctx.baseUrl}/api/app/agency-portal/settings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })
    const getPayload = await getResponse.json()

    expect(getResponse.status).toBe(200)
    expect(getPayload?.settings?.venue_id).toBe(ctx.venueId)
    expect(getPayload).toHaveProperty('entitlement')

    const currentDomains: string[] = Array.isArray(getPayload?.settings?.allowed_domains)
      ? getPayload.settings.allowed_domains
      : []
    const nextDomains = Array.from(new Set([...currentDomains, 'localhost']))

    const putResponse = await fetch(`${ctx.baseUrl}/api/app/agency-portal/settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_enabled: true,
        allowed_domains: nextDomains,
      }),
    })
    const putPayload = await putResponse.json()

    expect(putResponse.status).toBe(200)
    expect(putPayload?.venue_id).toBe(ctx.venueId)
    expect(putPayload?.is_enabled).toBe(true)
    expect(Array.isArray(putPayload?.allowed_domains)).toBe(true)
    expect(putPayload.allowed_domains).toContain('localhost')
  }, 60_000)
})
