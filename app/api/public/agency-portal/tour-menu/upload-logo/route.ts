import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp']);

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
    const formData = await request.formData();
    const shareSlug = typeof formData.get('shareSlug') === 'string' ? (formData.get('shareSlug') as string) : undefined;
    const file = formData.get('file') as File | null;

    // The client's venue + tour are derived from the authenticated portal
    // session, never trusted from the request body.
    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'tour',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPEG, SVG, or WebP images only.' },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Please upload images smaller than 2MB.' },
        { status: 400 }
      );
    }

    const fileBuffer = new Uint8Array(await file.arrayBuffer());
    const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
    const fileName = `logo-${Date.now()}.${fileExt}`;
    const filePath = `tour-menus/${session.venueId}/${session.tourId}/logos/${fileName}`;

    const { error: uploadError } = await withTimeout(
      supabaseServiceRole.storage.from('chatbots').upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true,
      }),
      15000,
      'tour menu logo upload'
    );

    if (uploadError) {
      return NextResponse.json({ error: `Failed to upload image: ${uploadError.message}` }, { status: 500 });
    }

    const { data } = supabase.storage.from('chatbots').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      imageUrl: data.publicUrl,
      fileName,
    });
  } catch (error: any) {
    console.error('Agency tour menu logo upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = await request.json().catch(() => ({}));
    const shareSlug = typeof payload?.shareSlug === 'string' ? payload.shareSlug : undefined;

    const session = await requireAgencyPortalSession(request, {
      shareSlug,
      requiredModule: 'tour',
      requireCsrf: true,
    });
    if (session instanceof NextResponse) return session;

    const imageUrl = typeof payload?.imageUrl === 'string' ? payload.imageUrl : null;
    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 });
    }

    const urlParts = imageUrl.split('/storage/v1/object/public/chatbots/');
    if (urlParts.length < 2) {
      return NextResponse.json({ error: 'Invalid image URL format' }, { status: 400 });
    }

    const filePath = urlParts[1];
    const expectedPrefix = `tour-menus/${session.venueId}/${session.tourId}/`;
    if (!filePath.startsWith(expectedPrefix)) {
      return NextResponse.json({ error: 'Forbidden: image path is outside allowed tour scope' }, { status: 403 });
    }

    const { error: deleteError } = await withTimeout(
      supabaseServiceRole.storage.from('chatbots').remove([filePath]),
      15000,
      'tour menu logo delete'
    );
    if (deleteError) {
      return NextResponse.json({ error: `Failed to delete image: ${deleteError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    console.error('Agency tour menu logo delete error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete image' }, { status: 500 });
  }
}
