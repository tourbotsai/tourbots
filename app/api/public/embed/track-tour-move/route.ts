import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { trackEmbedTourMove } from '@/lib/embed-analytics';
import {
  getMarketingSiteMoveGateConfig,
  isMarketingSiteTourMoveOriginAllowed,
} from '@/lib/marketing-site-tour-move-request';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  embedId: z.string().min(1),
  venueId: z.string().uuid(),
  tourId: z.string().uuid().optional().nullable(),
  sweepId: z.string().min(1).max(256),
  position: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
    z: z.number().finite(),
  }),
  rotation: z.object({
    x: z.number().finite(),
    y: z.number().finite(),
  }),
  domain: z.string().optional().nullable(),
  pageUrl: z.string().optional().nullable(),
  matterportModelId: z.string().optional().nullable(),
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

    const {
      embedId,
      venueId,
      tourId,
      sweepId,
      position,
      rotation,
      domain,
      pageUrl,
      matterportModelId,
    } = parsed.data;

    const userAgent = request.headers.get('user-agent') || undefined;

    const gate = getMarketingSiteMoveGateConfig();
    if (gate && embedId === gate.embedId) {
      if (venueId !== gate.venueId || tourId !== gate.tourId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (!isMarketingSiteTourMoveOriginAllowed(request)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    await trackEmbedTourMove({
      embedId,
      venueId,
      tourId: tourId ?? null,
      sweepId,
      position,
      rotation,
      domain: domain ?? null,
      pageUrl: pageUrl ?? null,
      userAgent,
      matterportModelId: matterportModelId ?? null,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in track-tour-move:', error);
    return NextResponse.json(
      { error: 'Failed to record tour move' },
      { status: 500 }
    );
  }
}
