import { NextRequest, NextResponse } from 'next/server';
import { createPaymentLink } from '@/lib/stripe-admin';
import { PaymentLinkRequest } from '@/lib/types';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';
import { getPlatformAdminUserId } from '@/lib/platform-admin';

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;
    const platformAdminUserId = getPlatformAdminUserId();

    const body: PaymentLinkRequest = await request.json();
    
    const { venueId, customerEmail, planName, customPrice, billingCycle = 'monthly' } = body;

    if (!venueId || !customerEmail || !planName) {
      return NextResponse.json(
        { error: 'Venue ID, customer email, and plan name are required' },
        { status: 400 }
      );
    }

    // Validate plan name
    if (!['pro', 'essential', 'professional'].includes(planName)) {
      return NextResponse.json(
        { error: 'Invalid plan name' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle' },
        { status: 400 }
      );
    }

    // Validate custom price if provided
    if (customPrice !== undefined && (customPrice <= 0 || customPrice > 10000)) {
      return NextResponse.json(
        { error: 'Custom price must be between £0.01 and £10,000' },
        { status: 400 }
      );
    }

    const result = await createPaymentLink({
      venueId,
      customerEmail,
      planName,
      customPrice,
      billingCycle, // Pass the billingCycle
      createdBy: platformAdminUserId,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating payment link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment link' },
      { status: 500 }
    );
  }
} 