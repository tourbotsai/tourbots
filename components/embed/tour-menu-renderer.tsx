"use client";

import { useEffect, useMemo } from "react";
import { X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TourMenuSettings,
  TourMenuBlock,
  TextBlockContent,
  ButtonsBlockContent,
  LogoBlockContent,
  TableBlockContent,
  NavListBlockContent,
  NavListItem,
} from "@/lib/types";
import {
  getEffectiveMenuChrome,
  getEffectiveTextStyles,
  getEffectiveNavStyles,
  resolveNavItemColours,
  resolveNavItemPaddingY,
  normaliseNavListEntries,
  normaliseMenuItemAction,
  MenuItemAction,
  MenuTriggerSource,
  PANEL_SHADOW_MAP,
  CLOSE_BUTTON_SIZE_MAP,
  resolveMenuFont,
  ensureMenuGoogleFontLoaded,
  NAV_ICON_MAP,
  type EffectiveNavStyles,
} from "@/lib/tour-menu";

export interface TourMenuActivatedItem {
  /** Normalised, unified action for this item - navigate, switch model, open URL, etc. */
  action: MenuItemAction;
  label: string;
  id: string;
  itemType: "button" | "nav_row";
}

interface TourMenuRendererProps {
  settings: TourMenuSettings | Record<string, any>;
  blocks: TourMenuBlock[];
  isVisible: boolean;
  isMobile: boolean;
  isTourReady: boolean;
  isChatAvailable: boolean;
  /** 'preview' renders builder-only empty states; both modes share the same chrome/blocks. */
  mode: "live" | "preview";
  onClose: (triggerSource: MenuTriggerSource) => void;
  /** Fired for actions the host owns: tour points, other tours/models, external links. */
  onItemActivate: (item: TourMenuActivatedItem) => void;
  onOpenChat?: (opts?: { prompt?: string; autoSend?: boolean }) => void;
}

