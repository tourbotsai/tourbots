"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TourMenuSettings, TourMenuBlock } from "@/lib/types";
import { TourMenuWidget } from "./tour-menu-widget";

interface TourMenuOverlayProps {
  tourId: string;
  onClose?: () => void;
  isPreviewMode?: boolean; // Admin preview mode - bypasses session storage
  isTourReady?: boolean; // SDK ready state - disables navigation until ready
  onOpenChat?: () => void; // Callback to open chat widget
  isChatAvailable?: boolean; // Whether chat widget is enabled
  currentModelId?: string; // Current active model ID - prevents redundant switches
}

export function TourMenuOverlay({ tourId, onClose, isPreviewMode = false, isTourReady = true, onOpenChat, isChatAvailable = false, currentModelId }: TourMenuOverlayProps) {
  const [menuData, setMenuData] = useState<{ settings: TourMenuSettings | null; blocks: TourMenuBlock[] } | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWidget, setShowWidget] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    async function fetchMenu() {
      // Hard reset overlay state whenever scope tour changes.
      setIsLoading(true);
      setMenuData(null);
      setIsVisible(false);
      setShowWidget(false);

      try {
        // Fetch menu data regardless of dismissed state (we need it for the widget)
        const response = await fetch(`/api/public/menu/${tourId}`);
        
        if (!response.ok) {
          // Silently fail if API returns error - don't break the embed
          setIsLoading(false);
          return;
        }
        
        const data = await response.json();

        if (data.settings?.enabled) {
          setMenuData(data);
          
          // Check if menu was already dismissed this session (skip in preview mode)
          const dismissed = !isPreviewMode && sessionStorage.getItem(`tour-menu-dismissed-${tourId}`);
          
          if (dismissed) {
            // Menu was dismissed - show widget instead
            setIsVisible(false);
            setShowWidget(true);
          } else {
            // Show menu on first load
            setIsVisible(true);
            setShowWidget(false);
          }
        } else {
          // Explicitly keep hidden if this tour has no enabled menu.
          setMenuData(null);
          setIsVisible(false);
          setShowWidget(false);
        }
      } catch (error) {
        // Silently fail - tour should still work even if menu fails to load
        console.error('Error fetching tour menu:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (tourId) {
      fetchMenu();
    }
  }, [tourId, isPreviewMode]);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Check on mount
    checkMobile();

    // Listen for resize
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    
    // Show widget after menu close animation completes
    setTimeout(() => {
      setShowWidget(true);
    }, 300); // Wait for menu fade-out
    
    // Mark as dismissed for this session (skip in preview mode)
    if (!isPreviewMode) {
      sessionStorage.setItem(`tour-menu-dismissed-${tourId}`, 'true');
    }
    
    onClose?.();
  };

  const handleWidgetClick = () => {
    setShowWidget(false);
    
    // Clear session storage to allow menu to show
    if (!isPreviewMode) {
      sessionStorage.removeItem(`tour-menu-dismissed-${tourId}`);
    }
    
    // Show menu after widget fades out
    setTimeout(() => {
      setIsVisible(true);
    }, 200);
  };

  const handleButtonClick = async (button: any) => {
    // Prevent button click if SDK not ready (except for close_menu)
    if (!isTourReady && button.action_type !== 'close_menu') {
      console.warn('⚠️ Tour not ready yet - button disabled');
      return;
    }

    switch (button.action_type) {
      case 'tour_point':
        // Navigate to tour point - fetch point data first
        if (button.target_id) {
          try {
            // Fetch tour point details
            const response = await fetch(`/api/public/tours/points/${button.target_id}`);
            if (response.ok) {
              const point = await response.json();
              
              // Validate point data before dispatching event
              if (point && point.sweep_id) {
                window.dispatchEvent(new CustomEvent('matterport_navigate', {
                  detail: {
                    sweep_id: point.sweep_id,
                    position: point.position,
                    rotation: point.rotation,
                    area_name: point.name
                  }
                }));
              }
            }
          } catch (error) {
            // Fail silently - just close the menu
            console.error('Error fetching tour point:', error);
          }
        }
        handleClose();
        break;
        
      case 'tour_model':
        // Switch to different model - use stored model ID
        if (button.target_model_id) {
          // Check if clicking same model we're already in
          if (button.target_model_id === currentModelId) {
            // Already on this model - just close menu normally
            handleClose();
            break;
          }
          
          // Different model - dispatch switch event
          window.dispatchEvent(new CustomEvent('switch_matterport_model', {
            detail: {
              modelId: button.target_model_id,
              tourName: button.target_model_name || 'Tour'
            }
          }));
          
          // Temporarily hide menu and widget during transition
          setIsVisible(false);
          setShowWidget(false);
          
          // Clear dismissed state so menu can reappear on new model
          if (!isPreviewMode) {
            sessionStorage.removeItem(`tour-menu-dismissed-${tourId}`);
          }
          
          // Reshow menu after model loads (1.5s delay for model switch animation)
          setTimeout(() => {
            setIsVisible(true);
            setShowWidget(false);
          }, 1500);
        }
        break;
        
      case 'url':
        // Open external URL
        if (button.target_id) {
          try {
            // Prepend https:// if no protocol specified
            let urlString = button.target_id.trim();
            if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
              urlString = 'https://' + urlString;
            }
            
            // Validate URL format
            const url = new URL(urlString);
            
            // Only allow http/https protocols
            if (url.protocol === 'http:' || url.protocol === 'https:') {
              window.open(urlString, '_blank', 'noopener,noreferrer');
              handleClose(); // Close menu after opening URL
            }
          } catch (error) {
            // Invalid URL - fail silently
            console.error('Invalid URL:', button.target_id);
          }
        }
        break;
        
      case 'open_chat':
        // Open the chat widget if available
        if (onOpenChat && isChatAvailable) {
          onOpenChat();
          handleClose(); // Close menu after opening chat
        } else if (!isChatAvailable) {
          console.warn('Chat widget is not enabled for this tour');
        }
        break;
        
      case 'close_menu':
        // Just close the menu
        handleClose();
        break;
    }
  };

  // Don't render anything if still loading
  if (isLoading) {
    return null;
  }

  // Don't render if no menu data or menu not enabled
  if (!menuData || !menuData.settings) {
    return null;
  }

  const settings = menuData.settings;
  const blocks = menuData.blocks;
  const nonSpacerBlocks = blocks.filter((block) => block.block_type !== 'spacer');
  const isCenteredSingleButtonsMenu =
    settings.position === 'center' &&
    nonSpacerBlocks.length === 1 &&
    nonSpacerBlocks[0].block_type === 'buttons';

  // If menu not visible, show widget (if enabled)
  if (!isVisible) {
    return (
      <TourMenuWidget
        settings={settings}
        onClick={handleWidgetClick}
        isVisible={showWidget}
      />
    );
  }

  // Render the menu (menu is visible)

  // Get animation class
  const getAnimationClass = () => {
    switch (settings.entrance_animation) {
      case 'fade-scale':
        return 'animate-in fade-in zoom-in-95 duration-400';
      case 'slide-up':
        return 'animate-in slide-in-from-bottom-8 duration-400';
      case 'slide-down':
        return 'animate-in slide-in-from-top-8 duration-400';
      default:
        return '';
    }
  };

  const getPositionClass = () => {
    switch (settings.position) {
      case 'top':
        return 'items-start pt-12';
      case 'bottom':
        return 'items-end pb-12';
      default:
        return 'items-center justify-center';
    }
  };

  const renderBlock = (block: TourMenuBlock) => {
    const alignmentClass = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right'
    }[block.alignment as 'left' | 'center' | 'right'] || 'text-center';

    const marginTop = isCenteredSingleButtonsMenu && block.block_type === 'buttons' ? 0 : block.margin_top;
    const marginBottom = isCenteredSingleButtonsMenu && block.block_type === 'buttons' ? 0 : block.margin_bottom;
    const marginStyle = {
      marginTop: `${marginTop}px`,
      marginBottom: `${marginBottom}px`
    };

    switch (block.block_type) {
      case 'text':
        const content = block.content as any;
        
        // Safety check: ensure text exists
        if (!content.text) {
          return null;
        }
        
        const fontWeightClass = {
          light: 'font-light',
          normal: 'font-normal',
          semibold: 'font-semibold',
          bold: 'font-bold'
        }[content.font_weight as 'light' | 'normal' | 'semibold' | 'bold'] || 'font-normal';

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <p
              className={fontWeightClass}
              style={{
                fontSize: `${content.font_size || 16}px`,
                color: content.color || '#000000',
                lineHeight: content.line_height || 1.5
              }}
            >
              {content.text}
            </p>
          </div>
        );

      case 'buttons':
        const buttonsContent = block.content as any;
        
        // Safety check: ensure buttons array exists
        if (!buttonsContent.buttons || !Array.isArray(buttonsContent.buttons) || buttonsContent.buttons.length === 0) {
          return null;
        }
        
        const sizeClass = {
          small: 'px-3 py-1.5 text-sm',
          medium: 'px-4 py-2 text-base',
          large: 'px-6 py-3 text-lg'
        }[buttonsContent.button_size as 'small' | 'medium' | 'large'] || 'px-4 py-2';

        // Use mobile or desktop buttons_per_row based on viewport
        const buttonsPerRow = isMobile 
          ? (buttonsContent.mobile_buttons_per_row || buttonsContent.buttons_per_row) 
          : buttonsContent.buttons_per_row;

        const gridCols = {
          1: 'grid-cols-1',
          2: 'grid-cols-2',
          3: 'grid-cols-3',
          4: 'grid-cols-4'
        }[buttonsPerRow as 1 | 2 | 3 | 4] || 'grid-cols-2';

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <div
              className={`grid ${gridCols} w-full`}
              style={{ gap: `${buttonsContent.gap || 12}px` }}
            >
              {buttonsContent.buttons.map((button: any) => {
                // Check if this button requires SDK to be ready (all except close_menu)
                const requiresSDK = button.action_type !== 'close_menu';
                const isDisabled = requiresSDK && !isTourReady;
                
                return (
                  <button
                    key={button.id}
                    disabled={isDisabled}
                    className={`${sizeClass} rounded-lg font-medium transition-all ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:opacity-90 active:scale-95 cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: buttonsContent.button_style === 'solid' ? button.button_color : 'transparent',
                      color: button.text_color,
                      border: buttonsContent.button_style === 'outline' ? `2px solid ${button.button_color}` : 'none'
                    }}
                    onClick={() => handleButtonClick(button)}
                    title={isDisabled ? 'Loading tour...' : button.label}
                  >
                    {button.label}
                    {isDisabled && (
                      <span className="ml-2 inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'logo':
        const logoContent = block.content as any;
        
        // Safety check: ensure image_url exists
        if (!logoContent.image_url) {
          return null;
        }
        
        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <img
              src={logoContent.image_url}
              alt={logoContent.alt_text || 'Logo'}
              style={{
                width: `${logoContent.width || 150}px`,
                height: `${logoContent.height || 80}px`,
                maxWidth: '100%',
                objectFit: 'contain',
                display: block.alignment === 'center' ? 'block' : 'inline-block',
                margin: block.alignment === 'center' ? '0 auto' : 0
              }}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        );

      case 'table':
        const tableContent = block.content as any;
        
        // Safety check: ensure headers and rows exist
        if (!tableContent.headers || !Array.isArray(tableContent.headers) || tableContent.headers.length === 0) {
          return null;
        }
        
        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <table 
              className="w-full border-collapse rounded-lg overflow-hidden"
              style={{
                borderColor: tableContent.border_color || '#E5E7EB',
                fontSize: `${tableContent.text_size || 14}px`
              }}
            >
              <thead>
                <tr style={{ backgroundColor: tableContent.header_background || '#F3F4F6' }}>
                  {tableContent.headers.map((header: string, index: number) => (
                    <th
                      key={index}
                      className="px-4 py-2 font-semibold border"
                      style={{ borderColor: tableContent.border_color || '#E5E7EB' }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tableContent.rows) && tableContent.rows.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {Array.isArray(row) && row.map((cell: string, colIndex: number) => (
                      <td
                        key={colIndex}
                        className="px-4 py-2 border"
                        style={{ borderColor: tableContent.border_color || '#E5E7EB' }}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'spacer':
        const spacerContent = block.content as any;
        const spacerHeight = spacerContent.height || 24;
        
        // Cap spacer height to prevent abuse (max 200px)
        const safeHeight = Math.min(Math.max(spacerHeight, 0), 200);
        
        return (
          <div
            key={block.id}
            style={{ height: `${safeHeight}px` }}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="absolute inset-0 z-[9999]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: settings.backdrop_blur ? 'blur(4px)' : 'none'
      }}
    >
      <div
        className={cn(
          "absolute inset-0 flex",
          getPositionClass()
        )}
      >
        {/* Menu Container */}
        <div
          className={cn(
            "relative mx-auto overflow-y-auto",
            getAnimationClass()
          )}
          style={{
            maxWidth: `${settings.max_width}px`,
            padding: `${settings.padding}px`,
            backgroundColor: settings.menu_background_color,
            borderRadius: `${settings.border_radius}px`,
            maxHeight: '85%',
            width: '90%',
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 transparent'
          }}
        >
          {/* Keep close on the menu's own top-right corner */}
          {settings.show_close_button !== false && (
            <button
              className="absolute right-2 top-2 z-20 p-1 text-slate-700 transition-colors hover:text-slate-900"
              onClick={handleClose}
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Blocks */}
          <div className="space-y-0">
            {blocks
              .sort((a, b) => a.display_order - b.display_order)
              .map(block => renderBlock(block))}
          </div>
        </div>
      </div>
    </div>
  );
}

