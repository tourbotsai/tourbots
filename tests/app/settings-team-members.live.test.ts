import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 30_000)

describe('live app settings team members smoke', () => {
  it('returns team members list for active venue', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/team-members`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload?.success).toBe(true)
    expect(payload?.venueId).toBe(ctx.venueId)
    expect(Array.isArray(payload?.members)).toBe(true)
    expect(payload?.members.length).toBeGreaterThan(0)
    expect(payload?.members[0]).toHaveProperty('user_id')
    expect(payload?.members[0]).toHaveProperty('access_role')
  }, 30_000)
})
