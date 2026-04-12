import { getLiveAppContext, type LiveAppContext } from '@/tests/helpers/live-app-context'

export interface LiveAgencyPortalContext extends LiveAppContext {
  shareId: string
  shareSlug: string
  clientEmail: string
  clientPassword: string
  cookieHeader: string
  csrfToken: string
}

function createUniqueSuffix(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

function getSetCookieHeaders(response: Response): string[] {
  const headersAny = response.headers as unknown as { getSetCookie?: () => string[] }
  if (typeof headersAny.getSetCookie === 'function') {
    return headersAny.getSetCookie()
  }

  const raw = response.headers.get('set-cookie')
  if (!raw) return []

  // Split multi-cookie header safely without breaking Expires attributes.
  return raw.split(/,(?=[^;,\s]+=)/g)
}

function getCookieValue(setCookieHeaders: string[], cookieName: string): string | null {
  for (const header of setCookieHeaders) {
    const firstSegment = header.split(';')[0]?.trim()
    if (!firstSegment) continue
    const [name, ...valueParts] = firstSegment.split('=')
    if (name === cookieName) {
      return valueParts.join('=') || ''
    }
  }
  return null
}

function getPortalRequestHeaders(extra?: Record<string, string>) {
  return {
    Origin: 'http://localhost:3000',
    Referer: 'http://localhost:3000/',
    ...(extra || {}),
  }
}

async function ensureAgencyPortalReady(baseUrl: string, idToken: string) {
  const settingsResponse = await fetch(`${baseUrl}/api/app/agency-portal/settings`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
  if (!settingsResponse.ok) {
    throw new Error(`Failed to load agency settings: ${settingsResponse.status}`)
  }

  const settingsPayload = await settingsResponse.json()
  if (!settingsPayload?.entitlement?.addon_agency_portal) {
    throw new Error('Agency portal live tests require addon_agency_portal to be active')
  }

  const currentAllowedDomains = Array.isArray(settingsPayload?.settings?.allowed_domains)
    ? (settingsPayload.settings.allowed_domains as string[])
    : []
  const allowedDomains = Array.from(new Set([...currentAllowedDomains, 'localhost']))
  const isEnabled = Boolean(settingsPayload?.settings?.is_enabled)

  if (!isEnabled || !currentAllowedDomains.includes('localhost')) {
    const updateResponse = await fetch(`${baseUrl}/api/app/agency-portal/settings`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        is_enabled: true,
        allowed_domains: allowedDomains,
      }),
    })

    if (!updateResponse.ok) {
      throw new Error(`Failed to prepare agency settings for tests: ${updateResponse.status}`)
    }
  }
}

async function createAgencyShareWithUser(
  baseUrl: string,
  idToken: string,
  tourId: string,
  suffix: string
) {
  const inventoryResponse = await fetch(`${baseUrl}/api/app/agency-portal/shares`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  })
  if (!inventoryResponse.ok) {
    throw new Error(`Failed to load agency share inventory: ${inventoryResponse.status}`)
  }

  const inventoryPayload = await inventoryResponse.json()
  const existingShare = Array.isArray(inventoryPayload?.shares)
    ? inventoryPayload.shares.find((share: any) => share.tour_id === tourId)
    : null

  const shareSlug = (existingShare?.share_slug as string | undefined) || `agency-live-${suffix}`
  const clientEmail = `agency-live-${suffix}@tourbots.ai`
  const clientPassword = `TourBotsTest${suffix}!`

  const response = await fetch(`${baseUrl}/api/app/agency-portal/shares`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${idToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'upsert_share',
      shareId: existingShare?.id,
      tourId,
      shareSlug,
      isActive: true,
      enabledModules: {
        tour: true,
        settings: true,
        customisation: true,
        analytics: true,
        settings_blocks: {
          config: true,
          information: true,
          documents: true,
          triggers: true,
        },
      },
      clientEmail,
      clientPassword,
    }),
  })

  const payload = await response.json()
  if (!response.ok) {
    throw new Error(`Failed to create agency share: ${response.status} ${payload?.error || ''}`.trim())
  }

  const shareId: string | undefined = payload?.share?.id
  if (!shareId) {
    throw new Error('Agency share response did not include share id')
  }

  return {
    shareId,
    shareSlug,
    clientEmail,
    clientPassword,
  }
}

async function loginAgencyUser(
  baseUrl: string,
  shareSlug: string,
  clientEmail: string,
  clientPassword: string
) {
  const loginResponse = await fetch(`${baseUrl}/api/public/agency-portal/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getPortalRequestHeaders(),
    },
    body: JSON.stringify({
      shareSlug,
      email: clientEmail,
      password: clientPassword,
    }),
  })

  const loginPayload = await loginResponse.json()
  if (!loginResponse.ok) {
    throw new Error(`Agency login failed: ${loginResponse.status} ${loginPayload?.error || ''}`.trim())
  }

  const setCookieHeaders = getSetCookieHeaders(loginResponse)
  const sessionCookie = getCookieValue(setCookieHeaders, 'tb_agency_session')
  const csrfCookie = getCookieValue(setCookieHeaders, 'tb_agency_csrf')

  if (!sessionCookie || !csrfCookie) {
    throw new Error('Agency login did not return required session cookies')
  }

  const cookieHeader = `tb_agency_session=${sessionCookie}; tb_agency_csrf=${csrfCookie}`

  const sessionResponse = await fetch(
    `${baseUrl}/api/public/agency-portal/auth/session?shareSlug=${encodeURIComponent(shareSlug)}`,
    {
      method: 'GET',
      headers: {
        Cookie: cookieHeader,
        ...getPortalRequestHeaders(),
      },
    }
  )
  const sessionPayload = await sessionResponse.json()
  if (!sessionResponse.ok || !sessionPayload?.authenticated || !sessionPayload?.csrfToken) {
    throw new Error(`Agency session validation failed: ${sessionResponse.status}`)
  }

  return {
    cookieHeader,
    csrfToken: sessionPayload.csrfToken as string,
  }
}

export async function createLiveAgencyPortalContext(): Promise<LiveAgencyPortalContext> {
  const app = await getLiveAppContext()
  await ensureAgencyPortalReady(app.baseUrl, app.idToken)

  const suffix = createUniqueSuffix()
  const shareData = await createAgencyShareWithUser(app.baseUrl, app.idToken, app.tourId, suffix)
  const sessionData = await loginAgencyUser(
    app.baseUrl,
    shareData.shareSlug,
    shareData.clientEmail,
    shareData.clientPassword
  )

  return {
    ...app,
    ...shareData,
    ...sessionData,
  }
}

export function getLiveAgencyPortalHeaders(
  context: LiveAgencyPortalContext,
  options?: { withCsrf?: boolean; withJson?: boolean }
) {
  const headers: Record<string, string> = {
    Cookie: context.cookieHeader,
    ...getPortalRequestHeaders(),
  }

  if (options?.withCsrf) {
    headers['x-csrf-token'] = context.csrfToken
  }
  if (options?.withJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}
