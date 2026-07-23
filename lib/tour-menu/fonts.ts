/**
 * Curated font families for the tour menu surface.
 * Google fonts are lazy-loaded by the renderer when a non-system option is chosen.
 */

export type MenuFontFamilyId =
  | 'system'
  | 'dm-sans'
  | 'plus-jakarta'
  | 'source-sans'
  | 'libre-franklin'
  | 'playfair'
  | 'georgia';

export interface MenuFontOption {
  id: MenuFontFamilyId;
  label: string;
  /** CSS font-family stack applied to the menu panel. */
  stack: string;
  /** Google Fonts family query fragment, or null for system/local stacks. */
  google: string | null;
  /** Short preview hint for the builder select. */
  sample?: string;
}

export const MENU_FONT_OPTIONS: MenuFontOption[] = [
  {
    id: 'system',
    label: 'System',
    stack: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    google: null,
  },
  {
    id: 'dm-sans',
    label: 'DM Sans',
    stack: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    google: 'DM+Sans:wght@400;500;600;700',
  },
  {
    id: 'plus-jakarta',
    label: 'Plus Jakarta Sans',
    stack: '"Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
    google: 'Plus+Jakarta+Sans:wght@400;500;600;700',
  },
  {
    id: 'source-sans',
    label: 'Source Sans 3',
    stack: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    google: 'Source+Sans+3:wght@400;500;600;700',
  },
  {
    id: 'libre-franklin',
    label: 'Libre Franklin',
    stack: '"Libre Franklin", ui-sans-serif, system-ui, sans-serif',
    google: 'Libre+Franklin:wght@400;500;600;700',
  },
  {
    id: 'playfair',
    label: 'Playfair Display',
    stack: '"Playfair Display", Georgia, "Times New Roman", serif',
    google: 'Playfair+Display:wght@400;500;600;700',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    stack: 'Georgia, "Times New Roman", Times, serif',
    google: null,
  },
];

const FONT_BY_ID = Object.fromEntries(MENU_FONT_OPTIONS.map((f) => [f.id, f])) as Record<
  MenuFontFamilyId,
  MenuFontOption
>;

export function resolveMenuFont(id: string | null | undefined): MenuFontOption {
  if (id && id in FONT_BY_ID) return FONT_BY_ID[id as MenuFontFamilyId];
  return FONT_BY_ID.system;
}

/** Ensure a Google Font stylesheet is present in the document (idempotent). */
export function ensureMenuGoogleFontLoaded(id: string | null | undefined): void {
  if (typeof document === 'undefined') return;
  const font = resolveMenuFont(id);
  if (!font.google) return;

  const href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
  const existing = document.querySelector(`link[data-tourbots-menu-font="${font.id}"]`);
  if (existing) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute('data-tourbots-menu-font', font.id);
  document.head.appendChild(link);
}
