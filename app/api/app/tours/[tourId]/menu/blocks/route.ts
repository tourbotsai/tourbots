import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';

// POST - Create a new block
export async function POST(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const body = await request.json();
    const { menu_id, block_type, alignment, margin_top, margin_bottom, content, styling, display_order } = body;

    // Insert block
    const { data, error } = await supabase
      .from('tour_menu_blocks')
      .insert({
        menu_id,
        block_type,
        display_order,
        alignment,
        margin_top,
        margin_bottom,
        content,
        styling: styling || {}
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, block: data });

  } catch (error: any) {
    console.error('Error creating block:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update an existing block
export async function PUT(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const body = await request.json();
    const { block_id, alignment, margin_top, margin_bottom, content, styling } = body;

    // Update block
    const { error } = await supabase
      .from('tour_menu_blocks')
      .update({
        alignment,
        margin_top,
        margin_bottom,
        content,
        styling: styling || {},
        updated_at: new Date().toISOString()
      })
      .eq('id', block_id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating block:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete a block
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const { searchParams } = new URL(request.url);
    const blockId = searchParams.get('blockId');

    if (!blockId) {
      return NextResponse.json({ error: 'blockId required' }, { status: 400 });
    }


    // Delete block
    const { error } = await supabase
      .from('tour_menu_blocks')
      .delete()
      .eq('id', blockId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error deleting block:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Reorder blocks
export async function PATCH(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const body = await request.json();
    const { blocks } = body; // Array of { id, display_order }


    // Verify ownership (check first block)
    // Update display orders
    for (const block of blocks) {
      await supabase
        .from('tour_menu_blocks')
        .update({ display_order: block.display_order })
        .eq('id', block.id);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error reordering blocks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

