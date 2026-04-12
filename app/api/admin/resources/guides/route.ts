import { NextRequest, NextResponse } from 'next/server';
import { getAllGuides, createGuide, generateUniqueGuideSlug, getAllGuideTags, AdminGuideData } from '@/lib/services/admin/admin-guide-service';
import { ResourceFilters } from '@/lib/types';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ResourceFilters = {
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      difficulty: searchParams.get('difficulty') as 'beginner' | 'intermediate' | 'advanced' || undefined,
      published: searchParams.get('published') ? searchParams.get('published') === 'true' : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Special endpoint for tags
    if (searchParams.get('tags_only') === 'true') {
      const tags = await getAllGuideTags();
      return NextResponse.json({ tags });
    }

    const guides = await getAllGuides(filters);
    
    return NextResponse.json({
      success: true,
      guides,
      count: guides.length,
    });
  } catch (error: any) {
    console.error('Error fetching guides:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch guides' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const guideData: AdminGuideData = await request.json();

    // Validate required fields
    if (!guideData.title || !guideData.content || !guideData.difficulty_level) {
      return NextResponse.json(
        { success: false, error: 'Title, content, and difficulty level are required' },
        { status: 400 }
      );
    }

    // Validate difficulty level
    if (!['beginner', 'intermediate', 'advanced'].includes(guideData.difficulty_level)) {
      return NextResponse.json(
        { success: false, error: 'Difficulty level must be beginner, intermediate, or advanced' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!guideData.slug) {
      guideData.slug = await generateUniqueGuideSlug(guideData.title);
    } else {
      // Validate slug uniqueness if provided
      const { checkGuideSlugUnique } = await import('@/lib/services/admin/admin-guide-service');
      const isUnique = await checkGuideSlugUnique(guideData.slug);
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

    const guide = await createGuide(guideData);
    
    return NextResponse.json({
      success: true,
      guide,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating guide:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create guide' },
      { status: 500 }
    );
  }
} 