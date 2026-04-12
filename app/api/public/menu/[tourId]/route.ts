import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

// GET - Fetch menu for public embed (no auth required)
export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;

    // Fetch menu settings - only if enabled
    const { data: settings, error: settingsError } = await supabase
      .from('tour_menu_settings')
      .select('*')
      .eq('tour_id', tourId)
      .eq('enabled', true) // Only return enabled menus
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows
      throw settingsError;
    }

    // If menu not found or disabled, return null
    if (!settings) {
      return NextResponse.json({
        settings: null,
        blocks: []
      });
    }

    // Fetch blocks
    const { data: blocks, error: blocksError } = await supabase
      .from('tour_menu_blocks')
      .select('*')
      .eq('menu_id', settings.id)
      .order('display_order', { ascending: true });

    if (blocksError) throw blocksError;

    return NextResponse.json({
      settings,
      blocks: blocks || []
    });

  } catch (error: any) {
    console.error('Error fetching public tour menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

