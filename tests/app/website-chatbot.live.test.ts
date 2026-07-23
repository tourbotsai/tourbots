import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, type LiveAppContext } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext
let createdWebsiteConfigId: string | null = null

beforeAll(async () => {
  ctx = await getLiveAppContext()
}, 90_000)

afterAll(async () => {
  if (!createdWebsiteConfigId) return
  try {
    await fetch(`${ctx.baseUrl}/api/app/chatbots/config`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ configId: createdWebsiteConfigId }),
    })
  } catch {
    // Best-effort cleanup for live smoke tests.
  }
}, 30_000)

describe('live website chatbot config', () => {
  it('creates a website chatbot without a tour and returns chatbot_type website', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/chatbots/config`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: ctx.venueId,
        chatbotType: 'website',
        config: {
          chatbot_name: 'Live Test Website Assistant',
        },
      }),
    })

    const payload = await response.json()

    // Space limit may already be exhausted on the live venue — both outcomes are valid signals.
    if (response.status === 403) {
      expect(String(payload?.error || '')).toMatch(/limit|bot/i)
      return
    }

    expect(response.status).toBe(200)
    expect(payload).toBeTruthy()
    expect(payload.chatbot_type).toBe('website')
    expect(payload.tour_id).toBeNull()
    expect(payload.venue_id).toBe(ctx.venueId)
    createdWebsiteConfigId = payload.id

    const getResponse = await fetch(
      `${ctx.baseUrl}/api/app/chatbots/config?venueId=${encodeURIComponent(ctx.venueId)}&chatbotConfigId=${encodeURIComponent(payload.id)}&chatbotType=website`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${ctx.idToken}`,
        },
      }
    )
    const getPayload = await getResponse.json()
    expect(getResponse.status).toBe(200)
    expect(getPayload?.id).toBe(payload.id)
    expect(getPayload?.chatbot_type).toBe('website')
  }, 60_000)
})
