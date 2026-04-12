import { NextRequest, NextResponse } from 'next/server';
import { createRegistrationPaymentLink } from '@/lib/billing-access-control';
import { getUserWithVenue } from '@/lib/user-service';
import { initAdmin } from '@/lib/firebase-admin';
import { getAuth } from 'firebase-admin/auth';

initAdmin();
const auth = getAuth();

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const decodedToken = await auth.verifyIdToken(token);
    
    // Get user with venue information
    const userWithVenue = await getUserWithVenue(decodedToken.uid);
    
    if (!userWithVenue) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!userWithVenue.venue_id) {
      return NextResponse.json(
        { error: 'User not associated with a venue' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { planName = 'essential' } = body;

    // Validate plan name
    if (!['essential', 'professional'].includes(planName)) {
      return NextResponse.json(
        { error: 'Invalid plan name' },
        { status: 400 }
      );
    }

    // Create payment link
    const paymentLink = await createRegistrationPaymentLink(
      userWithVenue.venue_id,
      userWithVenue.email,
      planName
    );

    if (!paymentLink) {
      return NextResponse.json(
        { error: 'Failed to create payment link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentLink,
      planName,
    });
  } catch (error: any) {
    console.error('Error creating registration payment link:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment link' },
      { status: 500 }
    );
  }
} 