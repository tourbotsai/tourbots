import type { ComponentType } from 'react';
import {
  MapPin,
  Compass,
  Link2,
  MessageCircle,
  Home,
  Info,
  Star,
  Building2,
  DoorOpen,
  Utensils,
  Car,
  Phone,
  Mail,
  Calendar,
  Users,
  Sparkles,
} from 'lucide-react';

export type NavIconName =
  | 'MapPin'
  | 'Compass'
  | 'Link2'
  | 'MessageCircle'
  | 'Home'
  | 'Info'
  | 'Star'
  | 'Building2'
  | 'DoorOpen'
  | 'Utensils'
  | 'Car'
  | 'Phone'
  | 'Mail'
  | 'Calendar'
  | 'Users'
  | 'Sparkles';

export const NAV_ICON_OPTIONS: {
  name: NavIconName;
  label: string;
  Icon: ComponentType<{ className?: string }>;
}[] = [
  { name: 'MapPin', label: 'Location', Icon: MapPin },
  { name: 'Compass', label: 'Explore', Icon: Compass },
  { name: 'Home', label: 'Home', Icon: Home },
  { name: 'Building2', label: 'Building', Icon: Building2 },
  { name: 'DoorOpen', label: 'Entrance', Icon: DoorOpen },
  { name: 'Utensils', label: 'Dining', Icon: Utensils },
  { name: 'Car', label: 'Parking', Icon: Car },
  { name: 'Users', label: 'People', Icon: Users },
  { name: 'Calendar', label: 'Events', Icon: Calendar },
  { name: 'Phone', label: 'Phone', Icon: Phone },
  { name: 'Mail', label: 'Email', Icon: Mail },
  { name: 'Link2', label: 'Link', Icon: Link2 },
  { name: 'MessageCircle', label: 'Chat', Icon: MessageCircle },
  { name: 'Info', label: 'Info', Icon: Info },
  { name: 'Star', label: 'Featured', Icon: Star },
  { name: 'Sparkles', label: 'Highlight', Icon: Sparkles },
];

export const NAV_ICON_MAP: Record<string, ComponentType<{ className?: string }>> = Object.fromEntries(
  NAV_ICON_OPTIONS.map(({ name, Icon }) => [name, Icon])
);

export function isNavIconName(value: string | null | undefined): value is NavIconName {
  return Boolean(value && value in NAV_ICON_MAP);
}
