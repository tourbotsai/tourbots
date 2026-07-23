/**
 * Tour menu domain helpers: effective settings, action normalisation, defaults.
 */

export type MenuStyle = 'modal' | 'drawer';
export type MenuAnchorSide = 'left' | 'right';
export type MenuDevice = 'desktop' | 'mobile';
export type MenuShadowIntensity = 'none' | 'light' | 'medium' | 'heavy';
export type MenuCloseButtonSize = 'small' | 'medium' | 'large';
export type MenuCloseButtonPosition = 'top-right' | 'top-left';
export type MenuCloseButtonStyle = 'ghost' | 'filled';

export type MenuItemActionType =
  | 'tour_point'
  | 'tour_model'
  | 'external_url'
  | 'url' // legacy
  | 'open_chat'
  | 'close_menu'
  | 'none';

export type MenuItemAction =
  | { type: 'tour_point'; tourId?: string; pointId: string; modelId?: string; modelName?: string }
  | { type: 'tour_model'; tourId: string; modelId?: string; modelName?: string }
  | { type: 'external_url'; url: string; openIn: 'same_tab' | 'new_tab' }
  | { type: 'open_chat'; prompt?: string; autoSend?: boolean }
  | { type: 'close_menu' }
  | { type: 'none' };

export type MenuTriggerSource =
  | 'auto_open'
  | 'reopen_widget'
  | 'icon_button'
  | 'close_control'
  | 'backdrop'
  | 'item_action';

export interface EffectiveTourMenuChrome {
  menuStyle: MenuStyle;
  anchorSide: MenuAnchorSide;
  startOpen: boolean;
  position: 'center' | 'top' | 'bottom';
  maxWidth: number;
  drawerWidth: number;
  padding: number;
  paddingVertical: number;
  borderRadius: number;
  backgroundColor: string;
  backdropBlur: boolean;
  entranceAnimation: 'fade-scale' | 'slide-up' | 'slide-down' | 'none';
  showCloseButton: boolean;
  closeButtonSize: MenuCloseButtonSize;
  closeButtonPosition: MenuCloseButtonPosition;
  closeButtonColor: string;
  closeButtonStyle: MenuCloseButtonStyle;
  menuFontFamily: string;
  panelShadow: MenuShadowIntensity;
  showReopenWidget: boolean;
  widgetPosition: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  widgetIcon: 'HelpCircle' | 'Info' | 'Menu';
  widgetSize: 'small' | 'medium' | 'large';
  widgetColor: string;
  widgetHoverColor: string;
  widgetIconColor: string;
  widgetXOffset: number;
  widgetYOffset: number;
  widgetTooltipText: string;
  widgetBorderRadius: number;
  widgetShadowIntensity: MenuShadowIntensity;
  avoidChatLauncher: boolean;
}

export { MENU_FONT_OPTIONS, resolveMenuFont, ensureMenuGoogleFontLoaded } from './fonts';
export type { MenuFontFamilyId, MenuFontOption } from './fonts';
export { NAV_ICON_OPTIONS, NAV_ICON_MAP, isNavIconName } from './nav-icons';
export type { NavIconName } from './nav-icons';
export { createDefaultNavListContent, MENU_STARTER_TEMPLATES } from './starters';
export type { MenuStarterId, MenuStarterTemplate } from './starters';

/**
 * Single source of truth for the reopen-widget's own defaults (icon, colours, offsets,
 * radius, tooltip). Three places used to each hardcode their own fallback set — the
 * client-side "new menu" defaults, the settings POST route's upsert fallbacks, and the
 * render-time resolver in `getEffectiveMenuChrome` below — and they disagreed with each
 * other (e.g. top-left/Menu/slate here vs bottom-left/HelpCircle/red elsewhere). That's
 * harmless today because the builder always sends a fully-populated settings object, but
 * it's a landmine for anything that writes a partial row (a bulk-admin tool, a migration,
 * a bug that drops a field) — the venue would silently get a mismatched, unbranded button.
 * Import this constant everywhere a fallback is needed instead of re-typing literals.
 */
export const WIDGET_DEFAULTS = {
  position: 'top-left' as const,
  icon: 'Menu' as const,
  size: 'small' as const,
  color: '#FFFFFF',
  hoverColor: '#F0F0F0',
  iconColor: '#0F172A',
  xOffset: 16,
  yOffset: 16,
  tooltipText: 'Open menu',
  borderRadius: 12,
  shadowIntensity: 'medium' as MenuShadowIntensity,
};

