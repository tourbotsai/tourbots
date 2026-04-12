import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin accounts and venues listing smoke', () => {
  it('loads account listing with company and tour metadata', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/admin/accounts`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(Array.isArray(payload?.accounts)).toBe(true)

    const firstAccount = payload?.accounts?.[0]
    if (firstAccount) {
      expect(typeof firstAccount.companyName).toBe('string')
      expect(typeof firstAccount.toursCount).toBe('number')
    }
  }, 60_000)
})
