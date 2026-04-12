import { NextRequest, NextResponse } from 'next/server';
import { bulkUpdateHelpArticles, AdminHelpArticleData } from '@/lib/services/admin/admin-help-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function PUT(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { articleIds, updates }: { 
      articleIds: string[]; 
      updates: Partial<AdminHelpArticleData>; 
    } = await request.json();

    // Validate required fields
    if (!articleIds || !Array.isArray(articleIds) || articleIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Article IDs array is required' },
        { status: 400 }
      );
    }

    if (!updates || typeof updates !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Updates object is required' },
        { status: 400 }
      );
    }

    // Validate category if provided in updates
    if (updates.category) {
      const validCategories = ['getting-started', 'tours', 'chatbots', 'analytics', 'billing', 'troubleshooting'];
      if (!validCategories.includes(updates.category)) {
        return NextResponse.json(
          { success: false, error: 'Invalid category provided' },
          { status: 400 }
        );
      }
    }

    // Validate priority if provided in updates
    if (updates.priority !== undefined && (typeof updates.priority !== 'number' || updates.priority < 0 || updates.priority > 100)) {
      return NextResponse.json(
        { success: false, error: 'Priority must be a number between 0 and 100' },
        { status: 400 }
      );
    }

    // If publishing, set published_at for bulk operation
    if (updates.is_published === true && !updates.published_at) {
      updates.published_at = new Date().toISOString();
    }

    await bulkUpdateHelpArticles(articleIds, updates);
    
    return NextResponse.json({
      success: true,
      message: `Successfully updated ${articleIds.length} help article(s)`,
      updatedCount: articleIds.length,
    });
  } catch (error: any) {
    console.error('Error bulk updating help articles:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to bulk update help articles' },
      { status: 500 }
    );
  }
} 