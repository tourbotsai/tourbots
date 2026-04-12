import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateGuides, AdminGuideData } from '@/lib/services/admin/admin-guide-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function PUT(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { guideIds, updates }: { guideIds: string[], updates: Partial<AdminGuideData> } = await request.json();

    if (!guideIds || !Array.isArray(guideIds) || guideIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Guide IDs array is required' },
        { status: 400 }
      );
    }

    if (!updates || Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Validate updates - only allow safe bulk operations
    const allowedFields = ['is_published', 'tags', 'difficulty_level'];
    const updateKeys = Object.keys(updates);
    const invalidFields = updateKeys.filter(key => !allowedFields.includes(key));

    if (invalidFields.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid fields for bulk update: ${invalidFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate difficulty level if provided
    if (updates.difficulty_level && !['beginner', 'intermediate', 'advanced'].includes(updates.difficulty_level)) {
      return NextResponse.json(
        { success: false, error: 'Difficulty level must be beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    await bulkUpdateGuides(guideIds, updates);
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${guideIds.length} guide(s)`,
      updatedCount: guideIds.length,
    });
  } catch (error: any) {
    console.error('Error bulk updating guides:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to bulk update guides' },
      { status: 500 }
    );
  }
} 