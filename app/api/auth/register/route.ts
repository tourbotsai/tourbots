import { NextRequest, NextResponse } from 'next/server';
import { completeVenueRegistration } from '@/lib/user-service';
import { auth, initAdmin } from '@/lib/firebase-admin';

initAdmin();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      first_name,
      last_name,
      venue_name,
      phone
    } = body;

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({
        error: 'Authorisation header required'
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = await auth.verifyIdToken(token);
    const firebase_uid = decoded.uid;
    const email = decoded.email;

    // Validate required fields
    if (!email) {
      return NextResponse.json({
        error: 'Verified Firebase token does not include an email address'
      }, { status: 400 });
    }

    if (!first_name || !last_name || !venue_name) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    const result = await completeVenueRegistration({
      firebase_uid,
      email,
      first_name,
      last_name,
      venue_name,
      phone: phone || null,
    });

    return NextResponse.json({
      success: true,
      user: result.user,
      venue: result.venue,
    });
  } catch (err: any) {
    console.error('Error in registration API:', err);
    if (err?.code?.startsWith?.('auth/')) {
      return NextResponse.json({
        error: 'Invalid authentication token'
      }, { status: 401 });
    }
    return NextResponse.json({ 
      error: err.message || 'Registration failed' 
    }, { status: 500 });
  }
} 