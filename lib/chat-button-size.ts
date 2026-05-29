export type LegacyChatButtonSize = 'small' | 'medium' | 'large';

export function mapLegacyChatButtonSizeToPx(
  size: LegacyChatButtonSize | string | null | undefined,
  mode: 'desktop' | 'mobile'
): number {
  const normalised = (size || 'medium').toLowerCase();
  if (mode === 'mobile') {
    if (normalised === 'small') return 48;
    if (normalised === 'large') return 80;
    return 60;
  }

  if (normalised === 'small') return 64;
  if (normalised === 'large') return 104;
  return 80;
}

export function clampChatButtonSizePx(value: number, mode: 'desktop' | 'mobile'): number {
  if (!Number.isFinite(value)) {
    return mode === 'mobile' ? 60 : 80;
  }

  const min = mode === 'mobile' ? 40 : 48;
  const max = mode === 'mobile' ? 104 : 128;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function resolveChatButtonSizePx(params: {
  pxValue?: number | null;
  legacySize?: LegacyChatButtonSize | string | null;
  mode: 'desktop' | 'mobile';
}): number {
  if (Number.isFinite(params.pxValue)) {
    return clampChatButtonSizePx(Number(params.pxValue), params.mode);
  }

  return clampChatButtonSizePx(mapLegacyChatButtonSizeToPx(params.legacySize, params.mode), params.mode);
}
