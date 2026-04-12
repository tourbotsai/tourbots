import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 60_000)

describe('live agency portal billing add-on smoke', () => {
  it('creates a real checkout session for agency_portal add-on', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/billing/checkout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'buy_addon',
        addonCode: 'agency_portal',
        quantity: 1,
      }),
    })
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(typeof payload?.checkoutUrl).toBe('string')
    expect(payload.checkoutUrl.length).toBeGreaterThan(0)
    expect(typeof payload?.sessionId).toBe('string')
    expect(payload.sessionId.length).toBeGreaterThan(0)
  }, 60_000)
})
