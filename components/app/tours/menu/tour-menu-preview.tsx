"use client";

import { useCallback, useEffect, useState } from "react";
import { TourMenuWidget } from "@/components/embed/tour-menu-widget";
import { TourMenuRenderer, TourMenuActivatedItem } from "@/components/embed/tour-menu-renderer";
import { useToast } from "@/components/ui/use-toast";
import { MenuItemAction } from "@/lib/tour-menu";

interface TourMenuPreviewProps {
  settings: any;
  blocks: any[];
  mode?: 'desktop' | 'mobile';
  isPreviewMode?: boolean;
}

function describeAction(action: MenuItemAction, label: string): string {
  switch (action.type) {
    case 'tour_point':
      return `Navigate to “${label || 'tour point'}”`;
    case 'tour_model':
      return `Switch tour to “${label || action.tourId}”`;
    case 'external_url':
      return action.openIn === 'same_tab'
        ? `Open ${action.url} in this tab`
        : `Open ${action.url} in a new tab`;
    case 'open_chat':
      if (action.prompt && action.autoSend) return `Chat auto-send: “${action.prompt}”`;
      if (action.prompt) return `Open chat with draft: “${action.prompt}”`;
      return 'Open tour chat';
    case 'close_menu':
      return 'Close menu';
    default:
      return label || 'Action';
  }
}

// Builder preview: same renderer as production. Actions run in-preview
// (open/close, URL, toast for tour/chat) so the right pane is the only playground.
export function TourMenuPreview({ settings, blocks, mode = 'desktop', isPreviewMode = false }: TourMenuPreviewProps) {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(settings?.start_open === true);

  useEffect(() => {
    setIsVisible(settings?.start_open === true);
  }, [settings?.start_open, settings?.menu_style, settings?.enabled]);

  const handleItemActivate = useCallback((item: TourMenuActivatedItem) => {
    const { action } = item;

    if (action.type === 'external_url' && action.url) {
      // Never navigate the builder away on same-tab links — preview with a toast instead.
      // New-tab opens are safe and still useful to verify the URL.
      if (action.openIn === 'same_tab') {
        toast({
          title: item.label || 'External link',
          description: `Would open in this tab: ${action.url}`,
        });
      } else {
        window.open(action.url, '_blank', 'noopener,noreferrer');
        toast({
          title: item.label || 'External link',
          description: `Opened in a new tab: ${action.url}`,
        });
      }
      return;
    }

    toast({
      title: item.label || 'Menu action',
      description: describeAction(action, item.label),
    });
  }, [toast]);

  const handleOpenChat = useCallback((opts?: { prompt?: string; autoSend?: boolean }) => {
    toast({
      title: 'Tour chat',
      description: describeAction(
        { type: 'open_chat', prompt: opts?.prompt, autoSend: opts?.autoSend },
        'Chat'
      ),
    });
  }, [toast]);

  if (!settings.enabled && isPreviewMode) {
    return (
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
        <div className="p-8 text-center text-white/60">
          <p className="mb-2 text-sm font-medium">Tour menu disabled</p>
          <p className="text-xs">Enable the tour menu to see the preview</p>
        </div>
      </div>
    );
  }

  const isMobilePreview = mode === 'mobile';

  const previewContent = (
    <div
      className="relative h-full w-full overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=675&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <TourMenuRenderer
        settings={settings}
        blocks={blocks}
        isVisible={isVisible}
        isMobile={isMobilePreview}
        isTourReady={true}
        isChatAvailable={true}
        mode="preview"
        onClose={() => setIsVisible(false)}
        onItemActivate={handleItemActivate}
        onOpenChat={handleOpenChat}
      />

      <TourMenuWidget
        settings={settings}
        onClick={() => setIsVisible(true)}
        isVisible={!isVisible}
        isMobile={isMobilePreview}
      />
    </div>
  );

  if (mode === 'mobile') {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 p-4 sm:p-6 dark:bg-neutral-900">
        <div className="relative aspect-[375/667] w-full max-w-[375px]">
          <div className="absolute inset-0 rounded-[3rem] bg-black p-3 shadow-2xl">
            <div className="h-full w-full overflow-hidden rounded-[2.5rem] bg-white">
              {previewContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <div className="aspect-[4/3] overflow-hidden rounded-lg">{previewContent}</div>;
}
