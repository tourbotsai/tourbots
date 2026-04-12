import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, getLiveAgencyPortalHeaders, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal core module smoke', () => {
  it('loads settings, customisation, analytics, information, triggers, and chatbot config', async () => {
    const settingsResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/settings?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      { method: 'GET', headers: getLiveAgencyPortalHeaders(ctx) }
    )
    const settingsPayload = await settingsResponse.json()
    expect(settingsResponse.status).toBe(200)
    expect(settingsPayload).toHaveProperty('settings')

    const customisationResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/customisation?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      { method: 'GET', headers: getLiveAgencyPortalHeaders(ctx) }
    )
    const customisationPayload = await customisationResponse.json()
    expect(customisationResponse.status).toBe(200)
    expect(customisationPayload).toHaveProperty('customisation')

    const analyticsResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/analytics?shareSlug=${encodeURIComponent(ctx.shareSlug)}&view=stats`,
      { method: 'GET', headers: getLiveAgencyPortalHeaders(ctx) }
    )
    const analyticsPayload = await analyticsResponse.json()
    expect(analyticsResponse.status).toBe(200)
    expect(analyticsPayload).toHaveProperty('stats')

    const informationResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/information?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      { method: 'GET', headers: getLiveAgencyPortalHeaders(ctx) }
    )
    const informationPayload = await informationResponse.json()
    expect(informationResponse.status).toBe(200)
    expect(Array.isArray(informationPayload?.sections)).toBe(true)

    const triggersResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/triggers?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      { method: 'GET', headers: getLiveAgencyPortalHeaders(ctx) }
    )
    const triggersPayload = await triggersResponse.json()
    expect(triggersResponse.status).toBe(200)
    expect(Array.isArray(triggersPayload?.triggers)).toBe(true)

    const chatbotConfigResponse = await fetch(
      `${ctx.baseUrl}/api/public/agency-portal/chatbot-config?shareSlug=${encodeURIComponent(ctx.shareSlug)}`,
      { method: 'GET', headers: getLiveAgencyPortalHeaders(ctx) }
    )
    const chatbotConfigPayload = await chatbotConfigResponse.json()
    expect(chatbotConfigResponse.status).toBe(200)
    expect(chatbotConfigPayload === null || typeof chatbotConfigPayload === 'object').toBe(true)

    const chatbotConfigId = chatbotConfigPayload?.id as string | undefined
    const documentsUrl = chatbotConfigId
      ? `${ctx.baseUrl}/api/public/agency-portal/documents?shareSlug=${encodeURIComponent(ctx.shareSlug)}&chatbotConfigId=${encodeURIComponent(chatbotConfigId)}`
      : `${ctx.baseUrl}/api/public/agency-portal/documents?shareSlug=${encodeURIComponent(ctx.shareSlug)}`

    const documentsResponse = await fetch(documentsUrl, {
      method: 'GET',
      headers: getLiveAgencyPortalHeaders(ctx),
    })
    const documentsPayload = await documentsResponse.json()
    expect(documentsResponse.status).toBe(200)
    expect(Array.isArray(documentsPayload)).toBe(true)
  }, 60_000)
})
