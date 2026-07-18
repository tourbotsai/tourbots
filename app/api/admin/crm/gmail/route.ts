import { NextRequest, NextResponse } from 'next/server';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getActiveCrmGmailAccount, disconnectCrmGmailAccount } from '@/lib/services/admin/crm-gmail-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const account = await getActiveCrmGmailAccount();
    return NextResponse.json({ success: true, account });
  } catch (error: any) {
    console.error('Error in GET /api/admin/crm/gmail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch connected Gmail account' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    await disconnectCrmGmailAccount();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/crm/gmail:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to disconnect Gmail account' },
      { status: 500 }
    );
  }
}
