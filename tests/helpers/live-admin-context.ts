import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

function readDotEnvLocal(): Record<string, string> {
  const candidates = [resolve(process.cwd(), '.env.local'), resolve(process.cwd(), 'production/.env.local')]
  const filePath = candidates.find((path) => existsSync(path))
  if (!filePath) return {}

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
const LIVE_ADMIN_CONTEXT_CACHE_TTL_MS = 50 * 60 * 1000;

type CachedAdminContext = {
  value: LiveAdminContext
  createdAt: number
}

let cachedAdminContext: CachedAdminContext | null = null
let inFlightAdminContext: Promise<LiveAdminContext> | null = null

function getEnv(name: string): string | undefined {
  return process.env[name] || dotEnvLocal[name]
}

export interface LiveAdminContext {
  baseUrl: string
  idToken: string
}

export async function getLiveAdminContext(): Promise<LiveAdminContext> {
  const now = Date.now()
  if (
    cachedAdminContext &&
    now - cachedAdminContext.createdAt < LIVE_ADMIN_CONTEXT_CACHE_TTL_MS
  ) {
    return cachedAdminContext.value
  }

  if (inFlightAdminContext) {
    return inFlightAdminContext
  }

  const baseUrl = getEnv('TEST_BASE_URL')
  const firebaseApiKey = getEnv('TEST_FIREBASE_API_KEY')
  const adminEmail = getEnv('TEST_PLATFORM_ADMIN_EMAIL')
  const adminPassword = getEnv('TEST_PLATFORM_ADMIN_PASSWORD')

  if (!baseUrl || !firebaseApiKey || !adminEmail || !adminPassword) {
    throw new Error(
      'Missing required admin test env vars: TEST_BASE_URL, TEST_FIREBASE_API_KEY, TEST_PLATFORM_ADMIN_EMAIL, TEST_PLATFORM_ADMIN_PASSWORD'
    )
  }

  inFlightAdminContext = (async () => {
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`
    const signInResponse = await fetch(signInUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
        returnSecureToken: true,
      }),
    })
    const signInPayload = await signInResponse.json()
    if (!signInResponse.ok || !signInPayload?.idToken) {
      const message = signInPayload?.error?.message || 'Unknown Firebase sign-in error'
      throw new Error(`Platform admin Firebase sign-in failed: ${message}`)
    }

    const metricsResponse = await fetch(`${baseUrl}/api/admin/platform-metrics`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${signInPayload.idToken as string}`,
      },
    })
    if (metricsResponse.status !== 200) {
      throw new Error(`Platform admin token check failed: /api/admin/platform-metrics returned ${metricsResponse.status}`)
    }

    const value = {
      baseUrl,
      idToken: signInPayload.idToken as string,
    }

    cachedAdminContext = {
      value,
      createdAt: Date.now(),
    }

    return value
  })()

  try {
    return await inFlightAdminContext
  } finally {
    inFlightAdminContext = null
  }
}

export function getLiveAdminHeaders(context: LiveAdminContext) {
  return {
    Authorization: `Bearer ${context.idToken}`,
  }
}
