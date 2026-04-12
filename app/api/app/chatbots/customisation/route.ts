import { NextRequest, NextResponse } from 'next/server';
import {
  getChatbotCustomisation,
  upsertChatbotCustomisation,
  getVenueChatbotCustomisations,
  deleteChatbotCustomisation,
} from '@/lib/server/chatbot-customisation-db';
import { authenticateChatbotRoute, ensureTourScope, ensureVenueScope, logChatbotAudit } from '@/lib/chatbot-route-auth';

const DEFAULT_PUBLIC_DEMO_VENUE_ID = 'b1afe3a3-303f-463c-bbd3-6673be4833b6';
const DEFAULT_PUBLIC_DEMO_TOUR_ID = 'd0ceaccc-e3f4-427f-b798-19d4c5f1d85e';
const PUBLIC_DEMO_VENUE_ID = process.env.NEXT_PUBLIC_DEMO_VENUE_ID || DEFAULT_PUBLIC_DEMO_VENUE_ID;
const PUBLIC_DEMO_TOUR_ID = process.env.NEXT_PUBLIC_DEMO_TOUR_ID || DEFAULT_PUBLIC_DEMO_TOUR_ID;

function isAllowedPublicDemoRead(
  venueId: string,
  chatbotType: string | null,
  tourId: string | null
): boolean {
  return Boolean(
    chatbotType === 'tour' &&
      tourId &&
      venueId === PUBLIC_DEMO_VENUE_ID &&
      tourId === PUBLIC_DEMO_TOUR_ID
  );
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const venueId = searchParams.get('venueId');
    const chatbotType = searchParams.get('chatbotType') as string | null;
    const tourId = searchParams.get('tourId');

    if (!venueId) {
      return NextResponse.json(
        { error: 'Venue ID is required' },
        { status: 400 }
      );
    }

    const allowPublicDemoRead = isAllowedPublicDemoRead(venueId, chatbotType, tourId);
    if (!allowPublicDemoRead) {
      const authResult = await authenticateChatbotRoute(request);
      if (authResult instanceof NextResponse) return authResult;

      const venueScopeError = ensureVenueScope(authResult, venueId);
      if (venueScopeError) return venueScopeError;

      if (chatbotType === 'tour' && tourId) {
        const tourScopeError = await ensureTourScope(authResult.venueId, tourId);
        if (tourScopeError) return tourScopeError;
      }
    }

    if (chatbotType) {
      if (chatbotType !== 'tour') {
        return NextResponse.json(
          { error: 'Invalid chatbot type. Only "tour" is supported' },
          { status: 400 }
        );
      }
      if (!tourId) {
        return NextResponse.json(
          { error: 'Tour ID is required for tour chatbot customisation' },
          { status: 400 }
        );
      }
      const customisation = await getChatbotCustomisation(venueId, 'tour', tourId);
      return NextResponse.json(customisation);
    } else {
      // Get all customisations for venue
      const customisations = await getVenueChatbotCustomisations(venueId);
      return NextResponse.json(customisations);
    }
  } catch (error: any) {
    console.error('Error fetching chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, tourId, chatbotType, customisation } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const tourScopeError = await ensureTourScope(authResult.venueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !tourId || !chatbotType) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    const updatedCustomisation = await upsertChatbotCustomisation(
      authResult.venueId,
      'tour',
      tourId,
      customisation
    );

    logChatbotAudit('chatbot_customisation_updated', authResult, { tour_id: tourId });
    return NextResponse.json(updatedCustomisation);
  } catch (error: any) {
    console.error('Error updating chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to update chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, tourId, chatbotType, customisation } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const tourScopeError = await ensureTourScope(authResult.venueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !tourId || !chatbotType) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    const newCustomisation = await upsertChatbotCustomisation(
      authResult.venueId,
      'tour',
      tourId,
      customisation
    );

    logChatbotAudit('chatbot_customisation_created', authResult, { tour_id: tourId });
    return NextResponse.json(newCustomisation);
  } catch (error: any) {
    console.error('Error creating chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create chatbot customisation' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId, tourId, chatbotType } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, venueId);
    if (venueScopeError) return venueScopeError;
    const tourScopeError = await ensureTourScope(authResult.venueId, tourId);
    if (tourScopeError) return tourScopeError;

    if (!venueId || !tourId || !chatbotType) {
      return NextResponse.json(
        { error: 'Venue ID, tour ID and chatbot type are required' },
        { status: 400 }
      );
    }

    if (chatbotType !== 'tour') {
      return NextResponse.json(
        { error: 'Invalid chatbot type. Only "tour" is supported' },
        { status: 400 }
      );
    }

    await deleteChatbotCustomisation(authResult.venueId, 'tour', tourId);

    logChatbotAudit('chatbot_customisation_deleted', authResult, { tour_id: tourId });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting chatbot customisation:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete chatbot customisation' },
      { status: 500 }
    );
  }
} 