import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';

const PRIMARY_AGENCY_BUCKET = process.env.SUPABASE_AGENCY_BUCKET || 'Agency';
const FALLBACK_AGENCY_BUCKET = PRIMARY_AGENCY_BUCKET === 'Agency' ? 'agency' : 'Agency';

function getFileExtension(filename: string, fallback = 'png'): string {
  const parts = filename.split('.');
  if (parts.length < 2) return fallback;
  return parts[parts.length - 1].toLowerCase();
}

function extractAgencyPathFromUrl(imageUrl: string, bucketName: string): string | null {
  const marker = `/storage/v1/object/public/${bucketName}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.substring(idx + marker.length);
}

async function upsertAgencyLogoUrl(venueId: string, logoUrl: string | null) {
  await supabase
    .from('agency_portal_settings')
    .upsert(
      {
        venue_id: venueId,
        logo_url: logoUrl,
      },
      { onConflict: 'venue_id' }
    );
}

async function uploadToAgencyBucket(
  bucketName: string,
  filePath: string,
  buffer: ArrayBuffer,
  contentType: string
) {
  const { error } = await supabaseServiceRole.storage.from(bucketName).upload(filePath, buffer, {
    contentType,
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    throw error;
  }

  return supabase.storage.from(bucketName).getPublicUrl(filePath).data.publicUrl;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = authResult;
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required.' }, { status: 400 });
    }

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Upload PNG, JPEG, SVG, or WebP only.' },
        { status: 400 }
      );
    }

    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size must be under 2MB.' }, { status: 400 });
    }

    const existing = await supabase
      .from('agency_portal_settings')
      .select('logo_url')
      .eq('venue_id', venueId)
      .maybeSingle();

    const oldLogoUrl = existing.data?.logo_url;
    if (oldLogoUrl) {
      const oldPath =
        extractAgencyPathFromUrl(oldLogoUrl, PRIMARY_AGENCY_BUCKET) ||
        extractAgencyPathFromUrl(oldLogoUrl, FALLBACK_AGENCY_BUCKET);
      if (oldPath) {
        await supabaseServiceRole.storage
          .from(oldLogoUrl.includes(`/${FALLBACK_AGENCY_BUCKET}/`) ? FALLBACK_AGENCY_BUCKET : PRIMARY_AGENCY_BUCKET)
          .remove([oldPath]);
      }
    }

    const ext = getFileExtension(file.name, 'png');
    const filePath = `agencies/${venueId}/logo-${Date.now()}.${ext}`;
    const buffer = await file.arrayBuffer();

    let publicUrl: string;
    try {
      publicUrl = await uploadToAgencyBucket(PRIMARY_AGENCY_BUCKET, filePath, buffer, file.type);
    } catch (primaryError: any) {
      if (typeof primaryError?.message === 'string' && primaryError.message.includes('Bucket not found')) {
        publicUrl = await uploadToAgencyBucket(FALLBACK_AGENCY_BUCKET, filePath, buffer, file.type);
      } else {
        return NextResponse.json({ error: primaryError?.message || 'Failed to upload logo.' }, { status: 500 });
      }
    }

    await upsertAgencyLogoUrl(venueId, publicUrl);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      filePath,
    });
  } catch (error: any) {
    console.error('Agency logo upload error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to upload logo.' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { venueId } = authResult;
    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body?.imageUrl === 'string' ? body.imageUrl : null;

    let logoUrl = imageUrl;
    if (!logoUrl) {
      const current = await supabase
        .from('agency_portal_settings')
        .select('logo_url')
        .eq('venue_id', venueId)
        .maybeSingle();
      logoUrl = current.data?.logo_url || null;
    }

    if (logoUrl) {
      const primaryPath = extractAgencyPathFromUrl(logoUrl, PRIMARY_AGENCY_BUCKET);
      const fallbackPath = extractAgencyPathFromUrl(logoUrl, FALLBACK_AGENCY_BUCKET);
      const path = primaryPath || fallbackPath;
      if (path) {
        const bucketName = primaryPath ? PRIMARY_AGENCY_BUCKET : FALLBACK_AGENCY_BUCKET;
        await supabaseServiceRole.storage.from(bucketName).remove([path]);
      }
    }

    await upsertAgencyLogoUrl(venueId, null);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Agency logo delete error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to remove logo.' }, { status: 500 });
  }
}

