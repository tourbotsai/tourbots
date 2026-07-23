import { NextRequest, NextResponse } from 'next/server';
import { supabaseServiceRole as supabase } from '@/lib/supabase-service-role';
import { resolveMenuRouteAccess } from '@/lib/tour-menu/route-access';
import {
  CLOSE_BUTTON_DEFAULTS,
  DEFAULT_NEW_MENU_SETTINGS,
  MENU_FONT_OPTIONS,
  WIDGET_DEFAULTS,
} from '@/lib/tour-menu';

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

    // Validate chrome enums
    if (settings.menu_style && !['modal', 'drawer'].includes(settings.menu_style)) {
      return NextResponse.json({ error: 'Invalid menu_style' }, { status: 400 });
    }

    if (settings.anchor_side && !['left', 'right'].includes(settings.anchor_side)) {
      return NextResponse.json({ error: 'Invalid anchor_side' }, { status: 400 });
    }

    if (
      settings.mobile_widget_position &&
      !['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(settings.mobile_widget_position)
    ) {
      return NextResponse.json({ error: 'Invalid mobile_widget_position' }, { status: 400 });
    }

    if (settings.mobile_widget_size && !['small', 'medium', 'large'].includes(settings.mobile_widget_size)) {
      return NextResponse.json({ error: 'Invalid mobile_widget_size' }, { status: 400 });
    }

    if (settings.drawer_width !== undefined && (settings.drawer_width < 240 || settings.drawer_width > 560)) {
      return NextResponse.json({ error: 'Drawer width must be between 240-560px' }, { status: 400 });
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

    if (settings.close_button_size && !['small', 'medium', 'large'].includes(settings.close_button_size)) {
      return NextResponse.json({ error: 'Invalid close_button_size' }, { status: 400 });
    }

    if (settings.close_button_position && !['top-right', 'top-left'].includes(settings.close_button_position)) {
      return NextResponse.json({ error: 'Invalid close_button_position' }, { status: 400 });
    }

    if (settings.close_button_style && !['ghost', 'filled'].includes(settings.close_button_style)) {
      return NextResponse.json({ error: 'Invalid close_button_style' }, { status: 400 });
    }

    if (settings.panel_shadow && !['none', 'light', 'medium', 'heavy'].includes(settings.panel_shadow)) {
      return NextResponse.json({ error: 'Invalid panel_shadow' }, { status: 400 });
    }

    const allowedFonts = new Set(MENU_FONT_OPTIONS.map((font) => font.id as string));
    if (settings.menu_font_family && !allowedFonts.has(settings.menu_font_family)) {
      return NextResponse.json({ error: 'Invalid menu_font_family' }, { status: 400 });
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

    if (settings.close_button_color && !hexPattern.test(settings.close_button_color)) {
      return NextResponse.json({ error: 'Invalid close_button_color' }, { status: 400 });
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

    if (settings.padding_vertical !== undefined && (settings.padding_vertical < 0 || settings.padding_vertical > 48)) {
      return NextResponse.json({ error: 'Vertical padding must be between 0-48px' }, { status: 400 });
    }

    // Validate blocks if provided
    if (blocks && Array.isArray(blocks)) {
      for (const block of blocks) {
        if (!block.block_type || !['text', 'buttons', 'logo', 'table', 'spacer', 'nav_list'].includes(block.block_type)) {
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
        show_close_button: settings.show_close_button !== undefined ? settings.show_close_button : DEFAULT_NEW_MENU_SETTINGS.show_close_button,
        close_button_size: settings.close_button_size || CLOSE_BUTTON_DEFAULTS.size,
        close_button_position: settings.close_button_position || CLOSE_BUTTON_DEFAULTS.position,
        close_button_color: settings.close_button_color || CLOSE_BUTTON_DEFAULTS.color,
        close_button_style: settings.close_button_style || CLOSE_BUTTON_DEFAULTS.style,
        // Chrome / style — fallbacks all come from DEFAULT_NEW_MENU_SETTINGS /
        // WIDGET_DEFAULTS (lib/tour-menu) so this route can never disagree with the
        // client's "new menu" defaults or the render-time resolver's fallbacks.
        menu_style: settings.menu_style || DEFAULT_NEW_MENU_SETTINGS.menu_style,
        anchor_side: settings.anchor_side || DEFAULT_NEW_MENU_SETTINGS.anchor_side,
        start_open: settings.start_open !== undefined ? settings.start_open : DEFAULT_NEW_MENU_SETTINGS.start_open,
        avoid_chat_launcher: settings.avoid_chat_launcher !== undefined ? settings.avoid_chat_launcher : true,
        position: settings.position,
        max_width: settings.max_width,
        drawer_width: settings.drawer_width !== undefined ? settings.drawer_width : DEFAULT_NEW_MENU_SETTINGS.drawer_width,
        padding: settings.padding,
        padding_vertical: settings.padding_vertical !== undefined ? settings.padding_vertical : DEFAULT_NEW_MENU_SETTINGS.padding_vertical,
        border_radius: settings.border_radius,
        // Mobile-scoped layout overrides
        mobile_max_width: settings.mobile_max_width ?? null,
        mobile_drawer_width: settings.mobile_drawer_width ?? null,
        mobile_padding: settings.mobile_padding ?? null,
        mobile_padding_vertical: settings.mobile_padding_vertical ?? null,
        menu_background_color: settings.menu_background_color,
        menu_font_family: settings.menu_font_family || DEFAULT_NEW_MENU_SETTINGS.menu_font_family,
        panel_shadow: settings.panel_shadow || DEFAULT_NEW_MENU_SETTINGS.panel_shadow,
        backdrop_blur: settings.backdrop_blur,
        entrance_animation: settings.entrance_animation,
        // Widget fields
        show_reopen_widget: settings.show_reopen_widget !== undefined ? settings.show_reopen_widget : true,
        widget_position: settings.widget_position || WIDGET_DEFAULTS.position,
        widget_icon: settings.widget_icon || WIDGET_DEFAULTS.icon,
        widget_size: settings.widget_size || WIDGET_DEFAULTS.size,
        widget_color: settings.widget_color || WIDGET_DEFAULTS.color,
        widget_hover_color: settings.widget_hover_color || WIDGET_DEFAULTS.hoverColor,
        widget_icon_color: settings.widget_icon_color || WIDGET_DEFAULTS.iconColor,
        widget_x_offset: settings.widget_x_offset !== undefined ? settings.widget_x_offset : WIDGET_DEFAULTS.xOffset,
        widget_y_offset: settings.widget_y_offset !== undefined ? settings.widget_y_offset : WIDGET_DEFAULTS.yOffset,
        widget_tooltip_text: settings.widget_tooltip_text || WIDGET_DEFAULTS.tooltipText,
        widget_border_radius: settings.widget_border_radius !== undefined ? settings.widget_border_radius : WIDGET_DEFAULTS.borderRadius,
        widget_shadow_intensity: settings.widget_shadow_intensity || WIDGET_DEFAULTS.shadowIntensity,
        // Mobile-scoped widget overrides
        mobile_widget_position: settings.mobile_widget_position ?? null,
        mobile_widget_size: settings.mobile_widget_size ?? null,
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
      'enabled', 'show_close_button', 'position', 'max_width', 'padding', 'padding_vertical', 'border_radius',
      'menu_background_color', 'menu_font_family', 'panel_shadow', 'backdrop_blur', 'entrance_animation',
      'close_button_size', 'close_button_position', 'close_button_color', 'close_button_style',
      // Chrome / style
      'menu_style', 'anchor_side', 'start_open', 'drawer_width', 'avoid_chat_launcher',
      'mobile_max_width', 'mobile_drawer_width', 'mobile_padding', 'mobile_padding_vertical',
      // Widget fields
      'show_reopen_widget', 'widget_position', 'widget_icon', 'widget_size',
      'widget_color', 'widget_hover_color', 'widget_icon_color',
      'widget_x_offset', 'widget_y_offset', 'widget_tooltip_text',
      'widget_border_radius', 'widget_shadow_intensity',
      'mobile_widget_position', 'mobile_widget_size'
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

