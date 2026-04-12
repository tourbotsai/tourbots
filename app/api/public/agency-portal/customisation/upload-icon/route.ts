import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

const ALLOWED_ICON_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']);
const ALLOWED_FIELD_KEYS = new Set([
  'custom_logo_url',
  'custom_header_icon_url',
  'custom_bot_avatar_url',
  'custom_user_avatar_url',
  'mobile_custom_logo_url',
  'mobile_custom_header_icon_url',
  'mobile_custom_bot_avatar_url',
  'mobile_custom_user_avatar_url',
]);

function getFieldKey(rawFieldKey: FormDataEntryValue | null): string {
  const value = typeof rawFieldKey === 'string' ? rawFieldKey : '';
  return ALLOWED_FIELD_KEYS.has(value) ? value : 'custom_logo_url';
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let shareSlug: string | undefined;
    let chatbotType: string | null = null;
    let fieldKeyRaw: string | null = null;
    let fileName = 'icon.png';
    let fileType = '';
    let fileBuffer: Uint8Array | null = null;

    if (contentType.includes('application/json')) {
      const payload = await request.json().catch(() => ({}));
      shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;
      chatbotType = typeof payload?.chatbotType === 'string' ? payload.chatbotType : null;
      fieldKeyRaw = typeof payload?.fieldKey === 'string' ? payload.fieldKey : null;
      fileName = typeof payload?.fileName === 'string' ? payload.fileName : fileName;
      fileType = typeof payload?.fileType === 'string' ? payload.fileType : '';

      const fileBase64 = typeof payload?.fileBase64 === 'string' ? payload.fileBase64 : '';
      if (fileBase64) {
        fileBuffer = Uint8Array.from(Buffer.from(fileBase64, 'base64'));
      }
    } else {
      const formData = await request.formData();
      shareSlug = typeof formData.get('shareSlug') === 'string' ? (formData.get('shareSlug') as string) : undefined;
      const rawChatbotType = formData.get('chatbotType');
      const rawFieldKey = formData.get('fieldKey');
      chatbotType = typeof rawChatbotType === 'string' ? rawChatbotType : null;
      fieldKeyRaw = typeof rawFieldKey === 'string' ? rawFieldKey : null;

      const file = formData.get('file') as File | null;
      if (file) {
        fileName = file.name || fileName;
        fileType = file.type || '';
        fileBuffer = new Uint8Array(await file.arrayBuffer());
      }
    }

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'customisation',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const fieldKey = getFieldKey(fieldKeyRaw);
    if (!fileBuffer || chatbotType !== 'tour') {
      return NextResponse.json({ error: 'File and chatbot type are required' }, { status: 400 });
    }

    if (!ALLOWED_ICON_TYPES.has(fileType)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPEG, or SVG images only.' },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024;
    if (fileBuffer.byteLength > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Please upload images smaller than 2MB.' },
        { status: 400 }
      );
    }

    let oldFilePath: string | null = null;
    try {
      const { data: existingCustomisation } = await supabase
        .from('chatbot_customisations')
        .select(fieldKey)
        .eq('venue_id', session.venueId)
        .eq('tour_id', session.tourId)
        .eq('chatbot_type', 'tour')
        .maybeSingle();

      const existingRecord = existingCustomisation as Record<string, string | null> | null;
      const existingImageUrl = existingRecord?.[fieldKey];
      if (existingImageUrl) {
        const urlParts = existingImageUrl.split('/storage/v1/object/public/chatbots/');
        if (urlParts.length > 1) {
          oldFilePath = urlParts[1];
        }
      }
    } catch (cleanupError) {
      console.warn('Failed to cleanup agency icon:', cleanupError);
    }

    const fileExt = fileName.split('.').pop() || 'png';
    const uploadedFileName = `${session.venueId}-tour-icon-${Date.now()}.${fileExt}`;
    const filePath = `chatbots/${session.venueId}/tour/icons/${uploadedFileName}`;

    const { error: uploadError } = await withTimeout(
      supabaseServiceRole.storage.from('chatbots').upload(filePath, fileBuffer, {
        contentType: fileType,
        cacheControl: '3600',
        upsert: true,
      }),
      15000,
      'chatbot icon upload'
    );

    if (uploadError) {
      return NextResponse.json({ error: `Failed to upload image: ${uploadError.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from('chatbots').getPublicUrl(filePath);

    // Old icon cleanup should never block the upload response path.
    if (oldFilePath) {
      void supabaseServiceRole.storage
        .from('chatbots')
        .remove([oldFilePath])
        .catch((cleanupError) => {
          console.warn('Failed to cleanup previous agency icon:', cleanupError);
        });
    }

    return NextResponse.json({
      success: true,
      imageUrl: data.publicUrl,
      fileName: uploadedFileName,
      fieldKey,
    });
  } catch (error: any) {
    console.error('Agency icon upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'customisation',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const imageUrl = typeof payload?.imageUrl === 'string' ? payload.imageUrl : null;
    const chatbotType = payload?.chatbotType;
    if (!imageUrl || chatbotType !== 'tour') {
      return NextResponse.json({ error: 'Image URL and chatbot type are required' }, { status: 400 });
    }

    const urlParts = imageUrl.split('/storage/v1/object/public/chatbots/');
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 });
    }

    const filePath = urlParts[1];
    const expectedPrefix = `chatbots/${session.venueId}/tour/`;
    if (!filePath.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Forbidden: image path is outside allowed scope' }, { status: 403 });
    }

    const { error: deleteError } = await withTimeout(
      supabaseServiceRole.storage.from('chatbots').remove([filePath]),
      15000,
      'chatbot icon delete'
    );
    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete image: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Agency icon delete error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete image' }, { status: 500 });
  }
}
