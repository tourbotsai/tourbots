import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

// Manual trigger for testing scheduled blog publishing
export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    console.log('🔄 Manually triggering scheduled blog publishing...');

    // Call the cron endpoint directly with proper authentication
    const cronUrl = new URL('/api/cron/publish-scheduled-blogs', request.url);
    
    const cronResponse = await fetch(cronUrl.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET}`,
        'User-Agent': 'manual-trigger/1.0',
        'Content-Type': 'application/json',
      },
    });

    const cronResult = await cronResponse.json();

    if (!cronResponse.ok) {
      console.error('❌ Manual trigger failed:', cronResult);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to trigger cron job',
          details: cronResult 
        },
        { status: cronResponse.status }
      );
    }

    console.log('✅ Manual trigger completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Cron job triggered manually',
      result: cronResult,
      triggeredAt: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('💥 Error in manual trigger:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger cron job' },
      { status: 500 }
    );
  }
} 