export const CLOSE_BUTTON_DEFAULTS = {
  size: 'medium' as MenuCloseButtonSize,
  position: 'top-right' as MenuCloseButtonPosition,
  color: '#64748B',
  style: 'ghost' as MenuCloseButtonStyle,
};

export const PANEL_SHADOW_MAP: Record<MenuShadowIntensity, string> = {
  none: 'none',
  light: '0 4px 16px rgba(15, 23, 42, 0.08)',
  medium: '0 12px 40px rgba(15, 23, 42, 0.14)',
  heavy: '0 24px 64px rgba(15, 23, 42, 0.22)',
};

export const CLOSE_BUTTON_SIZE_MAP: Record<
  MenuCloseButtonSize,
  { hit: number; icon: number }
> = {
  small: { hit: 28, icon: 14 },
  medium: { hit: 36, icon: 18 },
  large: { hit: 44, icon: 22 },
};

export const DEFAULT_NEW_MENU_SETTINGS = {
  enabled: false,
  show_close_button: true,
  close_button_size: CLOSE_BUTTON_DEFAULTS.size,
  close_button_position: CLOSE_BUTTON_DEFAULTS.position,
  close_button_color: CLOSE_BUTTON_DEFAULTS.color,
  close_button_style: CLOSE_BUTTON_DEFAULTS.style,
  menu_style: 'drawer' as MenuStyle,
  anchor_side: 'left' as MenuAnchorSide,
  // Closed by default: visitors open it via the trigger button (the old "icon" style,
  // now just a drawer that starts closed).
  start_open: false,
  position: 'center' as const,
  max_width: 600,
  drawer_width: 360,
  padding: 24,
  padding_vertical: 20,
  border_radius: 16,
  mobile_max_width: 600,
  mobile_drawer_width: 320,
  mobile_padding: 20,
  mobile_padding_vertical: 16,
  menu_background_color: '#FFFFFF',
  menu_font_family: 'system',
  panel_shadow: 'medium' as MenuShadowIntensity,
  backdrop_blur: true,
  entrance_animation: 'fade-scale' as const,
  show_reopen_widget: true,
  widget_position: WIDGET_DEFAULTS.position,
  widget_icon: WIDGET_DEFAULTS.icon,
  widget_size: WIDGET_DEFAULTS.size,
  widget_color: WIDGET_DEFAULTS.color,
  widget_hover_color: WIDGET_DEFAULTS.hoverColor,
  widget_icon_color: WIDGET_DEFAULTS.iconColor,
  widget_x_offset: WIDGET_DEFAULTS.xOffset,
  widget_y_offset: WIDGET_DEFAULTS.yOffset,
  widget_tooltip_text: WIDGET_DEFAULTS.tooltipText,
  widget_border_radius: WIDGET_DEFAULTS.borderRadius,
  widget_shadow_intensity: WIDGET_DEFAULTS.shadowIntensity,
  mobile_widget_position: WIDGET_DEFAULTS.position,
  mobile_widget_size: WIDGET_DEFAULTS.size,
  avoid_chat_launcher: true,
};

function pickNumber(primary: unknown, fallback: number): number {
  const n = Number(primary);
  return Number.isFinite(n) ? n : fallback;
}

