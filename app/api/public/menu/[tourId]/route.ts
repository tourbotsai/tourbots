import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

// GET - Fetch menu for public embed (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;

    // Single round trip: enabled menu settings with their blocks embedded via the
    // menu_id foreign key. maybeSingle() returns null (no error) when there are no rows.
    const { data, error } = await supabase
      .from('tour_menu_settings')
      .select('*, tour_menu_blocks(*)')
      .eq('tour_id', tourId)
      .eq('enabled', true) // Only return enabled menus
      .maybeSingle();

    if (error) {
      throw error;
    }

    // If menu not found or disabled, return null
    if (!data) {
      return NextResponse.json({
        settings: null,
        blocks: []
      });
    }

    const { tour_menu_blocks, ...settings } = data as any;
    const blocks = (tour_menu_blocks || []).sort(
      (a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0)
    );

    return NextResponse.json({
      settings,
      blocks
    });

  } catch (error: any) {
    console.error('Error fetching public tour menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

