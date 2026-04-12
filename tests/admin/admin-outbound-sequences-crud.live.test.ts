import { beforeAll, describe, expect, it } from 'vitest'
import { getLiveAdminContext, getLiveAdminHeaders, type LiveAdminContext } from '@/tests/helpers/live-admin-context'

let ctx: LiveAdminContext

beforeAll(async () => {
  ctx = await getLiveAdminContext()
}, 60_000)

describe('live admin outbound sequences CRUD smoke', () => {
  it('creates, reads, toggles, and deletes an outbound sequence', async () => {
    const date = new Date()
    const scheduledDate = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(
      date.getUTCDate()
    ).padStart(2, '0')}`

    const createResponse = await fetch(`${ctx.baseUrl}/api/admin/outbound/sequences`, {
      method: 'POST',
      headers: {
        ...getLiveAdminHeaders(ctx),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Live Sequence ${Date.now()}`,
        description: 'Automated live smoke sequence',
        steps: [
          {
            step_number: 1,
            scheduled_date: scheduledDate,
            scheduled_time: '10:00',
            email_subject: 'Intro email',
            email_body: 'Hello from TourBots live test.',
          },
        ],
      }),
    })
    const createPayload = await createResponse.json()
    expect(createResponse.status).toBe(201)
    expect(createPayload?.success).toBe(true)

    const sequenceId = createPayload?.sequenceId as string | undefined
    expect(Boolean(sequenceId)).toBe(true)
    if (!sequenceId) return

    const getResponse = await fetch(`${ctx.baseUrl}/api/admin/outbound/sequences/${encodeURIComponent(sequenceId)}`, {
      method: 'GET',
      headers: getLiveAdminHeaders(ctx),
    })
    const getPayload = await getResponse.json()
    expect(getResponse.status).toBe(200)
    expect(getPayload?.success).toBe(true)

    const toggleResponse = await fetch(
      `${ctx.baseUrl}/api/admin/outbound/sequences/${encodeURIComponent(sequenceId)}`,
      {
        method: 'PATCH',
        headers: {
          ...getLiveAdminHeaders(ctx),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: false }),
      }
    )
    const togglePayload = await toggleResponse.json()
    expect(toggleResponse.status).toBe(200)
    expect(togglePayload?.success).toBe(true)

    const deleteResponse = await fetch(
      `${ctx.baseUrl}/api/admin/outbound/sequences/${encodeURIComponent(sequenceId)}`,
      {
        method: 'DELETE',
        headers: getLiveAdminHeaders(ctx),
      }
    )
    const deletePayload = await deleteResponse.json()
    expect(deleteResponse.status).toBe(200)
    expect(deletePayload?.success).toBe(true)
  }, 120_000)
})
