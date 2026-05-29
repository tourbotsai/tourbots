export type LegacySendButtonSize = 'small' | 'medium' | 'large';

export const SEND_BUTTON_SIZE_MIN = 28;
export const SEND_BUTTON_SIZE_MAX = 56;
export const SEND_BUTTON_SIZE_DEFAULT = 36;

export function mapLegacySendButtonSizeToPx(
  size: LegacySendButtonSize | string | null | undefined
): number {
  const normalised = (size || 'medium').toLowerCase();
  if (normalised === 'small') return 32;
  if (normalised === 'large') return 48;
  return SEND_BUTTON_SIZE_DEFAULT;
}

export function clampSendButtonSizePx(value: number): number {
  if (!Number.isFinite(value)) {
    return SEND_BUTTON_SIZE_DEFAULT;
  }
  return Math.min(SEND_BUTTON_SIZE_MAX, Math.max(SEND_BUTTON_SIZE_MIN, Math.round(value)));
}

export function resolveSendButtonSizePx(params: {
  pxValue?: number | null;
  legacySize?: LegacySendButtonSize | string | null;
}): number {
  if (Number.isFinite(params.pxValue)) {
    return clampSendButtonSizePx(Number(params.pxValue));
  }
  return clampSendButtonSizePx(mapLegacySendButtonSizeToPx(params.legacySize));
}

// Icon scales proportionally with the button (≈45%), clamped to a legible range.
export function sendButtonIconSizePx(buttonPx: number): number {
  return Math.min(28, Math.max(12, Math.round(buttonPx * 0.45)));
}
