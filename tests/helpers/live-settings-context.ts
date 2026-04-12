import { signInFirebasePassword } from '@/tests/helpers/live-auth'

export interface LiveSettingsContext {
  baseUrl: string
  idToken: string
  venueId: string
  userId: string
  firstName: string
  lastName: string
  email: string
}

export async function getLiveSettingsContext(): Promise<LiveSettingsContext> {
  const { baseUrl, idToken } = await signInFirebasePassword()

  const response = await fetch(`${baseUrl}/api/auth/check-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to resolve user for settings tests: ${response.status}`)
  }

  const payload = await response.json()
  const user = payload?.user

  const venueId: string | undefined = user?.venue_id || user?.venue?.id
  if (!venueId) {
    throw new Error('Settings live tests require a user linked to a venue')
  }

  if (!user?.id || !user?.email) {
    throw new Error('Settings live tests require user id and email from /api/auth/check-user')
  }

  return {
    baseUrl,
    idToken,
    venueId,
    userId: user.id as string,
    firstName: (user.first_name || 'Test') as string,
    lastName: (user.last_name || 'User') as string,
    email: user.email as string,
  }
}