/** Resolve desktop/mobile chrome for render. */
export function getEffectiveMenuChrome(
  settings: Record<string, any> | null | undefined,
  device: MenuDevice
): EffectiveTourMenuChrome {
  const s = settings || {};
  const isMobile = device === 'mobile';

  return {
    // Align render-time fallbacks with DEFAULT_NEW_MENU_SETTINGS (drawer + closed).
    menuStyle: (s.menu_style as MenuStyle) || 'drawer',
    anchorSide: (s.anchor_side as MenuAnchorSide) || 'left',
    startOpen: s.start_open === true,
    position: (s.position as 'center' | 'top' | 'bottom') || 'center',
    maxWidth: isMobile
      ? pickNumber(s.mobile_max_width ?? s.max_width, 600)
      : pickNumber(s.max_width, 600),
    drawerWidth: isMobile
      ? pickNumber(s.mobile_drawer_width ?? s.drawer_width, 360)
      : pickNumber(s.drawer_width, 360),
    padding: isMobile
      ? pickNumber(s.mobile_padding ?? s.padding, 24)
      : pickNumber(s.padding, 24),
    paddingVertical: isMobile
      ? pickNumber(s.mobile_padding_vertical ?? s.padding_vertical, DEFAULT_NEW_MENU_SETTINGS.padding_vertical)
      : pickNumber(s.padding_vertical, DEFAULT_NEW_MENU_SETTINGS.padding_vertical),
    borderRadius: pickNumber(s.border_radius, 16),
    backgroundColor: s.menu_background_color || '#FFFFFF',
    backdropBlur: s.backdrop_blur !== false,
    entranceAnimation: s.entrance_animation || 'fade-scale',
    showCloseButton: s.show_close_button !== false,
    closeButtonSize: s.close_button_size || CLOSE_BUTTON_DEFAULTS.size,
    closeButtonPosition: s.close_button_position || CLOSE_BUTTON_DEFAULTS.position,
    closeButtonColor: s.close_button_color || CLOSE_BUTTON_DEFAULTS.color,
    closeButtonStyle: s.close_button_style || CLOSE_BUTTON_DEFAULTS.style,
    menuFontFamily: s.menu_font_family || 'system',
    panelShadow: s.panel_shadow || 'medium',
    showReopenWidget: s.show_reopen_widget !== false,
    widgetPosition: (isMobile
      ? s.mobile_widget_position || s.widget_position
      : s.widget_position) || WIDGET_DEFAULTS.position,
    widgetIcon: s.widget_icon || WIDGET_DEFAULTS.icon,
    widgetSize: (isMobile
      ? s.mobile_widget_size || s.widget_size
      : s.widget_size) || WIDGET_DEFAULTS.size,
    widgetColor: s.widget_color || WIDGET_DEFAULTS.color,
    widgetHoverColor: s.widget_hover_color || WIDGET_DEFAULTS.hoverColor,
    widgetIconColor: s.widget_icon_color || WIDGET_DEFAULTS.iconColor,
    widgetXOffset: pickNumber(s.widget_x_offset, WIDGET_DEFAULTS.xOffset),
    widgetYOffset: pickNumber(s.widget_y_offset, WIDGET_DEFAULTS.yOffset),
    widgetTooltipText: s.widget_tooltip_text || WIDGET_DEFAULTS.tooltipText,
    widgetBorderRadius: pickNumber(s.widget_border_radius, WIDGET_DEFAULTS.borderRadius),
    widgetShadowIntensity: s.widget_shadow_intensity || WIDGET_DEFAULTS.shadowIntensity,
    // Always avoid the AI chat launcher's corner — not worth exposing as a setting,
    // visitors never want the two overlapping.
    avoidChatLauncher: true,
  };
}

/** Ensure a nav list item exposes a non-empty entries[] (migrates legacy fields). */
export function normaliseNavListEntries(item: Record<string, any>): Array<Record<string, any>> {
  if (Array.isArray(item.entries) && item.entries.length > 0) {
    return item.entries.map((entry: Record<string, any>, index: number) => ({
      id: entry.id || `${item.id || 'nav'}-e${index}`,
      description: entry.description || '',
      action_type: entry.action_type || 'none',
      target_id: entry.target_id || '',
      target_tour_id: entry.target_tour_id,
      target_model_id: entry.target_model_id,
      target_model_name: entry.target_model_name,
      open_in: entry.open_in,
      chat_prompt: entry.chat_prompt,
      chat_auto_send: entry.chat_auto_send,
      action: entry.action,
    }));
  }

  return [
    {
      id: `${item.id || 'nav'}-e0`,
      description: item.description || '',
      action_type: item.action_type || 'none',
      target_id: item.target_id || '',
      target_tour_id: item.target_tour_id,
      target_model_id: item.target_model_id,
      target_model_name: item.target_model_name,
      open_in: item.open_in,
      chat_prompt: item.chat_prompt,
      chat_auto_send: item.chat_auto_send,
      action: item.action,
    },
  ];
}

/** Write entries and mirror the first entry onto legacy top-level fields. */
export function withNavListEntries(
  item: Record<string, any>,
  entries: Array<Record<string, any>>
): Record<string, any> {
  const nextEntries =
    entries.length > 0
      ? entries
      : [
          {
            id: `${item.id || 'nav'}-e0`,
            description: '',
            action_type: 'none',
            target_id: '',
          },
        ];
  const first = nextEntries[0];
  return {
    ...item,
    entries: nextEntries,
    description: first.description || '',
    action_type: first.action_type || 'none',
    target_id: first.target_id || '',
    target_tour_id: first.target_tour_id,
    target_model_id: first.target_model_id,
    target_model_name: first.target_model_name,
    open_in: first.open_in,
    chat_prompt: first.chat_prompt,
    chat_auto_send: first.chat_auto_send,
  };
}

