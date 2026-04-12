import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveSettingsContext, type LiveSettingsContext } from '@/tests/helpers/live-settings-context'

let ctx: LiveSettingsContext

beforeAll(async () => {
  ctx = await getLiveSettingsContext()
}, 30_000)

describe('live app settings profile smoke', () => {
  it('updates profile endpoint with current live values', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/profile`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        first_name: ctx.firstName,
        last_name: ctx.lastName,
        email: ctx.email,
      }),
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload?.success).toBe(true)
    expect(payload?.user?.id).toBe(ctx.userId)
    expect(payload?.user?.email).toBe(ctx.email)
  }, 30_000)
})