export function TourMenuRenderer({
  settings,
  blocks,
  isVisible,
  isMobile,
  isTourReady,
  isChatAvailable,
  mode,
  onClose,
  onItemActivate,
  onOpenChat,
}: TourMenuRendererProps) {
  const chrome = useMemo(
    () => getEffectiveMenuChrome(settings, isMobile ? "mobile" : "desktop"),
    [settings, isMobile]
  );

  const font = useMemo(() => resolveMenuFont(chrome.menuFontFamily), [chrome.menuFontFamily]);

  useEffect(() => {
    if (!isVisible) return;
    ensureMenuGoogleFontLoaded(chrome.menuFontFamily);
    for (const block of blocks) {
      if (block.block_type === "text") {
        const family = (block.content as TextBlockContent | undefined)?.font_family;
        if (family) ensureMenuGoogleFontLoaded(family);
      }
      if (block.block_type === "nav_list") {
        const family = (block.content as NavListBlockContent | undefined)?.font_family;
        if (family && family !== "inherit") ensureMenuGoogleFontLoaded(family);
      }
    }
  }, [isVisible, chrome.menuFontFamily, blocks]);

  if (!isVisible) return null;

  const isPanelChrome = chrome.menuStyle !== "modal";

  const nonSpacerBlocks = blocks.filter((block) => block.block_type !== "spacer");
  const isCenteredSingleButtonsMenu =
    !isPanelChrome &&
    chrome.position === "center" &&
    nonSpacerBlocks.length === 1 &&
    nonSpacerBlocks[0].block_type === "buttons";

  // Activate a raw button/nav item: close + open-chat are handled here since they need
  // no host-specific side effects; everything else (navigation, links) is handed up.
  const activate = (rawItem: Record<string, any>, itemType: "button" | "nav_row") => {
    const action = normaliseMenuItemAction(rawItem);
    switch (action.type) {
      case "close_menu":
        onClose("item_action");
        return;
      case "open_chat":
        if (!isChatAvailable) return;
        onOpenChat?.({ prompt: action.prompt, autoSend: action.autoSend });
        return;
      case "none":
        return;
      default:
        onItemActivate({ action, label: rawItem.label || "", id: rawItem.id || "", itemType });
    }
  };

  const isItemDisabled = (action: MenuItemAction): boolean => {
    if (action.type === "open_chat") return !isChatAvailable;
    if (action.type === "close_menu" || action.type === "none") return false;
    return !isTourReady;
  };

  const getAnimationClass = () => {
    if (chrome.entranceAnimation === "none") return "";

    if (isPanelChrome) {
      // Drawers honour the configured entrance, sliding from the anchor side by default.
      switch (chrome.entranceAnimation) {
        case "slide-up":
          return "animate-in fade-in slide-in-from-bottom-8 duration-300";
        case "slide-down":
          return "animate-in fade-in slide-in-from-top-8 duration-300";
        case "fade-scale":
        default:
          return chrome.anchorSide === "left"
            ? "animate-in fade-in slide-in-from-left-full duration-300"
            : "animate-in fade-in slide-in-from-right-full duration-300";
      }
    }

    switch (chrome.entranceAnimation) {
      case "fade-scale":
        return "animate-in fade-in zoom-in-95 duration-400";
      case "slide-up":
        return "animate-in slide-in-from-bottom-8 duration-400";
      case "slide-down":
        return "animate-in slide-in-from-top-8 duration-400";
      default:
        return "";
    }
  };

  const getModalPositionClass = () => {
    switch (chrome.position) {
      case "top":
        return "items-start pt-12";
      case "bottom":
        return "items-end pb-12";
      default:
        return "items-center justify-center";
    }
  };

  const getLogoDimensions = (content: LogoBlockContent) => {
    const desktopSize = Number(content.desktop_size);
    const mobileSize = Number(content.mobile_size);
    const legacyWidth = Number(content.width);
    const legacyHeight = Number(content.height);

    if (isMobile && Number.isFinite(mobileSize) && mobileSize > 0) {
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

  const closeSize = CLOSE_BUTTON_SIZE_MAP[chrome.closeButtonSize] || CLOSE_BUTTON_SIZE_MAP.medium;
  const closeIsFilled = chrome.closeButtonStyle === "filled";

  const closeButton = chrome.showCloseButton ? (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full transition-colors",
        closeIsFilled ? "hover:opacity-90" : "hover:bg-black/5 active:bg-black/10"
      )}
      style={{
        width: `${closeSize.hit}px`,
        height: `${closeSize.hit}px`,
        color: chrome.closeButtonColor,
        backgroundColor: closeIsFilled ? `${chrome.closeButtonColor}14` : "transparent",
      }}
      onClick={() => onClose("close_control")}
      aria-label="Close menu"
    >
      <X style={{ width: closeSize.icon, height: closeSize.icon }} strokeWidth={2.25} />
    </button>
  ) : null;

  // Overlay the close control so it does not reserve a row above the first block
  // (logo can sit flush to the top when vertical padding is 0).
  const closeOverlay = closeButton ? (
    <div
      className={cn(
        "pointer-events-none absolute z-10",
        chrome.closeButtonPosition === "top-left" ? "left-0 top-0" : "right-0 top-0"
      )}
      style={{
        paddingTop: `${chrome.paddingVertical}px`,
        paddingLeft: chrome.closeButtonPosition === "top-left" ? `${chrome.padding}px` : undefined,
        paddingRight: chrome.closeButtonPosition === "top-right" ? `${chrome.padding}px` : undefined,
      }}
    >
      <div className="pointer-events-auto">{closeButton}</div>
    </div>
  ) : null;

  const panelShadow = PANEL_SHADOW_MAP[chrome.panelShadow] || PANEL_SHADOW_MAP.medium;
  const panelFontStyle = { fontFamily: font.stack };

  const renderNavItem = (item: NavListItem, styles: EffectiveNavStyles) => {
    const colours = resolveNavItemColours(item, styles);
    const typeStyle = {
      fontFamily: styles.fontFamilyId
        ? resolveMenuFont(styles.fontFamilyId).stack
        : undefined,
      letterSpacing: `${styles.letterSpacing}em`,
      lineHeight: styles.lineHeight,
    };

    if (item.kind === "header") {
      return (
        <div
          key={item.id}
          className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide first:pt-1"
          style={{
            ...typeStyle,
            fontSize: `${Math.max(styles.descriptionFontSize, 11)}px`,
            color: colours.labelColor,
            fontWeight: 600,
          }}
        >
          {item.label}
        </div>
      );
    }

    const entries = normaliseNavListEntries(item);
    const Icon = item.icon ? NAV_ICON_MAP[item.icon] : null;
    const itemPaddingY = resolveNavItemPaddingY(item, styles);
    const rowPadding = `${itemPaddingY}px`;
    /** Sub-actions use half so V spacing ≈ gap between Cardio Area / Leg Room, not double. */
    const entryPaddingY = Math.max(2, Math.round(itemPaddingY / 2));
    const entryPadding = `${entryPaddingY}px`;
    const multi = entries.length > 1;

    const iconNode = Icon ? (
      <span className="inline-flex h-4 w-4 flex-shrink-0" style={{ color: colours.iconColor }}>
        <Icon className="h-4 w-4" />
      </span>
    ) : null;

    if (multi) {
      return (
        <div key={item.id} className="flex flex-col">
          <div
            className="flex w-full items-center gap-3 rounded-lg px-3 text-left"
            style={{ paddingTop: rowPadding, paddingBottom: entryPadding }}
          >
            {iconNode}
            <span
              className="min-w-0 flex-1 block"
              style={{
                ...typeStyle,
                fontSize: `${styles.labelFontSize}px`,
                fontWeight: styles.fontWeightCss,
                color: colours.labelColor,
              }}
            >
              {item.label}
            </span>
          </div>
          {entries.map((entry) => {
            const action = normaliseMenuItemAction(entry);
            const disabled = isItemDisabled(action);
            const isStatic = action.type === "none";
            const entryLabel = entry.description || item.label;
            const rowBody = (
              <span
                className="min-w-0 flex-1 block pl-7"
                style={{
                  ...typeStyle,
                  fontSize: `${styles.descriptionFontSize}px`,
                  fontWeight: 400,
                  color: colours.descriptionColor,
                }}
              >
                {entryLabel}
              </span>
            );

            if (isStatic) {
              return (
                <div
                  key={entry.id}
                  className="flex w-full items-center gap-3 rounded-lg px-3 text-left"
                  style={{ paddingTop: entryPadding, paddingBottom: entryPadding }}
                >
                  {rowBody}
                </div>
              );
            }

            return (
              <button
                key={entry.id}
                type="button"
                disabled={disabled}
                onClick={() =>
                  activate(
                    { ...entry, id: entry.id, label: entryLabel },
                    "nav_row"
                  )
                }
                title={disabled && !isTourReady ? "Loading tour..." : entryLabel}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors",
                  disabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-slate-900/[0.04] active:bg-slate-900/[0.07]"
                )}
                style={{ paddingTop: entryPadding, paddingBottom: entryPadding }}
              >
                {rowBody}
                {disabled && !isTourReady ? (
                  <span className="inline-block h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
                )}
              </button>
            );
          })}
        </div>
      );
    }

    const entry = entries[0] || {};
    const action = normaliseMenuItemAction(entry);
    const disabled = isItemDisabled(action);
    const isStatic = action.type === "none";

    const labelNode = (
      <span className="min-w-0 flex-1">
        <span
          className="block"
          style={{
            ...typeStyle,
            fontSize: `${styles.labelFontSize}px`,
            fontWeight: styles.fontWeightCss,
            color: colours.labelColor,
          }}
        >
          {item.label}
        </span>
        {entry.description ? (
          <span
            className="block"
            style={{
              ...typeStyle,
              fontSize: `${styles.descriptionFontSize}px`,
              fontWeight: 400,
              color: colours.descriptionColor,
            }}
          >
            {entry.description}
          </span>
        ) : null}
      </span>
    );

    if (isStatic) {
      return (
        <div
          key={item.id}
          className="flex w-full items-center gap-3 rounded-lg px-3 text-left"
          style={{ paddingTop: rowPadding, paddingBottom: rowPadding }}
        >
          {iconNode}
          {labelNode}
        </div>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        disabled={disabled}
        onClick={() =>
          activate(
            { ...entry, id: entry.id || item.id, label: entry.description || item.label },
            "nav_row"
          )
        }
        title={disabled && !isTourReady ? "Loading tour..." : item.label}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 text-left transition-colors",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:bg-slate-900/[0.04] active:bg-slate-900/[0.07]"
        )}
        style={{ paddingTop: rowPadding, paddingBottom: rowPadding }}
      >
        {iconNode}
        {labelNode}
        {disabled && !isTourReady ? (
          <span className="inline-block h-3 w-3 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
        )}
      </button>
    );
  };

  const renderBlock = (block: TourMenuBlock) => {
    const alignmentClass =
      {
        left: "text-left",
        center: "text-center",
        right: "text-right",
      }[block.alignment as "left" | "center" | "right"] || "text-center";

    const rawMarginTop = Number.isFinite(block.margin_top) ? block.margin_top : 0;
    const rawMarginBottom = Number.isFinite(block.margin_bottom) ? block.margin_bottom : 12;
    const marginTop = isCenteredSingleButtonsMenu && block.block_type === "buttons" ? 0 : rawMarginTop;
    const marginBottom = isCenteredSingleButtonsMenu && block.block_type === "buttons" ? 0 : rawMarginBottom;
    const marginStyle = {
      marginTop: `${marginTop}px`,
      marginBottom: `${marginBottom}px`,
    };

    switch (block.block_type) {
      case "text": {
        const content = block.content as TextBlockContent;
        if (!content.text) return null;

        const textStyles = getEffectiveTextStyles(content as any, isMobile ? "mobile" : "desktop");
        const fontWeightClass =
          {
            light: "font-light",
            normal: "font-normal",
            semibold: "font-semibold",
            bold: "font-bold",
          }[textStyles.fontWeight as "light" | "normal" | "semibold" | "bold"] || "font-normal";

        const blockFont = content.font_family
          ? resolveMenuFont(content.font_family).stack
          : undefined;

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <p
              className={fontWeightClass}
              style={{
                fontSize: `${textStyles.fontSize}px`,
                color: textStyles.color,
                lineHeight: textStyles.lineHeight,
                fontFamily: blockFont,
                letterSpacing:
                  typeof content.letter_spacing === "number"
                    ? `${content.letter_spacing}em`
                    : undefined,
              }}
            >
              {content.text}
            </p>
          </div>
        );
      }

      case "buttons": {
        const buttonsContent = block.content as ButtonsBlockContent;
        if (!buttonsContent.buttons || !Array.isArray(buttonsContent.buttons) || buttonsContent.buttons.length === 0) {
          return null;
        }

        const sizeKey = isMobile
          ? (buttonsContent.mobile_button_size || buttonsContent.button_size)
          : buttonsContent.button_size;
        const sizeClass =
          {
            small: "px-3 py-1.5 text-sm",
            medium: "px-4 py-2 text-base",
            large: "px-6 py-3 text-lg",
          }[sizeKey as "small" | "medium" | "large"] || "px-4 py-2";

        const buttonsPerRow = isMobile
          ? buttonsContent.mobile_buttons_per_row || buttonsContent.buttons_per_row
          : buttonsContent.buttons_per_row;

        const gridCols =
          {
            1: "grid-cols-1",
            2: "grid-cols-2",
            3: "grid-cols-3",
            4: "grid-cols-4",
          }[buttonsPerRow as 1 | 2 | 3 | 4] || "grid-cols-2";

        const buttonStyle = buttonsContent.button_style;

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <div className={`grid ${gridCols} w-full`} style={{ gap: `${buttonsContent.gap || 12}px` }}>
              {buttonsContent.buttons.map((button) => {
                const action = normaliseMenuItemAction(button);
                const disabled = isItemDisabled(action);

                return (
                  <button
                    key={button.id}
                    disabled={disabled}
                    className={cn(
                      sizeClass,
                      "rounded-lg font-medium transition-all active:scale-[0.98]",
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : buttonStyle === "ghost"
                          ? "hover:bg-black/5 cursor-pointer"
                          : "hover:opacity-90 cursor-pointer"
                    )}
                    style={{
                      backgroundColor: buttonStyle === "solid" ? button.button_color : "transparent",
                      color: buttonStyle === "ghost" ? button.button_color || button.text_color : button.text_color,
                      border: buttonStyle === "outline" ? `2px solid ${button.button_color}` : "none",
                    }}
                    onClick={() => activate(button, "button")}
                    title={disabled && !isTourReady ? "Loading tour..." : button.label}
                  >
                    {button.label}
                    {disabled && !isTourReady && (
                      <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      case "logo": {
        const logoContent = block.content as LogoBlockContent;
        const logoDimensions = getLogoDimensions(logoContent);
        const logoAlignment = block.alignment === "left" ? "flex-start" : block.alignment === "right" ? "flex-end" : "center";

        if (!logoContent.image_url) return null;

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <div style={{ width: "100%", display: "flex", justifyContent: logoAlignment }}>
              <img
                src={logoContent.image_url}
                alt={logoContent.alt_text || "Logo"}
                style={{
                  width: `${logoDimensions.width}px`,
                  height: "auto",
                  maxWidth: "100%",
                  display: "block",
                  objectFit: "contain",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            </div>
          </div>
        );
      }

      case "table": {
        const tableContent = block.content as TableBlockContent;
        if (!tableContent.headers || !Array.isArray(tableContent.headers) || tableContent.headers.length === 0) {
          return null;
        }

        return (
          <div key={block.id} className={alignmentClass} style={marginStyle}>
            <table
              className="w-full border-collapse overflow-hidden rounded-lg"
              style={{
                borderColor: tableContent.border_color || "#E5E7EB",
                fontSize: `${tableContent.text_size || 14}px`,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: tableContent.header_background || "#F3F4F6" }}>
                  {tableContent.headers.map((header, index) => (
                    <th
                      key={index}
                      className="border px-4 py-2 font-semibold"
                      style={{ borderColor: tableContent.border_color || "#E5E7EB" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.isArray(tableContent.rows) &&
                  tableContent.rows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {Array.isArray(row) &&
                        row.map((cell, colIndex) => (
                          <td
                            key={colIndex}
                            className="border px-4 py-2"
                            style={{ borderColor: tableContent.border_color || "#E5E7EB" }}
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
      }

      case "nav_list": {
        const navContent = block.content as NavListBlockContent;
        const items = Array.isArray(navContent.items) ? navContent.items : [];
        if (items.length === 0) return null;
        const navStyles = getEffectiveNavStyles(
          navContent as any,
          isMobile ? "mobile" : "desktop"
        );

        return (
          <div key={block.id} style={marginStyle}>
            <nav className="-mx-1 flex flex-col">
              {items.map((item) => renderNavItem(item, navStyles))}
            </nav>
          </div>
        );
      }

      case "spacer": {
        const spacerContent = block.content as { height: number };
        const spacerHeight = spacerContent.height || 24;
        const safeHeight = Math.min(Math.max(spacerHeight, 0), 200);
        return <div key={block.id} style={{ height: `${safeHeight}px` }} />;
      }

      default:
        return null;
    }
  };

  const sortedBlocks = [...blocks].sort((a, b) => a.display_order - b.display_order);

  const blocksContent =
    sortedBlocks.length === 0 && mode === "preview" ? (
      <div className="py-12 text-center text-slate-400">
        <p className="mb-1 text-sm font-medium text-slate-500">No content yet</p>
        <p className="text-xs">Use a quick-start template or add blocks on the left</p>
      </div>
    ) : (
      sortedBlocks.map((block) => renderBlock(block))
    );

  const scrimOpacity = isPanelChrome ? 0.18 : 0.5;
  const panelPadding = {
    paddingLeft: `${chrome.padding}px`,
    paddingRight: `${chrome.padding}px`,
    // Use nullish coalescing — 0 is a valid intentional value.
    paddingTop: `${chrome.paddingVertical ?? 16}px`,
    paddingBottom: `${chrome.paddingVertical ?? 16}px`,
  };

  if (isPanelChrome) {
    const panelWidth = `${chrome.drawerWidth}px`;
    const panelRadius =
      chrome.anchorSide === "left"
        ? `0 ${chrome.borderRadius}px ${chrome.borderRadius}px 0`
        : `${chrome.borderRadius}px 0 0 ${chrome.borderRadius}px`;
    const edgeBorder =
      chrome.anchorSide === "left"
        ? { borderRight: "1px solid rgba(15, 23, 42, 0.06)" }
        : { borderLeft: "1px solid rgba(15, 23, 42, 0.06)" };

    return (
      <div className="absolute inset-0 z-[9999]">
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `rgba(15, 23, 42, ${scrimOpacity})`,
            backdropFilter: chrome.backdropBlur ? "blur(3px)" : "none",
          }}
          onClick={() => onClose("backdrop")}
        />
        <div className={cn("absolute inset-0 flex", chrome.anchorSide === "left" ? "justify-start" : "justify-end")}>
          <div
            className={cn("relative flex h-full flex-col overflow-hidden", getAnimationClass())}
            style={{
              width: panelWidth,
              maxWidth: "92vw",
              backgroundColor: chrome.backgroundColor,
              borderRadius: panelRadius,
              boxShadow: panelShadow,
              ...edgeBorder,
              ...panelFontStyle,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {closeOverlay}
            <div
              className="flex h-full flex-col overflow-y-auto"
              style={{ ...panelPadding, scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}
            >
              <div className="min-h-0 flex-1 space-y-0">{blocksContent}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[9999]">
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(15, 23, 42, ${scrimOpacity})`,
          backdropFilter: chrome.backdropBlur ? "blur(4px)" : "none",
        }}
        onClick={() => onClose("backdrop")}
      />
      <div className={cn("absolute inset-0 flex", getModalPositionClass())}>
        <div
          className={cn("relative mx-auto flex max-h-[85%] w-[90%] flex-col overflow-hidden", getAnimationClass())}
          style={{
            maxWidth: `${chrome.maxWidth}px`,
            backgroundColor: chrome.backgroundColor,
            borderRadius: `${chrome.borderRadius}px`,
            boxShadow: panelShadow,
            border: "1px solid rgba(15, 23, 42, 0.06)",
            ...panelFontStyle,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {closeOverlay}
          <div
            className="overflow-y-auto"
            style={{ ...panelPadding, scrollbarWidth: "thin", scrollbarColor: "#CBD5E1 transparent" }}
          >
            <div className="space-y-0">{blocksContent}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
