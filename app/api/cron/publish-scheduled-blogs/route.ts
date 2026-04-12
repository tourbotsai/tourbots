import { NextRequest, NextResponse } from 'next/server';
import { getScheduledBlogs, publishScheduledBlog } from '@/lib/services/admin/admin-blog-service';
import { finishCronRun, startCronRun } from '@/lib/ops-monitoring';

function validateCronSecret(request: NextRequest): NextResponse | null {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error('❌ CRON_SECRET is not configured');
    return NextResponse.json(
      { success: false, error: 'CRON_SECRET is not configured' },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized - Invalid cron authentication' },
      { status: 401 }
    );
  }

  return null;
}

// Handle GET requests - this is what Vercel cron jobs call
export async function GET(request: NextRequest) {
  const startedAt = Date.now();
  let runId: string | null = null;
  try {
    const authError = validateCronSecret(request);
    if (authError) return authError;
    runId = await startCronRun({
      jobName: 'publish-scheduled-blogs',
      triggerSource: 'vercel_cron',
      context: { path: '/api/cron/publish-scheduled-blogs', method: 'GET' },
    });

    console.log('🔄 Cron job started - Publishing scheduled blogs...');

    // Get all blogs that are scheduled to be published
    const scheduledBlogs = await getScheduledBlogs();
    
    if (scheduledBlogs.length === 0) {
      console.log('📭 No blogs scheduled for publishing');
      await finishCronRun(runId, {
        status: 'success',
        startedAt,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        route: '/api/cron/publish-scheduled-blogs',
        method: 'GET',
      });
      return NextResponse.json({
        success: true,
        message: 'No blogs scheduled for publishing',
        publishedCount: 0,
      });
    }

    console.log(`📚 Found ${scheduledBlogs.length} blog(s) ready for publishing`);

    // Publish each scheduled blog
    const publishedBlogs = [];
    const errors = [];

    for (const blog of scheduledBlogs) {
      try {
        console.log(`📝 Publishing: "${blog.title}"`);
        const publishedBlog = await publishScheduledBlog(blog.id);
        
        publishedBlogs.push({
          id: publishedBlog.id,
          title: publishedBlog.title,
          slug: publishedBlog.slug,
          publishedAt: publishedBlog.published_at,
        });
        
        console.log(`✅ Published: "${blog.title}"`);
      } catch (error: any) {
        console.error(`❌ Failed to publish "${blog.title}":`, error.message);
        errors.push({
          blogId: blog.id,
          title: blog.title,
          error: error.message,
        });
      }
    }

    const result = {
      success: true,
      message: `Published ${publishedBlogs.length} of ${scheduledBlogs.length} scheduled blog(s)`,
      publishedCount: publishedBlogs.length,
      totalScheduled: scheduledBlogs.length,
      publishedBlogs,
      errors: errors.length > 0 ? errors : undefined,
    };

    await finishCronRun(runId, {
      status: errors.length > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: scheduledBlogs.length,
      successCount: publishedBlogs.length,
      failedCount: errors.length,
      route: '/api/cron/publish-scheduled-blogs',
      method: 'GET',
    });

    console.log(`🎉 Cron job completed: ${publishedBlogs.length}/${scheduledBlogs.length} blogs published`);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('💥 Error in cron job:', error.message);
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to publish scheduled blogs',
      route: '/api/cron/publish-scheduled-blogs',
      method: 'GET',
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish scheduled blogs' },
      { status: 500 }
    );
  }
}

// Handle POST requests for manual triggering
export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  let runId: string | null = null;
  try {
    const authError = validateCronSecret(request);
    if (authError) return authError;
    runId = await startCronRun({
      jobName: 'publish-scheduled-blogs',
      triggerSource: 'manual',
      context: { path: '/api/cron/publish-scheduled-blogs', method: 'POST' },
    });

    console.log('🔄 Manual trigger started...');

    // Get all blogs that are scheduled to be published
    const scheduledBlogs = await getScheduledBlogs();
    
    if (scheduledBlogs.length === 0) {
      await finishCronRun(runId, {
        status: 'success',
        startedAt,
        processedCount: 0,
        successCount: 0,
        failedCount: 0,
        route: '/api/cron/publish-scheduled-blogs',
        method: 'POST',
      });
      return NextResponse.json({
        success: true,
        message: 'No blogs scheduled for publishing',
        publishedCount: 0,
      });
    }

    // Publish each scheduled blog
    const publishedBlogs = [];
    const errors = [];

    for (const blog of scheduledBlogs) {
      try {
        const publishedBlog = await publishScheduledBlog(blog.id);
        publishedBlogs.push({
          id: publishedBlog.id,
          title: publishedBlog.title,
          slug: publishedBlog.slug,
          publishedAt: publishedBlog.published_at,
        });
      } catch (error: any) {
        errors.push({
          blogId: blog.id,
          title: blog.title,
          error: error.message,
        });
      }
    }

    const result = {
      success: true,
      message: `Published ${publishedBlogs.length} of ${scheduledBlogs.length} scheduled blog(s)`,
      publishedCount: publishedBlogs.length,
      totalScheduled: scheduledBlogs.length,
      publishedBlogs,
      errors: errors.length > 0 ? errors : undefined,
    };

    await finishCronRun(runId, {
      status: errors.length > 0 ? 'partial' : 'success',
      startedAt,
      processedCount: scheduledBlogs.length,
      successCount: publishedBlogs.length,
      failedCount: errors.length,
      route: '/api/cron/publish-scheduled-blogs',
      method: 'POST',
    });

    console.log(`✅ Manual trigger completed: ${publishedBlogs.length}/${scheduledBlogs.length} blogs published`);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('💥 Error in manual trigger:', error.message);
    await finishCronRun(runId, {
      status: 'failed',
      startedAt,
      errorMessage: error.message || 'Failed to publish scheduled blogs',
      route: '/api/cron/publish-scheduled-blogs',
      method: 'POST',
    });
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to publish scheduled blogs' },
      { status: 500 }
    );
  }
} 