import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { recordMenuEventWithRateLimit } from '@/lib/embed-menu-event-rate-limiter';
import {
  verifyPublicEmbedRequest,
} from '@/lib/public-embed-token';
import { getClientIp } from '@/lib/request-client-ip';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  embedId: z.string().min(1),
  embedToken: z.string().optional().nullable(),
  venueId: z.string().uuid(),
  tourId: z.string().uuid().optional().nullable(),
  eventType: z.enum([
    'menu_opened',
    'menu_closed',
    'menu_item_clicked',
    'menu_ai_prompt_sent',
  ]),
  // 'icon' is accepted for backwards compatibility with events recorded before the
  // modal/drawer consolidation — it is no longer written by current clients.
  menuStyle: z.enum(['modal', 'drawer', 'icon']).optional().nullable(),
  triggerSource: z.string().max(64).optional().nullable(),
  itemId: z.string().max(128).optional().nullable(),
  itemLabel: z.string().max(256).optional().nullable(),
  itemType: z.string().max(64).optional().nullable(),
  actionType: z.string().max(64).optional().nullable(),
  targetRef: z.string().max(512).optional().nullable(),
  domain: z.string().optional().nullable(),
  pageUrl: z.string().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const raw = await request.text();
    if (!raw?.trim()) {
      return NextResponse.json({ error: 'Empty body' }, { status: 400 });
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const userAgent = request.headers.get('user-agent') || undefined;
    const clientIP = getClientIp(request);
    if (!verifyPublicEmbedRequest({
      request,
      token: data.embedToken,
      venueId: data.venueId,
      embedId: data.embedId,
    })) {
      return NextResponse.json({ error: 'Invalid or missing embed token' }, { status: 403 });
    }

    const rate = await recordMenuEventWithRateLimit({
      embedId: data.embedId,
      venueId: data.venueId,
      tourId: data.tourId ?? null,
      eventType: data.eventType,
      menuStyle: data.menuStyle ?? null,
      triggerSource: data.triggerSource ?? null,
      itemId: data.itemId ?? null,
      itemLabel: data.itemLabel ?? null,
      itemType: data.itemType ?? null,
      actionType: data.actionType ?? null,
      targetRef: data.targetRef ?? null,
      domain: data.domain ?? null,
      pageUrl: data.pageUrl ?? null,
      userAgent,
      metadata: data.metadata ?? null,
      ipAddress: clientIP,
    });
    if (!rate.allowed) {
      return NextResponse.json({ error: rate.message || 'Rate limit exceeded' }, { status: 429 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track-menu-event:', error);
    return NextResponse.json({ error: 'Failed to record menu event' }, { status: 500 });
  }
}
