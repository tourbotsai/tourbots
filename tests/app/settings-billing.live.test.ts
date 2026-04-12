import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 30_000)

describe('live app settings billing smoke', () => {
  it('returns billing plans, record, and limits', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/billing`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(payload?.plans)).toBe(true)
    expect(Array.isArray(payload?.addons)).toBe(true)
    expect(payload).toHaveProperty('billingRecord')
    expect(payload).toHaveProperty('limits')
    expect(typeof payload?.limits?.totalSpaces).toBe('number')
    expect(typeof payload?.limits?.totalMessages).toBe('number')
  }, 30_000)
})
