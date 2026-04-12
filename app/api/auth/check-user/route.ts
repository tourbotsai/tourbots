import { NextRequest, NextResponse } from 'next/server';
import {
  extractBearerToken,
  resolveCachedUserWithVenueFromBearerToken,
} from '@/lib/server-auth-context';

export async function POST(req: NextRequest) {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      return NextResponse.json({
        error: 'Authorisation header required'
      }, { status: 401 });
    }

    const user = await resolveCachedUserWithVenueFromBearerToken(token);
    
    if (!user) {
      return NextResponse.json({ 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (err: any) {
    console.error('Error checking user:', err);
    return NextResponse.json({ 
      error: err.message || 'Failed to check user' 
    }, { status: 500 });
  }
} 