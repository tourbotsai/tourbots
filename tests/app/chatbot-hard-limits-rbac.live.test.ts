import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveChatbotContext, type LiveChatbotContext } from '@/tests/helpers/live-app-context'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let appCtx: LiveChatbotContext
let adminCtx: LiveAdminContext
let appUserRole: string | null = null

beforeAll(async () => {
  appCtx = await getLiveChatbotContext()
  adminCtx = await getLiveAdminContext()

  const checkUserResponse = await fetch(`${appCtx.baseUrl}/api/auth/check-user`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appCtx.idToken}`,
    },
  })

  if (!checkUserResponse.ok) {
    throw new Error(`Failed to resolve app user role: ${checkUserResponse.status}`)
  }

  const checkUserPayload = await checkUserResponse.json()
  appUserRole = checkUserPayload?.user?.role ?? null
}, 90_000)

describe('live app chatbot hard-limits RBAC', () => {
  it('rejects missing auth header for reset endpoint', async () => {
    const response = await fetch(`${appCtx.baseUrl}/api/app/chatbots/hard-limits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: appCtx.venueId,
        tourId: appCtx.tourId,
        chatbotType: 'tour',
        resetType: '__invalid__',
      }),
    })

    expect(response.status).toBe(401)
  }, 30_000)

  it('rejects non-platform admins for hard-limit resets', async () => {
    if (appUserRole === 'platform_admin') {
      throw new Error(
        'TEST_FIREBASE_EMAIL resolved to platform_admin. Configure a non-platform app user to validate 403 RBAC.'
      )
    }

    const response = await fetch(`${appCtx.baseUrl}/api/app/chatbots/hard-limits`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appCtx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: appCtx.venueId,
        tourId: appCtx.tourId,
        chatbotType: 'tour',
        resetType: '__invalid__',
      }),
    })

    expect(response.status).toBe(403)
  }, 30_000)

  it('allows platform admin through RBAC gate', async () => {
    const response = await fetch(`${adminCtx.baseUrl}/api/app/chatbots/hard-limits`, {
      method: 'POST',
      headers: {
        ...getLiveAdminHeaders(adminCtx),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: appCtx.venueId,
        tourId: appCtx.tourId,
        chatbotType: 'tour',
        resetType: '__invalid__',
      }),
    })

    const payload = await response.json()

    // 400 here means auth passed and endpoint reached input validation (no reset side-effect).
    expect(response.status).toBe(400)
    expect(payload?.error).toContain('resetType must be one of')
  }, 30_000)
})
