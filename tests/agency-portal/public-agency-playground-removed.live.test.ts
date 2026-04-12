import { describe, expect, it } from 'vitest'
import { assertLiveTestConfig } from '@/tests/helpers/live-auth'

const { baseUrl } = assertLiveTestConfig()

describe('live agency portal removed playground contract', () => {
  it('returns 410 for GET and POST', async () => {
    const getResponse = await fetch(`${baseUrl}/api/public/agency-portal/playground`, {
      method: 'GET',
    })
    const getPayload = await getResponse.json()

    expect(getResponse.status).toBe(410)
    expect(getPayload?.error).toContain('removed')

    const postResponse = await fetch(`${baseUrl}/api/public/agency-portal/playground`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'test' }),
    })
    const postPayload = await postResponse.json()

    expect(postResponse.status).toBe(410)
    expect(postPayload?.error).toContain('removed')
  }, 60_000)
})
