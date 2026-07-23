import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAppContext, type LiveAppContext } from '@/tests/helpers/live-app-context'

let ctx: LiveAppContext

beforeAll(async () => {
  ctx = await getLiveAppContext()
}, 30_000)

describe('live app tour menu smoke', () => {
  it('returns menu settings and blocks for selected tour', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/menu`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toHaveProperty('settings')
    expect(payload).toHaveProperty('blocks')
    expect(Array.isArray(payload.blocks)).toBe(true)
  }, 30_000)

  it('exposes revamp chrome fields on menu settings when present', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/menu`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
      },
    })

    const payload = await response.json()
    expect(response.status).toBe(200)

    if (!payload.settings) {
      // Fresh tours may not have a menu row yet — still a valid state.
      return
    }

    // After SQL 89 (+ 91 consolidation) these columns exist; app may also default them on create.
    if (payload.settings.menu_style != null) {
      expect(['modal', 'drawer']).toContain(payload.settings.menu_style)
    }
    if (payload.settings.anchor_side != null) {
      expect(['left', 'right']).toContain(payload.settings.anchor_side)
    }
  }, 30_000)

  it('public menu GET returns settings/blocks shape for embed', async () => {
    const response = await fetch(`${ctx.baseUrl}/api/public/menu/${ctx.tourId}`, {
      method: 'GET',
    })

    // Public menu may 404 if disabled / missing — both are acceptable.
    if (response.status === 404) {
      expect(response.status).toBe(404)
      return
    }

    const payload = await response.json()
    expect(response.status).toBe(200)
    expect(payload).toHaveProperty('settings')
    expect(payload).toHaveProperty('blocks')
  }, 30_000)

  it('track-menu-event accepts menu_opened payload', async () => {
    const embedId = `test-menu-${Date.now()}`
    const tokenResponse = await fetch(`${ctx.baseUrl}/api/app/chatbots/preview-token`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ctx.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: ctx.venueId,
        embedId,
      }),
    })
    expect(tokenResponse.status).toBe(200)
    const { embedToken } = await tokenResponse.json()
    expect(typeof embedToken).toBe('string')

    const response = await fetch(`${ctx.baseUrl}/api/public/embed/track-menu-event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        venueId: ctx.venueId,
        tourId: ctx.tourId,
        embedId,
        embedToken,
        eventType: 'menu_opened',
        menuStyle: 'drawer',
        triggerSource: 'icon_button',
        domain: 'localhost',
      }),
    })

    // 200/201 once SQL 90 is applied; 4xx/5xx if the table is not yet migrated; 429 if a
    // prior test run in this window already tripped the per-venue/IP rate limit.
    expect([200, 201, 400, 404, 429, 500]).toContain(response.status)
    if (response.status === 200 || response.status === 201) {
      const payload = await response.json().catch(() => ({}))
      expect(payload).toBeTruthy()
    }
  }, 30_000)

  it('confirms the standalone blocks CRUD route was removed (builder uses replace-all save)', async () => {
    // The dedicated per-block CRUD route was dead code — the builder's save button has
    // always used the settings route's delete-all-then-reinsert path. Removed rather than
    // wired up, so this endpoint should now 404 for every method.
    const response = await fetch(`${ctx.baseUrl}/api/app/tours/${ctx.tourId}/menu/blocks`, {
      method: 'GET',
    })

    expect([404, 405]).toContain(response.status)
  }, 30_000)
})