/**
 * Normalise legacy button fields and new action shapes into MenuItemAction.
 */
export function normaliseMenuItemAction(item: Record<string, any>): MenuItemAction {
  // New shape: item.action
  if (item.action && typeof item.action === 'object' && item.action.type) {
    const a = item.action;
    switch (a.type) {
      case 'tour_point':
        return {
          type: 'tour_point',
          pointId: String(a.pointId || a.target_id || item.target_id || ''),
          tourId: a.tourId || item.target_tour_id,
          modelId: a.modelId || item.target_model_id,
          modelName: a.modelName || item.target_model_name,
        };
      case 'tour_model':
        return {
          type: 'tour_model',
          tourId: String(a.tourId || item.target_id || ''),
          modelId: a.modelId || item.target_model_id,
          modelName: a.modelName || item.target_model_name,
        };
      case 'external_url':
      case 'url':
        return {
          type: 'external_url',
          url: String(a.url || a.target_id || item.target_id || ''),
          openIn: a.openIn === 'same_tab' ? 'same_tab' : 'new_tab',
        };
      case 'open_chat':
        return {
          type: 'open_chat',
          prompt: typeof a.prompt === 'string' ? a.prompt : undefined,
          autoSend: Boolean(a.autoSend),
        };
      case 'close_menu':
        return { type: 'close_menu' };
      case 'none':
        return { type: 'none' };
      default:
        break;
    }
  }

  // Legacy MenuButton shape
  const actionType = item.action_type as string | undefined;
  switch (actionType) {
    case 'tour_point':
      return {
        type: 'tour_point',
        pointId: String(item.target_id || ''),
        tourId: item.target_tour_id,
        modelId: item.target_model_id,
        modelName: item.target_model_name,
      };
    case 'tour_model':
      return {
        type: 'tour_model',
        tourId: String(item.target_id || ''),
        modelId: item.target_model_id,
        modelName: item.target_model_name,
      };
    case 'url':
      return {
        type: 'external_url',
        url: String(item.target_id || ''),
        openIn: item.open_in === 'same_tab' ? 'same_tab' : 'new_tab',
      };
    case 'open_chat':
      return {
        type: 'open_chat',
        prompt: typeof item.chat_prompt === 'string' ? item.chat_prompt : undefined,
        autoSend: Boolean(item.chat_auto_send),
      };
    case 'close_menu':
      return { type: 'close_menu' };
    case 'none':
      return { type: 'none' };
    default:
      return { type: 'none' };
  }
}

export function actionToLegacyButtonFields(action: MenuItemAction): {
  action_type: string;
  target_id: string;
  target_tour_id?: string;
  target_model_id?: string;
  target_model_name?: string;
  chat_prompt?: string;
  chat_auto_send?: boolean;
  open_in?: 'same_tab' | 'new_tab';
} {
  switch (action.type) {
    case 'tour_point':
      return {
        action_type: 'tour_point',
        target_id: action.pointId,
        target_tour_id: action.tourId,
        target_model_id: action.modelId,
        target_model_name: action.modelName,
      };
    case 'tour_model':
      return {
        action_type: 'tour_model',
        target_id: action.tourId,
        target_model_id: action.modelId,
        target_model_name: action.modelName,
      };
    case 'external_url':
      return {
        action_type: 'url',
        target_id: action.url,
        open_in: action.openIn,
      };
    case 'open_chat':
      return {
        action_type: 'open_chat',
        target_id: '',
        chat_prompt: action.prompt,
        chat_auto_send: action.autoSend,
      };
    case 'close_menu':
      return { action_type: 'close_menu', target_id: '' };
    default:
      return { action_type: 'none', target_id: '' };
  }
}

/** Resolve text block typography for the active device. */
export function getEffectiveTextStyles(
  content: Record<string, any> | null | undefined,
  device: MenuDevice
): { fontSize: number; color: string; lineHeight: number; fontWeight: string } {
  const c = content || {};
  const isMobile = device === 'mobile';
  return {
    fontSize: pickNumber(
      isMobile ? (c.mobile_font_size ?? c.font_size) : c.font_size,
      16
    ),
    color: (isMobile ? (c.mobile_color ?? c.color) : c.color) || '#000000',
    lineHeight: pickNumber(
      isMobile ? (c.mobile_line_height ?? c.line_height) : c.line_height,
      1.5
    ),
    fontWeight: String(c.font_weight || 'normal'),
  };
}

