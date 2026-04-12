import { NextRequest, NextResponse } from 'next/server';
import { getAllHelpArticles, createHelpArticle, generateUniqueSlug, getAllHelpTags, AdminHelpArticleData, checkSlugUnique } from '@/lib/services/admin/admin-help-service';
import { HelpArticleFilters } from '@/lib/types';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: HelpArticleFilters = {
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      category: searchParams.get('category') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Special endpoint for tags
    if (searchParams.get('tags_only') === 'true') {
      const tags = await getAllHelpTags();
      return NextResponse.json({ tags });
    }

    const articles = await getAllHelpArticles(filters);
    
    return NextResponse.json({
      success: true,
      articles,
      count: articles.length,
    });
  } catch (error: any) {
    console.error('Error fetching help articles:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch help articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const articleData: AdminHelpArticleData = await request.json();

    // Validate required fields
    if (!articleData.title || !articleData.content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['getting-started', 'tours', 'chatbots', 'analytics', 'billing', 'troubleshooting'];
    if (!articleData.category || !validCategories.includes(articleData.category)) {
      return NextResponse.json(
        { success: false, error: 'Valid category is required' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    if (!articleData.slug) {
      articleData.slug = await generateUniqueSlug(articleData.title);
    } else {
      // Validate slug uniqueness if provided
      const isUnique = await checkSlugUnique(articleData.slug);
      if (!isUnique) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists. Please choose a different slug.' },
          { status: 400 }
        );
      }
    }

    // Validate tags if provided
    if (articleData.tags && articleData.tags.some((tag: string) => typeof tag !== 'string' || tag.trim().length === 0)) {
      return NextResponse.json(
        { success: false, error: 'All tags must be non-empty strings' },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (articleData.priority !== undefined && (typeof articleData.priority !== 'number' || articleData.priority < 0 || articleData.priority > 100)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    const article = await createHelpArticle(articleData);
    
    return NextResponse.json({
      success: true,
      article,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating help article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create help article' },
      { status: 500 }
    );
  }
} 