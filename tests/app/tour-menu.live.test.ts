import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, type LiveAppContext } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext

beforeAll(async () => {
  ctx = await getLiveAppContext()
}, 30_000)

describe('live app tour menu smoke', () => {
  it('returns menu settings and blocks for selected tour', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/menu`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toHaveProperty('settings')
    expect(payload).toHaveProperty('blocks')
    expect(Array.isArray(payload.blocks)).toBe(true)
  }, 30_000)
})
