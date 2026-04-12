import { NextRequest, NextResponse } from 'next/server';
import {
  deletePlatformOutboundSequence,
  getPlatformOutboundSequenceById,
  togglePlatformOutboundSequence,
  updatePlatformOutboundSequence,
  PlatformOutboundSequenceInput,
} from '@/lib/services/admin/platform-outbound-sequences-service';
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
    const includeEnrollments = searchParams.get('include_enrollments') === 'true';

    const sequenceData = await getPlatformOutboundSequenceById(sequenceId, includeEnrollments);
    if (!sequenceData) {
      return NextResponse.json(
        { success: false, error: 'Sequence not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sequence: sequenceData.sequence,
      steps: sequenceData.steps,
      enrollments: sequenceData.enrollments,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/outbound/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch outbound sequence' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const body = (await request.json()) as PlatformOutboundSequenceInput;

    if (!body.name || !body.steps || body.steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sequence name and at least one step are required' },
        { status: 400 }
      );
    }

    await updatePlatformOutboundSequence(sequenceId, body);

    return NextResponse.json({
      success: true,
      message: 'Sequence updated successfully',
    });
  } catch (error: any) {
    console.error('Error in PUT /api/admin/outbound/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update outbound sequence' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const sequenceId = params.id;
    const body = await request.json();

    if (typeof body.is_active !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_active boolean is required' },
        { status: 400 }
      );
    }

    await togglePlatformOutboundSequence(sequenceId, body.is_active);

    return NextResponse.json({
      success: true,
      message: body.is_active ? 'Sequence activated' : 'Sequence paused',
    });
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/outbound/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update sequence status' },
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
    await deletePlatformOutboundSequence(sequenceId);

    return NextResponse.json({
      success: true,
      message: 'Sequence deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/outbound/sequences/[id]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete sequence' },
      { status: 500 }
    );
  }
}
