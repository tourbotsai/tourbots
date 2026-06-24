import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateChatbotRoute, ensureVenueScope } from '@/lib/chatbot-route-auth';

// Returns a short-lived signed URL for an owner to view/download one of their
// chatbot training documents. The venue-documents bucket is private (see
// sql/40_make_venue_documents_private.sql), so documents are never served by a
// permanent public URL. The signed URL is generated server-side with the
// service-role key after verifying the caller owns the document's venue.
const SIGNED_URL_TTL_SECONDS = 60;

export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const requestedVenueId = searchParams.get('venueId');
    const venueId = authResult.venueId;

    const venueScopeError = ensureVenueScope(authResult, requestedVenueId);
    if (venueScopeError) return venueScopeError;

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 });
    }

    let query = supabase
      .from('chatbot_documents')
      .select('id, venue_id, file_path')
      .eq('id', documentId);

    if (venueId) {
      // Ensure the caller can only open documents belonging to their venue.
      query = query.eq('venue_id', venueId);
    }

    const { data: document, error } = await query.single();

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from('venue-documents')
      .createSignedUrl(document.file_path, SIGNED_URL_TTL_SECONDS);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: 'Could not generate document link' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (error: any) {
    console.error('Error generating document view URL:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to open document' },
      { status: 500 }
    );
  }
}
