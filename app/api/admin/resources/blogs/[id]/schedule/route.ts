import { NextRequest, NextResponse } from 'next/server';
import { scheduleBlog, cancelScheduledBlog } from '@/lib/services/admin/admin-blog-service';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

// Schedule a blog for future publishing
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { scheduled_publish_at, timezone } = await request.json();

    if (!scheduled_publish_at) {
      return NextResponse.json(
        { success: false, error: 'Scheduled publish date is required' },
        { status: 400 }
      );
    }

    // Validate the scheduled date is in the future
    const scheduledDate = new Date(scheduled_publish_at);
    const now = new Date();
    
    if (scheduledDate <= now) {
      return NextResponse.json(
        { success: false, error: 'Scheduled date must be in the future' },
        { status: 400 }
      );
    }

    const blog = await scheduleBlog(params.id, scheduled_publish_at, timezone);
    
    return NextResponse.json({
      success: true,
      message: 'Blog scheduled successfully',
      blog,
    });
  } catch (error: any) {
    console.error('Error scheduling blog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to schedule blog' },
      { status: 500 }
    );
  }
}

// Cancel scheduled publishing
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const blog = await cancelScheduledBlog(params.id);
    
    return NextResponse.json({
      success: true,
      message: 'Scheduled publishing cancelled',
      blog,
    });
  } catch (error: any) {
    console.error('Error cancelling scheduled blog:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to cancel scheduled blog' },
      { status: 500 }
    );
  }
} 