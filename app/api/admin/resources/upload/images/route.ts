import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { supabaseServiceRole } from '@/lib/supabase-service-role';
import { requirePlatformAdmin } from '@/lib/api/require-platform-admin';

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const resourceType = formData.get('resourceType') as string; // 'blogs' or 'guides'
    const imageType = formData.get('imageType') as string; // 'cover', 'header', or 'additional'
    const resourceId = formData.get('resourceId') as string; // optional, for updating existing

    if (!file || !resourceType || !imageType) {
      return NextResponse.json(
        { error: 'File, resource type, and image type are required' },
        { status: 400 }
      );
    }

    // Validate resource type
    if (!['blogs', 'guides', 'ebooks'].includes(resourceType)) {
      return NextResponse.json(
        { error: 'Resource type must be "blogs", "guides", or "ebooks"' },
        { status: 400 }
      );
    }

    // Validate image type
    if (!['cover', 'header', 'additional'].includes(imageType)) {
      return NextResponse.json(
        { error: 'Image type must be "cover", "header", or "additional"' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PNG, JPEG, JPG, or WebP images only.' },
        { status: 400 }
      );
    }

    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Please upload images smaller than 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop() || 'jpg';
    const timestamp = Date.now();
    const fileName = resourceId 
      ? `${resourceId}-${imageType}-${timestamp}.${fileExt}`
      : `${imageType}-${timestamp}.${fileExt}`;
    const filePath = `${resourceType}/${imageType}/${fileName}`;

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseServiceRole.storage
      .from('resources')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
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
      .from('resources')
      .getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName: fileName,
      filePath: filePath
    });

  } catch (error: any) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authError = await requirePlatformAdmin(request);
    if (authError) return authError;

    const { imageUrl } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    // Extract file path from URL
    const urlParts = imageUrl.split('/storage/v1/object/public/resources/');
    if (urlParts.length < 2) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    const filePath = urlParts[1];

    // Delete from storage
    const { error: deleteError } = await supabaseServiceRole.storage
      .from('resources')
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
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
} 