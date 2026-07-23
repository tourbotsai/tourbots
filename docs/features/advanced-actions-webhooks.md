# Advanced Actions — Zapier / Make / n8n recipes

TourBots sends signed HTTPS POSTs to a webhook URL you paste under **Chatbots → Actions → Advanced**.

There is **no native Google Calendar / HubSpot connector** in v1. Wire those apps on the Zapier, Make, or n8n side.

## Prerequisites

1. Run SQL migrations [`83`](../../sql/83_chatbot_integrations_and_custom_actions.sql) and [`84`](../../sql/84_custom_action_signing_secret.sql) in Supabase.
2. **Lead webhook:** Chatbots → Actions → Lead Form → expand → **Advanced** (collapsed by default) → paste Zapier/Make/n8n URL → enable → Save lead webhook.
3. **Custom actions:** Chatbots → Actions → **Custom Actions** → add an action (e.g. Get availability) with its **own** webhook URL, intent, and mode (Query for live lookups).

Each custom action owns its webhook. The lead form Advanced webhook is only for `lead.created`.

## Request headers

| Header | Meaning |
|--------|---------|
| `Content-Type` | `application/json` |
| `X-TourBots-Event` | e.g. `lead.created`, `custom_action.fired`, `custom_action.query` |
| `X-TourBots-Timestamp` | Unix seconds |
| `X-TourBots-Signature` | `sha256=<hex>` HMAC-SHA256 of `{timestamp}.{rawBody}` using the signing secret |
| `X-TourBots-Mode` | `write` or `query` |

## Modes

### Write (fire-and-forget)

Used for `lead.created` and custom actions with mode **write**.

- TourBots POSTs and only needs a quick 2xx ACK (within ~4s).
- The chatbot tells the visitor the request was passed to the booking/CRM system — it does **not** claim the Zap finished.

### Query (sync JSON)

Used for custom actions with mode **query** (e.g. “what dates are free this week?”).

- TourBots waits up to ~8s for a JSON body.
- That JSON is returned to the model as tool output so it can answer in the same turn.
- Prefer **Make** or **n8n** with *Respond to Webhook*. Zapier is weaker for sync responses.

---

## Recipe A — Lead → CRM / Slack (write)

**Zapier**

1. Create a Zap → **Webhooks by Zapier → Catch Hook**.
2. Copy the Catch Hook URL into TourBots Advanced → Webhook URL.
3. Enable **lead.created** and save.
4. Submit a test lead from the chat form.
5. In Zapier, map fields from `lead.visitor_email`, `lead.visitor_name`, `lead.field_values`, etc.
6. Add HubSpot / Salesforce / Slack / Gmail steps as needed.

**Make**

1. Scenario → **Custom webhook** → Copy address → paste into TourBots.
2. Add CRM / Slack modules.
3. Return 200 quickly (no long sync wait needed for write).

**n8n**

1. **Webhook** node (POST) → paste production URL into TourBots.
2. Continue to CRM / Slack nodes.

### Example `lead.created` body

```json
{
  "event": "lead.created",
  "mode": "write",
  "venue_id": "…",
  "chatbot_config_id": "…",
  "timestamp": "2026-07-18T20:00:00.000Z",
  "lead": {
    "id": "…",
    "visitor_name": "Alex",
    "visitor_email": "alex@example.com",
    "visitor_phone": null,
    "field_values": { "name": "Alex", "email": "alex@example.com" },
    "tour_id": null,
    "conversation_id": null,
    "session_id": "…",
    "page_url": "https://example.com/tour",
    "domain": "example.com",
    "source": "chatbot",
    "status": "new",
    "consented_at": "…",
    "created_at": "…"
  }
}
```

---

## Recipe B — Live spreadsheet availability (query)

Goal: visitor asks “What times are free this week?” → AI answers from a live Google Sheet / Excel Online list of booked slots.

1. In Advanced → **Custom AI actions**, add an action:
   - **Name:** Get availability  
   - **Action key:** `get_availability`  
   - **Mode:** Query  
   - **When:** Intent — “Visitor asks what dates or times are available”
2. Point the webhook at Make or n8n (recommended).
3. Automation steps:
   - Receive webhook
   - Read Google Sheet / Excel Online
   - Compute free slots for the requested window (`tool_args.week_starting` if present)
   - **Respond to webhook** with JSON within a few seconds:

```json
{
  "ok": true,
  "slots": [
    "2026-07-21T10:00:00+01:00",
    "2026-07-22T14:00:00+01:00"
  ]
}
```

4. TourBots feeds that JSON to the model; the visitor gets a natural reply listing those times.

### Example query request body

```json
{
  "event": "custom_action.query",
  "mode": "query",
  "action_key": "get_availability",
  "action_name": "Get availability",
  "venue_id": "…",
  "chatbot_config_id": "…",
  "conversation_id": "…",
  "session_id": "…",
  "tool_args": { "week_starting": "2026-07-20" },
  "visitor": { "message": "What dates do you have free this week?" },
  "timestamp": "…"
}
```

If the lookup times out or fails, the AI apologises and suggests leaving contact details — it must not invent slots.

---

## Recipe C — Book a viewing (write custom action)

1. Add a **write** custom action, e.g. `book_viewing`, intent “Visitor wants to book a viewing”.
2. Automation: webhook → Google Calendar / booking tool → optional Slack.
3. Prompt behaviour: the AI says it has passed the request to the booking system, not that the meeting is confirmed.

---

## Security notes

- HTTPS only; private IPs and metadata hosts are blocked (SSRF guard).
- Redirects are disabled on outbound fetch.
- Delivery attempts are stored in `chatbot_webhook_deliveries` for support debugging.
- Rotate the signing secret from the Advanced card if it may have leaked.

## Entitlements

Advanced Actions are available to venues without a separate billing add-on in v1 (same as Triggers and Lead Form). A paid integrations gate can be added later via `billing-entitlements` if needed.

## Support checklist

1. Confirm migration 83 ran.
2. Confirm webhook URL saved and **Enabled**.
3. Check `chatbot_webhook_deliveries` for `response_status` / `error_message`.
4. For query actions, confirm the automation **responds** with JSON (not only Catch Hook ACK).
