import { NextRequest, NextResponse } from 'next/server';
import { getGuideById, updateGuide, deleteGuide, checkGuideSlugUnique, AdminGuideData } from '@/lib/services/admin/admin-guide-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const guide = await getGuideById(params.id);
    
    if (!guide) {
      return NextResponse.json(
        { success: false, error: 'Guide not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guide,
    });
  } catch (error: any) {
    console.error('Error fetching guide:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch guide' },
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

    const guideData: Partial<AdminGuideData> = await request.json();

    // Validate difficulty level if provided
    if (guideData.difficulty_level && !['beginner', 'intermediate', 'advanced'].includes(guideData.difficulty_level)) {
      return NextResponse.json(
        { success: false, error: 'Difficulty level must be beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    // Validate slug uniqueness if slug is being updated
    if (guideData.slug) {
      const isUnique = await checkGuideSlugUnique(guideData.slug, params.id);
      if (!isUnique) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists. Please choose a different slug.' },
          { status: 400 }
        );
      }
    }

    // Validate tags if provided
    if (guideData.tags && guideData.tags.some(tag => typeof tag !== 'string' || tag.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'All tags must be non-empty strings' },
        { status: 400 }
      );
    }

    const guide = await updateGuide(params.id, guideData);
    
    return NextResponse.json({
      success: true,
      guide,
    });
  } catch (error: any) {
    console.error('Error updating guide:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update guide' },
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

    // Check if guide exists first
    const guide = await getGuideById(params.id);
    if (!guide) {
      return NextResponse.json(
        { success: false, error: 'Guide not found' },
        { status: 404 }
      );
    }

    await deleteGuide(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Guide deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting guide:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete guide' },
      { status: 500 }
    );
  }
} 