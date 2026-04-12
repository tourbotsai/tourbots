import { NextRequest, NextResponse } from 'next/server';
import { getEbookBySlug } from '@/lib/services/ebook-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const ebook = await getEbookBySlug(params.slug);
    
    if (!ebook) {
      return NextResponse.json(
        { success: false, error: 'Ebook not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      ebook,
    });
  } catch (error: any) {
    console.error('Error fetching ebook:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ebook' },
      { status: 500 }
    );
  }
} 