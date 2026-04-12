import { describe, expect, it } from 'vitest'
import { assertLiveTestConfig } from '@/tests/helpers/live-auth'

type FirebaseSignUpResult = {
  localId: string
  idToken: string
  email: string
}

async function createFirebaseUser(email: string, password: string): Promise<FirebaseSignUpResult> {
  const config = assertLiveTestConfig()
  const signUpUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${config.firebaseApiKey}`

  const response = await fetch(signUpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  })

  const payload = await response.json()
  if (!response.ok) {
    const message = payload?.error?.message || 'Unknown Firebase sign-up error'
    throw new Error(`Firebase live sign-up failed: ${message}`)
  }

  return {
    localId: payload.localId as string,
    idToken: payload.idToken as string,
    email: payload.email as string,
  }
}

async function deleteFirebaseUser(idToken: string): Promise<void> {
  const config = assertLiveTestConfig()
  const deleteUrl = `https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${config.firebaseApiKey}`

  await fetch(deleteUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ idToken }),
  })
}

describe('live auth sign-up smoke: localhost + Firebase', () => {
  it('creates a Firebase user and completes /api/auth/register with bearer token auth', async () => {
    const config = assertLiveTestConfig()
    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const email = `live.signup.${uniqueSuffix}@example.com`
    const password = `LiveSignup!${Date.now()}`
    const firstName = 'Live'
    const lastName = 'Signup'
    const venueName = `Live Signup Venue ${uniqueSuffix}`

    const firebaseUser = await createFirebaseUser(email, password)

    try {
      const registerResponse = await fetch(`${config.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${firebaseUser.idToken}`,
        },
        body: JSON.stringify({
          firebase_uid: 'spoofed-uid-should-be-ignored',
          email: 'spoofed@example.com',
          first_name: firstName,
          last_name: lastName,
          venue_name: venueName,
        }),
      })

      const registerPayload = await registerResponse.json()
      expect(registerResponse.status).toBe(200)
      expect(registerPayload?.success).toBe(true)
      expect(registerPayload?.user?.firebase_uid).toBe(firebaseUser.localId)
      expect(registerPayload?.user?.email).toBe(firebaseUser.email)

      const checkUserResponse = await fetch(`${config.baseUrl}/api/auth/check-user`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${firebaseUser.idToken}`,
        },
      })

      const checkUserPayload = await checkUserResponse.json()
      expect(checkUserResponse.status).toBe(200)
      expect(checkUserPayload?.success).toBe(true)
      expect(checkUserPayload?.user?.firebase_uid).toBe(firebaseUser.localId)
      expect(checkUserPayload?.user?.email).toBe(firebaseUser.email)
    } finally {
      await deleteFirebaseUser(firebaseUser.idToken)
    }
  }, 60_000)
})
