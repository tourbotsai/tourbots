/**
 * Shadow Calculator Utility
 * Handles all shadow calculations for chatbot preview components
 */

export type ShadowIntensity = 'none' | 'light' | 'medium' | 'heavy';

/**
 * Calculate chat button shadow based on enabled state and intensity
 */
export const calculateChatButtonShadow = (
  shadowEnabled: boolean,
  shadowIntensity: ShadowIntensity = 'medium'
): string => {
  if (!shadowEnabled || shadowIntensity === 'none') {
    return 'none';
  }

  const shadows = {
    light: '0px 2px 8px rgba(0, 0, 0, 0.1)',
    medium: '0px 4px 12px rgba(0, 0, 0, 0.15)',
    heavy: '0px 8px 24px rgba(0, 0, 0, 0.25)'
  };

  return shadows[shadowIntensity];
};

/**
 * Calculate chat window shadow based on intensity
 */
export const calculateChatWindowShadow = (
  shadowIntensity: ShadowIntensity = 'medium'
): string => {
  if (shadowIntensity === 'none') {
    return 'none';
  }

  const shadows = {
    light: '0px 4px 16px rgba(0, 0, 0, 0.1)',
    medium: '0px 8px 32px rgba(0, 0, 0, 0.15)',
    heavy: '0px 16px 48px rgba(0, 0, 0, 0.25)'
  };

  return shadows[shadowIntensity];
};

/**
 * Calculate message shadow based on enabled state
 */
export const calculateMessageShadow = (
  shadowEnabled: boolean
): string => {
  if (!shadowEnabled) {
    return 'none';
  }

  return '0px 1px 3px rgba(0, 0, 0, 0.1)';
};

/**
 * Calculate button hover effect styles
 */
export const calculateButtonHoverEffect = (
  effect: 'scale' | 'glow' | 'lift' | 'none'
): { transform?: string; boxShadow?: string; transition?: string } => {
  const baseTransition = 'all 0.2s ease-in-out';

  switch (effect) {
    case 'scale':
      return {
        transform: 'scale(1.05)',
        transition: baseTransition
      };
    case 'glow':
      return {
        boxShadow: '0px 0px 20px rgba(24, 144, 255, 0.4)',
        transition: baseTransition
      };
    case 'lift':
      return {
        transform: 'translateY(-2px)',
        boxShadow: '0px 6px 20px rgba(0, 0, 0, 0.2)',
        transition: baseTransition
      };
    case 'none':
    default:
      return {
        transition: baseTransition
      };
  }
}; 