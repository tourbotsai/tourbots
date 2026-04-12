import { NextRequest, NextResponse } from 'next/server';
import { enrollLeadInPlatformOutboundSequence, stopPlatformOutboundSequenceEnrollment } from '@/lib/services/admin/platform-outbound-sequences-service';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabase
      .from('platform_outbound_sequence_enrollments')
      .select('*')
      .eq('sequence_id', sequenceId)
      .order('enrolled_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    const rows = data || [];
    const leadIds = rows.map((row: any) => row.lead_id).filter(Boolean);
    let leadMap: Record<string, any> = {};
    if (leadIds.length > 0) {
      const { data: leadsData } = await supabase
        .from('platform_outbound_leads')
        .select('id,company_name,contact_name,contact_email,contact_phone,website,lead_status,priority')
        .in('id', leadIds);
      leadMap = (leadsData || []).reduce<Record<string, any>>((acc, lead: any) => {
        acc[lead.id] = lead;
        return acc;
      }, {});
    }

    const enrollments = rows.map((row: any) => ({
      ...row,
      lead: leadMap[row.lead_id] || null,
    }));

    return NextResponse.json({
      success: true,
      enrollments,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/sequences/[id]/enrollments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch enrollments' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const body = await request.json();
    const leadId = body.leadId as string;

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId is required' },
        { status: 400 }
      );
    }

    const result = await enrollLeadInPlatformOutboundSequence(sequenceId, leadId);

    return NextResponse.json({
      success: true,
      message: 'Lead enrolled successfully',
      enrollmentId: result.enrollmentId,
      scheduledCount: result.scheduledCount,
    });
  } catch (error: any) {
    console.error('Error in POST /api/admin/outbound/sequences/[id]/enrollments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to enroll lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const { searchParams } = new URL(request.url);
    const enrollmentId = searchParams.get('enrollmentId');
    const reason = searchParams.get('reason') || 'Manually removed from sequence';

    if (!sequenceId || !enrollmentId) {
      return NextResponse.json(
        { success: false, error: 'sequenceId and enrollmentId are required' },
        { status: 400 }
      );
    }

    await stopPlatformOutboundSequenceEnrollment(enrollmentId, reason);

    return NextResponse.json({
      success: true,
      message: 'Enrollment stopped successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/outbound/sequences/[id]/enrollments:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to stop enrollment' },
      { status: 500 }
    );
  }
}
