import { NextRequest, NextResponse } from 'next/server';
import { getHelpArticleById, updateHelpArticle, deleteHelpArticle, AdminHelpArticleData, checkSlugUnique } from '@/lib/services/admin/admin-help-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const article = await getHelpArticleById(params.id);
    
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Help article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error: any) {
    console.error('Error fetching help article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch help article' },
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

    const articleData: Partial<AdminHelpArticleData> = await request.json();

    // Validate category if provided
    if (articleData.category) {
      const validCategories = ['getting-started', 'tours', 'chatbots', 'analytics', 'billing', 'troubleshooting'];
      if (!validCategories.includes(articleData.category)) {
        return NextResponse.json(
          { success: false, error: 'Invalid category provided' },
          { status: 400 }
        );
      }
    }

    // Validate slug uniqueness if provided
    if (articleData.slug) {
      const isUnique = await checkSlugUnique(articleData.slug, params.id);
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

    const article = await updateHelpArticle(params.id, articleData);
    
    return NextResponse.json({
      success: true,
      article,
    });
  } catch (error: any) {
    console.error('Error updating help article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update help article' },
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

    await deleteHelpArticle(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Help article deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting help article:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete help article' },
      { status: 500 }
    );
  }
} 