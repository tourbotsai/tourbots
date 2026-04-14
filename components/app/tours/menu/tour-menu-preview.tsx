"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TourMenuWidget } from "@/components/embed/tour-menu-widget";

interface TourMenuPreviewProps {
  settings: any;
  blocks: any[];
  mode?: 'desktop' | 'mobile';
  isPreviewMode?: boolean;
}

export function TourMenuPreview({ settings, blocks, mode = 'desktop', isPreviewMode = false }: TourMenuPreviewProps) {
  const nonSpacerBlocks = blocks.filter((block) => block.block_type !== 'spacer');
  const isCenteredSingleButtonsMenu =
    settings.position === 'center' &&
    nonSpacerBlocks.length === 1 &&
    nonSpacerBlocks[0].block_type === 'buttons';

  if (!settings.enabled && isPreviewMode) {
    return (
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-white/60 p-8">
          <p className="text-sm font-medium mb-2">Tour Menu Disabled</p>
          <p className="text-xs">Enable the tour menu to see the preview</p>
        </div>
      </div>
    );
  }

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

  const widgetPreviewSettings = {
    ...settings,
    show_reopen_widget: settings.show_reopen_widget ?? true,
    widget_position: settings.widget_position || 'bottom-left',
    widget_icon: settings.widget_icon || 'HelpCircle',
    widget_size: settings.widget_size || 'small',
    widget_color: settings.widget_color || '#FFFFFF',
    widget_hover_color: settings.widget_hover_color || '#F0F0F0',
    widget_icon_color: settings.widget_icon_color || '#FF0000',
    widget_x_offset: settings.widget_x_offset ?? 24,
    widget_y_offset: settings.widget_y_offset ?? 24,
    widget_tooltip_text: settings.widget_tooltip_text || 'Reopen Tour Menu',
    widget_border_radius: settings.widget_border_radius ?? 50,
    widget_shadow_intensity: settings.widget_shadow_intensity || 'medium',
  };

  const getLogoDimensions = (content: any) => {
    const desktopSize = Number(content.desktop_size);
    const mobileSize = Number(content.mobile_size);
    const legacyWidth = Number(content.width);
    const legacyHeight = Number(content.height);

    if (mode === 'mobile' && Number.isFinite(mobileSize) && mobileSize > 0) {
      return { width: mobileSize, height: mobileSize };
    }

    if (Number.isFinite(desktopSize) && desktopSize > 0) {
      return { width: desktopSize, height: desktopSize };
    }

    return {
      width: Number.isFinite(legacyWidth) && legacyWidth > 0 ? legacyWidth : 150,
      height: Number.isFinite(legacyHeight) && legacyHeight > 0 ? legacyHeight : 80,
    };
  };

  const renderBlock = (block: any) => {
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
        const fontWeightClass = {
          light: 'font-light',
          normal: 'font-normal',
          semibold: 'font-semibold',
          bold: 'font-bold'
        }[block.content.font_weight as 'light' | 'normal' | 'semibold' | 'bold'] || 'font-normal';

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <p
              className={fontWeightClass}
              style={{
                fontSize: `${block.content.font_size}px`,
                color: block.content.color,
                lineHeight: block.content.line_height
              }}
            >
              {block.content.text || 'Empty text block'}
            </p>
          </div>
        );

      case 'buttons':
        const sizeClass = {
          small: 'px-3 py-1.5 text-sm',
          medium: 'px-4 py-2 text-base',
          large: 'px-6 py-3 text-lg'
        }[block.content.button_size as 'small' | 'medium' | 'large'] || 'px-4 py-2';

        const styleClass = {
          solid: '',
          outline: 'border-2 bg-transparent',
          ghost: 'bg-transparent hover:bg-gray-100'
        }[block.content.button_style as 'solid' | 'outline' | 'ghost'] || '';

        // Use desktop or mobile buttons_per_row based on preview mode
        const buttonsPerRow = mode === 'mobile' 
          ? (block.content.mobile_buttons_per_row || block.content.buttons_per_row) 
          : block.content.buttons_per_row;

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
              style={{ gap: `${block.content.gap}px` }}
            >
              {block.content.buttons.length === 0 ? (
                <div className="col-span-full text-center text-gray-400 text-sm py-4 border-2 border-dashed rounded">
                  No buttons added yet
                </div>
              ) : (
                block.content.buttons.map((button: any) => (
                  <button
                    key={button.id}
                    className={`${sizeClass} ${styleClass} rounded-lg font-medium transition-all hover:opacity-90`}
                    style={{
                      backgroundColor: block.content.button_style === 'solid' ? button.button_color : 'transparent',
                      color: button.text_color,
                      borderColor: button.button_color
                    }}
                  >
                    {button.label}
                  </button>
                ))
              )}
            </div>
          </div>
        );

      case 'logo':
        const logoDimensions = getLogoDimensions(block.content);
        const logoAlignment = block.alignment === 'left'
          ? 'flex-start'
          : block.alignment === 'right'
            ? 'flex-end'
            : 'center';

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <div
              style={{
                width: '100%',
                height: '128px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: logoAlignment,
              }}
            >
              {block.content.image_url ? (
                <img
                  src={block.content.image_url}
                  alt={block.content.alt_text}
                  style={{
                    width: `${logoDimensions.width}px`,
                    height: `${logoDimensions.height}px`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className="border-2 border-dashed rounded flex items-center justify-center text-gray-400 text-sm"
                  style={{
                    width: `${logoDimensions.width}px`,
                    height: `${logoDimensions.height}px`,
                    maxWidth: '100%',
                    maxHeight: '100%',
                  }}
                >
                  Logo
                </div>
              )}
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <table 
              className="w-full border-collapse rounded-lg overflow-hidden"
              style={{
                borderColor: block.content.border_color,
                fontSize: `${block.content.text_size}px`
              }}
            >
              <thead>
                <tr style={{ backgroundColor: block.content.header_background }}>
                  {block.content.headers.map((header: string, index: number) => (
                    <th
                      key={index}
                      className="px-4 py-2 font-semibold border"
                      style={{ borderColor: block.content.border_color }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.content.rows.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, colIndex: number) => (
                      <td
                        key={colIndex}
                        className="px-4 py-2 border"
                        style={{ borderColor: block.content.border_color }}
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
        return (
          <div
            key={block.id}
            style={{ height: `${block.content.height}px` }}
          />
        );

      default:
        return null;
    }
  };

  // Mobile preview content
  const previewContent = (
    <div 
      className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=675&fit=crop)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 flex",
            getPositionClass()
          )}
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: settings.backdrop_blur ? 'blur(4px)' : 'none'
          }}
        >
          {/* Menu Container */}
          <div
            className={cn(
              "relative mx-auto overflow-y-auto",
              getAnimationClass()
            )}
            style={{
              maxWidth: mode === 'mobile' ? '90%' : `${settings.max_width}px`,
              padding: `${settings.padding}px`,
              backgroundColor: settings.menu_background_color,
              borderRadius: `${settings.border_radius}px`,
              maxHeight: mode === 'mobile' ? '85%' : '80%',
              width: mode === 'mobile' ? '90%' : '90%',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 transparent'
            }}
          >
          {/* Keep close on the menu's own top-right corner */}
          {settings.show_close_button && (
            <button
              className="absolute right-2 top-2 z-20 p-1 text-slate-700 transition-colors hover:text-slate-900"
              onClick={(e) => e.preventDefault()}
              aria-label="Close menu"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Blocks */}
          <div className="space-y-0">
            {blocks.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm font-medium mb-1">No content blocks</p>
                <p className="text-xs">Add blocks on the left to see them here</p>
              </div>
            ) : (
              blocks
                .sort((a, b) => a.display_order - b.display_order)
                .map(block => renderBlock(block))
            )}
          </div>
        </div>
      </div>

        {/* Preview the reopen widget whenever it is enabled */}
        {widgetPreviewSettings.show_reopen_widget && (
          <TourMenuWidget
            settings={widgetPreviewSettings as any}
            onClick={() => {}}
            isVisible={true}
          />
        )}
    </div>
  );

  // Wrap with mobile frame if needed
  if (mode === 'mobile') {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 p-4 sm:p-6">
        <div className="relative w-full max-w-[375px] aspect-[375/667]">
          {/* Mobile device frame */}
          <div className="absolute inset-0 bg-black rounded-[3rem] p-3 shadow-2xl">
            <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden">
              {previewContent}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop view
  return (
    <div className="aspect-[4/3]">
      {previewContent}
    </div>
  );
}

