import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';
import {
  getScopedTourChatbotConfig,
  updateScopedTourChatbotConfig,
} from '@/lib/agency-portal-module-service';

const settingsUpdateSchema = z.object({
  chatbot_name: z.string().trim().min(1).max(120).optional(),
  welcome_message: z.string().trim().max(4000).optional(),
  instruction_prompt: z.string().trim().max(8000).optional(),
  personality_prompt: z.string().trim().max(8000).optional(),
  guardrail_prompt: z.string().trim().max(12000).optional(),
  guardrails_enabled: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareSlug = searchParams.get('shareSlug') || undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
    });
    if (session instanceof NextResponse) return session;

    const config = await getScopedTourChatbotConfig(session.venueId, session.tourId);

    return NextResponse.json({
      settings: config,
      scope: {
        shareId: session.shareId,
        shareSlug: session.shareSlug,
        tourId: session.tourId,
      },
    });
  } catch (error: any) {
    console.error('Agency portal settings GET error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to load portal settings.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const payload = await request.json();
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'settings',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const parsed = settingsUpdateSchema.safeParse(payload?.updates || {});
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid settings payload.' }, { status: 400 });
    }

    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No settings fields provided.' }, { status: 400 });
    }

    const updated = await updateScopedTourChatbotConfig(session.venueId, session.tourId, parsed.data);
    if (!updated) {
      return NextResponse.json({ error: 'Tour chatbot settings not found.' }, { status: 404 });
    }

    return NextResponse.json({ settings: updated });
  } catch (error: any) {
    console.error('Agency portal settings PUT error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update portal settings.' },
      { status: 500 }
    );
  }
}

