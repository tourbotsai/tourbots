import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function readDotEnvLocal(): Record<string, string> {
  const filePath = resolve(process.cwd(), '.env.local')
  if (!existsSync(filePath)) return {}

  const content = readFileSync(filePath, 'utf-8')
  const result: Record<string, string> = {}

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const separatorIndex = line.indexOf('=')
    if (separatorIndex <= 0) continue

    const key = line.slice(0, separatorIndex).trim()
    let value = line.slice(separatorIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    result[key] = value
  }

  return result
}

const dotEnvLocal = readDotEnvLocal()
const LIVE_TOKEN_CACHE_TTL_MS = 50 * 60 * 1000;

type CachedSignInResult = {
  value: {
    baseUrl: string
    localId: string
    idToken: string
  }
  createdAt: number
}

let cachedSignInResult: CachedSignInResult | null = null
let inFlightSignIn: Promise<{
  baseUrl: string
  localId: string
  idToken: string
}> | null = null

function getEnv(name: string): string | undefined {
  return process.env[name] || dotEnvLocal[name]
}

export function getLiveTestConfig() {
  return {
    baseUrl: getEnv('TEST_BASE_URL'),
    firebaseEmail: getEnv('TEST_FIREBASE_EMAIL'),
    firebasePassword: getEnv('TEST_FIREBASE_PASSWORD'),
    firebaseApiKey: getEnv('TEST_FIREBASE_API_KEY'),
  }
}

interface LiveTestConfig {
  baseUrl: string
  firebaseEmail: string
  firebasePassword: string
  firebaseApiKey: string
}

export function assertLiveTestConfig(): LiveTestConfig {
  const config = getLiveTestConfig()
  if (!config.baseUrl || !config.firebaseEmail || !config.firebasePassword || !config.firebaseApiKey) {
    throw new Error(
      'Missing required env vars: TEST_BASE_URL, TEST_FIREBASE_EMAIL, TEST_FIREBASE_PASSWORD, TEST_FIREBASE_API_KEY'
    )
  }
  return {
    baseUrl: config.baseUrl,
    firebaseEmail: config.firebaseEmail,
    firebasePassword: config.firebasePassword,
    firebaseApiKey: config.firebaseApiKey,
  }
}

export async function signInFirebasePassword() {
  const now = Date.now()
  if (
    cachedSignInResult &&
    now - cachedSignInResult.createdAt < LIVE_TOKEN_CACHE_TTL_MS
  ) {
    return cachedSignInResult.value
  }

  if (inFlightSignIn) {
    return inFlightSignIn
  }

  const config = assertLiveTestConfig()
  const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${config.firebaseApiKey}`

  inFlightSignIn = (async () => {
    const response = await fetch(signInUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: config.firebaseEmail,
        password: config.firebasePassword,
        returnSecureToken: true,
      }),
    })

    const payload = await response.json()
    if (!response.ok) {
      const message = payload?.error?.message || 'Unknown Firebase sign-in error'
      throw new Error(`Firebase live sign-in failed: ${message}`)
    }

    const value = {
      baseUrl: config.baseUrl,
      localId: payload.localId as string,
      idToken: payload.idToken as string,
    }

    cachedSignInResult = {
      value,
      createdAt: Date.now(),
    }

    return value
  })()

  try {
    return await inFlightSignIn
  } finally {
    inFlightSignIn = null
  }
}
