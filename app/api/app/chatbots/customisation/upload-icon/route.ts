import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import {
  authenticateChatbotRoute,
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
    const chatbotType = formData.get('chatbotType') as string;
    const fieldKey = formData.get('fieldKey') as string | null;
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId || null);

    if (!file || !chatbotType) {
      return NextResponse.json(
        { error: 'File and chatbot type are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPEG, or SVG images only.' },
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

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'png';
    const timestamp = Date.now();
    const fileName = `${venueId}-${chatbotType}-icon-${timestamp}.${fileExt}`;
    const filePath = `chatbots/${venueId}/${chatbotType}/icons/${fileName}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    const allowedFieldKeys = new Set([
      'custom_logo_url',
      'custom_header_icon_url',
      'custom_bot_avatar_url',
      'custom_user_avatar_url',
      'mobile_custom_logo_url',
      'mobile_custom_header_icon_url',
      'mobile_custom_bot_avatar_url',
      'mobile_custom_user_avatar_url',
    ]);
    const targetFieldKey = fieldKey && allowedFieldKeys.has(fieldKey) ? fieldKey : 'custom_logo_url';

    // Check if venue already has a custom image for this specific field and delete old one
    try {
      const { data: existingCustomisation } = await supabase
        .from('chatbot_customisations')
        .select(targetFieldKey)
        .eq('venue_id', venueId)
        .eq('chatbot_type', chatbotType)
        .single();

      const existingCustomisationRecord = existingCustomisation as Record<string, string | null> | null;
      const existingImageUrl = existingCustomisationRecord?.[targetFieldKey];
      if (existingImageUrl) {
        // Extract file path from URL and delete old image
        const oldUrl = existingImageUrl;
        const urlParts = oldUrl.split('/storage/v1/object/public/chatbots/');
        if (urlParts.length > 1) {
          const oldFilePath = urlParts[1];
          await supabaseServiceRole.storage
            .from('chatbots')
            .remove([oldFilePath]);
        }
      }
    } catch (error) {
      // Continue even if cleanup fails
      console.warn('Failed to cleanup old icon:', error);
    }

    // Upload new file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from('chatbots')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true // Allow overwrite
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
      fileName: fileName,
      fieldKey: targetFieldKey,
    });

  } catch (error: any) {
    console.error('Error uploading icon:', error);
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

    const { imageUrl, venueId: requestedVenueId, chatbotType } = await request.json();
    const venueScopeError = ensureVenueScope(authResult, requestedVenueId || null);
    if (venueScopeError) return venueScopeError;
    const venueId = getScopedVenueId(authResult, requestedVenueId || null);

    if (!imageUrl || !chatbotType) {
      return NextResponse.json(
        { error: 'Image URL and chatbot type are required' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/storage/v1/object/public/chatbots/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];
    const expectedPrefix = `chatbots/${venueId}/${chatbotType}/`;
    if (!filePath.startsWith(expectedPrefix)) {
      return NextResponse.json(
        { error: 'Forbidden: image path is outside allowed venue scope' },
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
    console.error('Error deleting icon:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
} 