import { describe, expect, it } from 'vitest'
import { signInFirebasePassword } from '@/tests/helpers/live-auth'

describe('live auth login smoke: localhost + Firebase', () => {
  it('signs in with real credentials and resolves user from /api/auth/check-user', async () => {
    const { baseUrl, idToken, localId } = await signInFirebasePassword()

    const response = await fetch(`${baseUrl}/api/auth/check-user`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload?.success).toBe(true)
    expect(payload?.user).toBeTruthy()
    expect(payload?.user?.firebase_uid).toBe(localId)
  }, 30_000)
})
