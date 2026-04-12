import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
  ensureTourScope,
  ensureVenueScope,
  getScopedVenueId,
} from '@/lib/chatbot-route-auth';

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const requestedVenueId = formData.get('venueId') as string;
    const tourId = formData.get('tourId') as string;
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId || null);

    if (!file || !venueId || !tourId) {
      return NextResponse.json(
        { error: 'File, venue ID, and tour ID are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPEG, SVG, or WebP images only.' },
        { status: 400 }
      );
    }

    // Validate file size (2MB limit)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Please upload images smaller than 2MB.' },
        { status: 400 }
      );
    }

    const tourScopeError = await ensureTourScope(venueId, tourId);
    if (tourScopeError) return tourScopeError;

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `logo-${timestamp}.${fileExt}`;
    const filePath = `tour-menus/${venueId}/${tourId}/logos/${fileName}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage (using chatbots bucket for now)
    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from('chatbots')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: `Failed to upload image: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('chatbots')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName: fileName
    });

  } catch (error: any) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateChatbotRoute(request);
    if (authResult instanceof NextResponse) return authResult;

    const { imageUrl, venueId: requestedVenueId, tourId } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId || null);

    if (!imageUrl || !venueId || !tourId) {
      return NextResponse.json(
        { error: 'Image URL, venue ID, and tour ID are required' },
        { status: 400 }
      );
    }

    const tourScopeError = await ensureTourScope(venueId, tourId);
    if (tourScopeError) return tourScopeError;

    // Extract file path from URL
    const urlParts = imageUrl.split('/storage/v1/object/public/chatbots/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];
    const expectedPrefix = `tour-menus/${venueId}/${tourId}/`;
    if (!filePath.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Forbidden: image path is outside allowed tour scope' },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: deleteError } = await supabaseServiceRole.storage
      .from('chatbots')
      .remove([filePath]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      return NextResponse.json(
        { error: `Failed to delete image: ${deleteError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully'
    });

  } catch (error: any) {
    console.error('Error deleting logo:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}