const NAV_FONT_WEIGHT_CSS: Record<string, number> = {
  light: 300,
  normal: 400,
  semibold: 600,
  bold: 700,
};

export interface EffectiveNavStyles {
  itemPaddingY: number;
  labelFontSize: number;
  descriptionFontSize: number;
  fontFamilyId: string | null;
  fontWeight: string;
  fontWeightCss: number;
  lineHeight: number;
  letterSpacing: number;
  headerColor: string;
  labelColor: string;
  descriptionColor: string;
  iconColor: string;
}

/** Resolve nav list density for the active device. */
export function getEffectiveNavDensity(
  content: Record<string, any> | null | undefined,
  device: MenuDevice
): { itemPaddingY: number; labelFontSize: number; descriptionFontSize: number } {
  const c = content || {};
  const isMobile = device === 'mobile';
  const density = isMobile
    ? (c.mobile_density || c.density || 'comfortable')
    : (c.density || 'comfortable');

  const paddingMap: Record<string, number> = { compact: 8, comfortable: 12, spacious: 16 };
  const labelMap: Record<string, number> = { compact: 13, comfortable: 14, spacious: 15 };
  const descMap: Record<string, number> = { compact: 11, comfortable: 12, spacious: 13 };

  const densityLabel = labelMap[density] ?? 14;
  const explicitFontSize = pickNumber(c.font_size, NaN);

  return {
    itemPaddingY: pickNumber(
      isMobile ? (c.mobile_item_padding_y ?? paddingMap[density]) : (c.item_padding_y ?? paddingMap[density]),
      paddingMap[density] ?? 12
    ),
    labelFontSize: pickNumber(
      isMobile
        ? (c.mobile_label_font_size ?? c.label_font_size ?? c.font_size ?? densityLabel)
        : (c.label_font_size ?? c.font_size ?? densityLabel),
      Number.isFinite(explicitFontSize) ? explicitFontSize : densityLabel
    ),
    descriptionFontSize: pickNumber(
      isMobile ? (c.mobile_description_font_size ?? c.description_font_size) : c.description_font_size,
      Math.max(11, (Number.isFinite(explicitFontSize) ? explicitFontSize : densityLabel) - 2)
    ),
  };
}

/** Resolve nav list typography + global colours (plus density). */
export function getEffectiveNavStyles(
  content: Record<string, any> | null | undefined,
  device: MenuDevice
): EffectiveNavStyles {
  const c = content || {};
  const density = getEffectiveNavDensity(c, device);
  const fontWeight = String(c.font_weight || 'normal');
  const fontFamilyRaw = c.font_family;
  const fontFamilyId =
    fontFamilyRaw && fontFamilyRaw !== 'inherit' ? String(fontFamilyRaw) : null;

  return {
    ...density,
    fontFamilyId,
    fontWeight,
    fontWeightCss: NAV_FONT_WEIGHT_CSS[fontWeight] ?? 400,
    lineHeight: pickNumber(c.line_height, 1.35),
    letterSpacing: pickNumber(c.letter_spacing, 0),
    headerColor: c.header_color || '#64748B',
    labelColor: c.label_color || '#1E293B',
    descriptionColor: c.description_color || '#64748B',
    iconColor: c.icon_color || '#64748B',
  };
}

/** Resolve per-item colours with fallback to block globals. */
export function resolveNavItemColours(
  item: { kind?: string; label_color?: string; description_color?: string; icon_color?: string },
  styles: Pick<EffectiveNavStyles, 'headerColor' | 'labelColor' | 'descriptionColor' | 'iconColor'>
): { labelColor: string; descriptionColor: string; iconColor: string } {
  const isHeader = item.kind === 'header';
  return {
    labelColor:
      item.label_color || (isHeader ? styles.headerColor : styles.labelColor),
    descriptionColor: item.description_color || styles.descriptionColor,
    iconColor: item.icon_color || styles.iconColor,
  };
}

/** Resolve per-item vertical padding (px), falling back to block density / item_padding_y. */
export function resolveNavItemPaddingY(
  item: { item_padding_y?: number | null },
  styles: Pick<EffectiveNavStyles, 'itemPaddingY'>
): number {
  const override = Number(item.item_padding_y);
  if (Number.isFinite(override) && override >= 0) return Math.round(override);
  return styles.itemPaddingY;
}
