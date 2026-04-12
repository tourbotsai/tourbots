import { NextRequest, NextResponse } from 'next/server';
import { getPaymentLinks, getSubscriptions } from '@/lib/stripe-admin';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'links') {
      const paymentLinks = await getPaymentLinks();
      return NextResponse.json({ paymentLinks });
    } else if (type === 'subscriptions') {
      const subscriptions = await getSubscriptions();
      return NextResponse.json({ subscriptions });
    } else {
      // Return both by default
      const [paymentLinks, subscriptions] = await Promise.all([
        getPaymentLinks(),
        getSubscriptions()
      ]);
      
      return NextResponse.json({ 
        paymentLinks, 
        subscriptions 
      });
    }
  } catch (error: any) {
    console.error('Error fetching payment data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
} 