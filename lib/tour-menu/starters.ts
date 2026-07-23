/**
 * Sensible default content and quick-start block templates for the menu builder.
 */

export function createDefaultNavListContent() {
  const stamp = Date.now();
  return {
    density: 'comfortable' as const,
    font_family: 'inherit',
    font_weight: 'normal',
    font_size: 14,
    line_height: 1.35,
    letter_spacing: 0,
    header_color: '#64748B',
    label_color: '#1E293B',
    description_color: '#64748B',
    icon_color: '#64748B',
    items: [
      {
        id: `nav-h-explore-${stamp}`,
        kind: 'header' as const,
        label: 'Explore',
      },
      {
        id: `nav-i-reception-${stamp}`,
        kind: 'item' as const,
        label: 'Reception',
        icon: 'DoorOpen',
        entries: [
          {
            id: `nav-i-reception-${stamp}-e0`,
            description: 'Start here',
            action_type: 'none' as const,
            target_id: '',
          },
        ],
      },
      {
        id: `nav-i-spaces-${stamp}`,
        kind: 'item' as const,
        label: 'Key spaces',
        icon: 'MapPin',
        entries: [
          {
            id: `nav-i-spaces-${stamp}-e0`,
            description: 'Jump to a highlight',
            action_type: 'none' as const,
            target_id: '',
          },
        ],
      },
      {
        id: `nav-h-help-${stamp}`,
        kind: 'header' as const,
        label: 'Help',
      },
      {
        id: `nav-i-chat-${stamp}`,
        kind: 'item' as const,
        label: 'Ask our AI guide',
        icon: 'MessageCircle',
        entries: [
          {
            id: `nav-i-chat-${stamp}-e0`,
            description: 'Get answers instantly',
            action_type: 'open_chat' as const,
            target_id: '',
            chat_prompt: 'Can you give me a quick overview of this venue?',
            chat_auto_send: true,
          },
        ],
      },
      {
        id: `nav-i-website-${stamp}`,
        kind: 'item' as const,
        label: 'Visit our website',
        icon: 'Link2',
        entries: [
          {
            id: `nav-i-website-${stamp}-e0`,
            description: 'Open in a new tab',
            action_type: 'url' as const,
            target_id: 'https://',
            open_in: 'new_tab' as const,
          },
        ],
      },
    ],
  };
}

export type MenuStarterId = 'navigation' | 'welcome' | 'simple-cta';

export interface MenuStarterTemplate {
  id: MenuStarterId;
  label: string;
  description: string;
  blocks: Array<{
    block_type: 'text' | 'buttons' | 'logo' | 'table' | 'spacer' | 'nav_list';
    alignment: 'left' | 'center' | 'right';
    margin_top: number;
    margin_bottom: number;
    content: Record<string, unknown>;
    styling: Record<string, unknown>;
  }>;
}

export const MENU_STARTER_TEMPLATES: MenuStarterTemplate[] = [
  {
    id: 'navigation',
    label: 'Navigation sidebar',
    description: 'Logo, short intro, and a structured nav list — best with Drawer.',
    blocks: [
      {
        block_type: 'logo',
        alignment: 'left',
        margin_top: 4,
        margin_bottom: 16,
        content: {
          image_url: '',
          width: 120,
          height: 48,
          desktop_size: 120,
          mobile_size: 96,
          alt_text: 'Logo',
        },
        styling: {},
      },
      {
        block_type: 'text',
        alignment: 'left',
        margin_top: 0,
        margin_bottom: 4,
        content: {
          text_type: 'header',
          text: 'Welcome',
          font_size: 22,
          font_weight: 'semibold',
          color: '#0F172A',
          line_height: 1.3,
        },
        styling: {},
      },
      {
        block_type: 'text',
        alignment: 'left',
        margin_top: 0,
        margin_bottom: 16,
        content: {
          text_type: 'paragraph',
          text: 'Explore the space or ask our AI guide anything.',
          font_size: 14,
          font_weight: 'normal',
          color: '#64748B',
          line_height: 1.5,
        },
        styling: {},
      },
      {
        block_type: 'nav_list',
        alignment: 'left',
        margin_top: 0,
        margin_bottom: 8,
        content: createDefaultNavListContent(),
        styling: {},
      },
    ],
  },
  {
    id: 'welcome',
    label: 'Welcome card',
    description: 'Centred intro with a couple of action buttons — best with Modal.',
    blocks: [
      {
        block_type: 'logo',
        alignment: 'center',
        margin_top: 8,
        margin_bottom: 16,
        content: {
          image_url: '',
          width: 140,
          height: 56,
          desktop_size: 140,
          mobile_size: 110,
          alt_text: 'Logo',
        },
        styling: {},
      },
      {
        block_type: 'text',
        alignment: 'center',
        margin_top: 0,
        margin_bottom: 8,
        content: {
          text_type: 'header',
          text: 'Welcome to our venue',
          font_size: 26,
          font_weight: 'bold',
          color: '#0F172A',
          line_height: 1.3,
        },
        styling: {},
      },
      {
        block_type: 'text',
        alignment: 'center',
        margin_top: 0,
        margin_bottom: 20,
        content: {
          text_type: 'paragraph',
          text: 'Take a look around, or chat with our AI assistant for a guided tour.',
          font_size: 15,
          font_weight: 'normal',
          color: '#475569',
          line_height: 1.55,
        },
        styling: {},
      },
      {
        block_type: 'buttons',
        alignment: 'center',
        margin_top: 0,
        margin_bottom: 8,
        content: {
          buttons: [
            {
              id: `btn-start-${Date.now()}`,
              label: 'Start exploring',
              action_type: 'close_menu',
              target_id: '',
              button_color: '#0F172A',
              text_color: '#FFFFFF',
            },
            {
              id: `btn-chat-${Date.now() + 1}`,
              label: 'Ask AI',
              action_type: 'open_chat',
              target_id: '',
              button_color: '#0F172A',
              text_color: '#FFFFFF',
              chat_prompt: 'Give me a quick overview of this venue.',
              chat_auto_send: true,
            },
          ],
          buttons_per_row: 2,
          mobile_buttons_per_row: 1,
          button_size: 'medium',
          button_style: 'solid',
          gap: 12,
        },
        styling: {},
      },
    ],
  },
  {
    id: 'simple-cta',
    label: 'Simple CTA',
    description: 'A short message and one clear button — minimal and fast.',
    blocks: [
      {
        block_type: 'text',
        alignment: 'center',
        margin_top: 12,
        margin_bottom: 12,
        content: {
          text_type: 'header',
          text: 'Ready to explore?',
          font_size: 24,
          font_weight: 'semibold',
          color: '#0F172A',
          line_height: 1.3,
        },
        styling: {},
      },
      {
        block_type: 'buttons',
        alignment: 'center',
        margin_top: 0,
        margin_bottom: 12,
        content: {
          buttons: [
            {
              id: `btn-cta-${Date.now()}`,
              label: 'Begin tour',
              action_type: 'close_menu',
              target_id: '',
              button_color: '#0F172A',
              text_color: '#FFFFFF',
            },
          ],
          buttons_per_row: 1,
          mobile_buttons_per_row: 1,
          button_size: 'large',
          button_style: 'solid',
          gap: 12,
        },
        styling: {},
      },
    ],
  },
];
