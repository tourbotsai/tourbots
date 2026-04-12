import { describe, expect, it } from 'vitest'
import { signInFirebasePassword } from '@/tests/helpers/live-auth'

describe('live app dashboard smoke: localhost + Firebase', () => {
  it('loads dashboard data for authenticated venue user', async () => {
    const { baseUrl, idToken } = await signInFirebasePassword()

    const response = await fetch(`${baseUrl}/api/app/dashboard`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toHaveProperty('overview')
    expect(payload).toHaveProperty('quickStats')
    expect(payload).toHaveProperty('visitorAnalytics')
    expect(payload).toHaveProperty('actionItems')
    expect(typeof payload.overview.totalTourViews).toBe('number')
    expect(typeof payload.overview.totalTourMoves).toBe('number')
    expect(typeof payload.quickStats.spacesUsed).toBe('number')
  }, 40_000)
})
