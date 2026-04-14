import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { authenticateAndGetVenue } from '@/lib/authenticated-venue';
import { requireAgencyPortalSession } from '@/lib/agency-portal-auth';

interface MenuRouteAccessContext {
  venueId: string;
}

async function resolveMenuRouteAccess(
  request: NextRequest,
  tourId: string,
  options?: { requireCsrf?: boolean }
): Promise<MenuRouteAccessContext | NextResponse> {
  const authHeader = request.headers.get('authorization');
  const hasBearer = Boolean(authHeader && authHeader.startsWith('Bearer '));

  if (hasBearer) {
    const authResult = await authenticateAndGetVenue(request);
    if (authResult instanceof NextResponse) return authResult;

    const { data: scopedTour, error: scopedTourError } = await supabase
      .from('tours')
      .select('id')
      .eq('id', tourId)
      .eq('venue_id', authResult.venueId)
      .maybeSingle();

    if (scopedTourError) {
      return NextResponse.json({ error: scopedTourError.message }, { status: 500 });
    }
    if (!scopedTour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    return { venueId: authResult.venueId };
  }

  const portalSession = await requireAgencyPortalSession(request, {
    requiredModule: 'tour',
    requireCsrf: options?.requireCsrf,
  });
  if (portalSession instanceof NextResponse) return portalSession;

  if (portalSession.tourId !== tourId) {
    return NextResponse.json({ error: 'Tour not available for this share' }, { status: 403 });
  }

  return { venueId: portalSession.venueId };
}

// GET - Fetch menu settings and blocks for a tour
export async function GET(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const access = await resolveMenuRouteAccess(request, tourId);
    if (access instanceof NextResponse) return access;

    // Fetch menu settings
    const { data: settings, error: settingsError } = await supabase
      .from('tour_menu_settings')
      .select('*')
      .eq('tour_id', tourId)
      .eq('venue_id', access.venueId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') { // PGRST116 = no rows
      throw settingsError;
    }

    // Fetch blocks if menu exists
    let blocks = [];
    if (settings) {
      const { data: blocksData, error: blocksError } = await supabase
        .from('tour_menu_blocks')
        .select('*')
        .eq('menu_id', settings.id)
        .order('display_order', { ascending: true });

      if (blocksError) throw blocksError;
      blocks = blocksData || [];
    }

    return NextResponse.json({
      settings: settings || null,
      blocks
    });

  } catch (error: any) {
    console.error('Error fetching tour menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create or update menu settings and blocks
export async function POST(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const access = await resolveMenuRouteAccess(request, tourId, { requireCsrf: true });
    if (access instanceof NextResponse) return access;

    const body = await request.json();
    const { settings, blocks } = body;

    // Validate input
    if (!settings) {
      return NextResponse.json({ error: 'Settings required' }, { status: 400 });
    }

    // Validate position enum
    if (settings.position && !['center', 'top', 'bottom'].includes(settings.position)) {
      return NextResponse.json({ error: 'Invalid position value' }, { status: 400 });
    }

    // Validate animation enum
    if (settings.entrance_animation && !['fade-scale', 'slide-up', 'slide-down', 'none'].includes(settings.entrance_animation)) {
      return NextResponse.json({ error: 'Invalid animation value' }, { status: 400 });
    }

    // Validate widget fields
    if (settings.widget_position && !['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(settings.widget_position)) {
      return NextResponse.json({ error: 'Invalid widget_position' }, { status: 400 });
    }

    if (settings.widget_icon && !['HelpCircle', 'Info', 'Menu'].includes(settings.widget_icon)) {
      return NextResponse.json({ error: 'Invalid widget_icon' }, { status: 400 });
    }

    if (settings.widget_size && !['small', 'medium', 'large'].includes(settings.widget_size)) {
      return NextResponse.json({ error: 'Invalid widget_size' }, { status: 400 });
    }

    if (settings.widget_shadow_intensity && !['none', 'light', 'medium', 'heavy'].includes(settings.widget_shadow_intensity)) {
      return NextResponse.json({ error: 'Invalid widget_shadow_intensity' }, { status: 400 });
    }

    // Validate hex colors
    const hexPattern = /^#[0-9A-F]{6}$/i;
    if (settings.widget_color && !hexPattern.test(settings.widget_color)) {
      return NextResponse.json({ error: 'Invalid widget_color' }, { status: 400 });
    }

    if (settings.widget_hover_color && !hexPattern.test(settings.widget_hover_color)) {
      return NextResponse.json({ error: 'Invalid widget_hover_color' }, { status: 400 });
    }

    if (settings.widget_icon_color && !hexPattern.test(settings.widget_icon_color)) {
      return NextResponse.json({ error: 'Invalid widget_icon_color' }, { status: 400 });
    }

    // Validate widget offsets
    if (settings.widget_x_offset !== undefined && (settings.widget_x_offset < 0 || settings.widget_x_offset > 200)) {
      return NextResponse.json({ error: 'widget_x_offset must be 0-200' }, { status: 400 });
    }

    if (settings.widget_y_offset !== undefined && (settings.widget_y_offset < 0 || settings.widget_y_offset > 200)) {
      return NextResponse.json({ error: 'widget_y_offset must be 0-200' }, { status: 400 });
    }

    if (settings.widget_border_radius !== undefined && (settings.widget_border_radius < 0 || settings.widget_border_radius > 100)) {
      return NextResponse.json({ error: 'widget_border_radius must be 0-100' }, { status: 400 });
    }

    // Validate numeric ranges
    if (settings.max_width && (settings.max_width < 300 || settings.max_width > 1000)) {
      return NextResponse.json({ error: 'Max width must be between 300-1000px' }, { status: 400 });
    }

    if (settings.padding && (settings.padding < 12 || settings.padding > 48)) {
      return NextResponse.json({ error: 'Padding must be between 12-48px' }, { status: 400 });
    }

    // Validate blocks if provided
    if (blocks && Array.isArray(blocks)) {
      for (const block of blocks) {
        if (!block.block_type || !['text', 'buttons', 'logo', 'table', 'spacer'].includes(block.block_type)) {
          return NextResponse.json({ error: 'Invalid block type' }, { status: 400 });
        }
        
        if (!block.alignment || !['left', 'center', 'right'].includes(block.alignment)) {
          return NextResponse.json({ error: 'Invalid block alignment' }, { status: 400 });
        }
        
        if (!block.content) {
          return NextResponse.json({ error: 'Block content required' }, { status: 400 });
        }
      }
    }

    // Get venue_id from scoped tour
    const { data: tour, error: tourError } = await supabase
      .from('tours')
      .select('venue_id')
      .eq('id', tourId)
      .eq('venue_id', access.venueId)
      .single();

    if (tourError) {
      return NextResponse.json({ error: tourError.message }, { status: 500 });
    }

    if (!tour) {
      return NextResponse.json({ error: 'Tour not found' }, { status: 404 });
    }

    const venueId = tour.venue_id;

    // Upsert menu settings
    const { data: menuSettings, error: settingsError } = await supabase
      .from('tour_menu_settings')
      .upsert({
        venue_id: venueId,
        tour_id: tourId,
        enabled: settings.enabled,
        position: settings.position,
        max_width: settings.max_width,
        padding: settings.padding,
        border_radius: settings.border_radius,
        menu_background_color: settings.menu_background_color,
        backdrop_blur: settings.backdrop_blur,
        entrance_animation: settings.entrance_animation,
        // Widget fields
        show_reopen_widget: settings.show_reopen_widget !== undefined ? settings.show_reopen_widget : true,
        widget_position: settings.widget_position || 'bottom-left',
        widget_icon: settings.widget_icon || 'HelpCircle',
        widget_size: settings.widget_size || 'small',
        widget_color: settings.widget_color || '#FFFFFF',
        widget_hover_color: settings.widget_hover_color || '#F0F0F0',
        widget_icon_color: settings.widget_icon_color || '#FF0000',
        widget_x_offset: settings.widget_x_offset !== undefined ? settings.widget_x_offset : 24,
        widget_y_offset: settings.widget_y_offset !== undefined ? settings.widget_y_offset : 24,
        widget_tooltip_text: settings.widget_tooltip_text || 'Reopen Tour Menu',
        widget_border_radius: settings.widget_border_radius !== undefined ? settings.widget_border_radius : 50,
        widget_shadow_intensity: settings.widget_shadow_intensity || 'medium',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tour_id'
      })
      .select()
      .single();

    if (settingsError) throw settingsError;

    // Delete existing blocks and insert new ones
    const { error: deleteError } = await supabase
      .from('tour_menu_blocks')
      .delete()
      .eq('menu_id', menuSettings.id);

    if (deleteError) throw deleteError;

    // Insert new blocks
    if (blocks && blocks.length > 0) {
      const blocksToInsert = blocks.map((block: any, index: number) => ({
        menu_id: menuSettings.id,
        block_type: block.block_type,
        display_order: index,
        alignment: block.alignment,
        margin_top: block.margin_top,
        margin_bottom: block.margin_bottom,
        content: block.content,
        styling: block.styling || {}
      }));

      const { error: blocksError } = await supabase
        .from('tour_menu_blocks')
        .insert(blocksToInsert);

      if (blocksError) throw blocksError;
    }

    return NextResponse.json({ 
      success: true,
      menu_id: menuSettings.id 
    });

  } catch (error: any) {
    console.error('Error saving tour menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update specific settings (partial update)
export async function PUT(
  request: NextRequest,
  { params }: { params: { tourId: string } }
) {
  try {
    const { tourId } = await params;
    const access = await resolveMenuRouteAccess(request, tourId, { requireCsrf: true });
    if (access instanceof NextResponse) return access;
    const body = await request.json();

    // Update settings - only allow specific fields
    const allowedFields = [
      'enabled', 'position', 'max_width', 'padding', 'border_radius',
      'menu_background_color', 'backdrop_blur', 'entrance_animation',
      // Widget fields
      'show_reopen_widget', 'widget_position', 'widget_icon', 'widget_size',
      'widget_color', 'widget_hover_color', 'widget_icon_color',
      'widget_x_offset', 'widget_y_offset', 'widget_tooltip_text',
      'widget_border_radius', 'widget_shadow_intensity'
    ];
    
    const updates: any = { updated_at: new Date().toISOString() };
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    const { error } = await supabase
      .from('tour_menu_settings')
      .update(updates)
      .eq('tour_id', tourId)
      .eq('venue_id', access.venueId);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Error updating tour menu:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

