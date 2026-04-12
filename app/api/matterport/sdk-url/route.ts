import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId')?.trim();
    
    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Matterport model IDs are short alphanumeric tokens.
    const isValidModelId = /^[A-Za-z0-9]+$/.test(modelId);
    if (!isValidModelId) {
      return NextResponse.json(
        { error: 'Invalid model ID' },
        { status: 400 }
      );
    }
    
    // Enhanced URL parameters for cleaner, more branded experience
    const cleanParams = [
      'play=1',      // Auto-play
      'help=0',      // Hide help
      'brand=0',     // Hide branding
      'dh=0',        // Hide dollhouse view
      'gt=0',        // Hide built-in tour buttons
      'views=0',     // Hide views
      'hr=0',        // Hide highlight reel
      'mls=2',       // MLS-friendly (removes about panel too)
      'mt=0',        // Hide mattertags
      'f=0',         // Remove floor switching
      'fp=0',        // Hide floor plan
      'search=0',    // Hide search
      //'wh=0',        // Ignore scroll wheel
      'title=0',     // Hide space title
      'vr=0'         // Hide VR button
    ].join('&');

    // Production hardening: never expose SDK keys in API responses.
    const safeUrl = `https://my.matterport.com/show/?m=${modelId}&${cleanParams}&qs=0&ts=0&hl=0&guides=0`;

    return NextResponse.json({ 
      url: safeUrl,
      hasSDK: false
    });
    
  } catch (error: any) {
    console.error('Error generating Matterport URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate Matterport URL' },
      { status: 500 }
    );
  }
} 