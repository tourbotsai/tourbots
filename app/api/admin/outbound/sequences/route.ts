import { NextRequest, NextResponse } from 'next/server';
import { createPlatformOutboundSequence, listPlatformOutboundSequences, PlatformOutboundSequenceInput } from '@/lib/services/admin/platform-outbound-sequences-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('include_stats') === 'true';
    const sequences = await listPlatformOutboundSequences();

    if (!includeStats) {
      return NextResponse.json({ success: true, sequences });
    }

    const stats = sequences.reduce(
      (acc, sequence: any) => {
        acc.totalSequences += 1;
        if (sequence.is_active) acc.activeSequences += 1;
        acc.activeEnrollments += sequence.active_enrollment_count || 0;
        acc.totalEmails += sequence.total_email_count || 0;
        acc.totalSent += sequence.sent_email_count || 0;
        return acc;
      },
      {
        totalSequences: 0,
        activeSequences: 0,
        activeEnrollments: 0,
        totalEmails: 0,
        totalSent: 0,
      }
    );

    return NextResponse.json({
      success: true,
      sequences,
      stats: {
        ...stats,
        completionRate: stats.totalEmails > 0 ? Math.round((stats.totalSent / stats.totalEmails) * 100) : 0,
      },
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/sequences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch outbound sequences' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const body = (await request.json()) as PlatformOutboundSequenceInput;

    if (!body.name || !body.steps || body.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sequence name and at least one step are required' },
        { status: 400 }
      );
    }

    for (const step of body.steps) {
      if (!step.email_subject || !step.email_body || !step.scheduled_date || !step.scheduled_time) {
        return NextResponse.json(
          { success: false, error: 'Each step requires date, time, subject, and body' },
          { status: 400 }
        );
      }
    }

    const sequence = await createPlatformOutboundSequence(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Sequence created successfully',
        sequenceId: sequence.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error in POST /api/admin/outbound/sequences:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create outbound sequence' },
      { status: 500 }
    );
  }
}
