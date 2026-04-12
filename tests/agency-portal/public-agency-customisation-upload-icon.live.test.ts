import { beforeAll, describe, expect, it } from 'vitest'
import { createLiveAgencyPortalContext, getLiveAgencyPortalHeaders, type LiveAgencyPortalContext } from '@/tests/helpers/live-agency-context'

let ctx: LiveAgencyPortalContext

beforeAll(async () => {
  ctx = await createLiveAgencyPortalContext()
}, 60_000)

describe('live agency portal icon upload smoke', () => {
  it('uploads and deletes a customisation icon with real portal session + csrf', async () => {
    // Warm the route to avoid first-hit Next.js compile time skewing this live latency check.
    const warmupResponse = await fetch(`${ctx.baseUrl}/api/public/agency-portal/customisation/upload-icon`, {
      method: 'POST',
      headers: getLiveAgencyPortalHeaders(ctx, { withCsrf: true, withJson: true }),
      body: JSON.stringify({
        chatbotType: 'tour',
        shareSlug: ctx.shareSlug,
      }),
      signal: AbortSignal.timeout(45_000),
    })
    expect(warmupResponse.status).toBe(400)

    // 1x1 transparent PNG
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wf9l9sAAAAASUVORK5CYII='

    const uploadResponse = await fetch(`${ctx.baseUrl}/api/public/agency-portal/customisation/upload-icon`, {
      method: 'POST',
      headers: getLiveAgencyPortalHeaders(ctx, { withCsrf: true, withJson: true }),
      body: JSON.stringify({
        shareSlug: ctx.shareSlug,
        chatbotType: 'tour',
        fieldKey: 'mobile_custom_user_avatar_url',
        fileName: 'agency-live-icon.png',
        fileType: 'image/png',
        fileBase64: pngBase64,
      }),
      signal: AbortSignal.timeout(45_000),
    })
    const uploadPayload = await uploadResponse.json()

    expect(uploadResponse.status).toBe(200)
    expect(uploadPayload?.success).toBe(true)
    expect(typeof uploadPayload?.imageUrl).toBe('string')

    const deleteResponse = await fetch(`${ctx.baseUrl}/api/public/agency-portal/customisation/upload-icon`, {
      method: 'DELETE',
      headers: getLiveAgencyPortalHeaders(ctx, { withCsrf: true, withJson: true }),
      body: JSON.stringify({
        shareSlug: ctx.shareSlug,
        chatbotType: 'tour',
        imageUrl: uploadPayload.imageUrl,
      }),
      signal: AbortSignal.timeout(45_000),
    })
    const deletePayload = await deleteResponse.json()

    expect(deleteResponse.status).toBe(200)
    expect(deletePayload?.success).toBe(true)
  }, 120_000)
})
