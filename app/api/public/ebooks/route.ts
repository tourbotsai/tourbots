import { NextRequest, NextResponse } from 'next/server';
import { getEbooks, getEbookTags } from '@/lib/services/ebook-service';
import { ResourceFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters: ResourceFilters = {
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Special endpoint for tags
    if (searchParams.get('tags_only') === 'true') {
      const tags = await getEbookTags();
      return NextResponse.json({ tags });
    }

    const ebooks = await getEbooks(filters);
    
    return NextResponse.json({
      success: true,
      ebooks,
      count: ebooks.length,
    });
  } catch (error: any) {
    console.error('Error fetching ebooks:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch ebooks' },
      { status: 500 }
    );
  }
}