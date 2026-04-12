/**
 * Animation Timing Utility
 * Handles all animation timing calculations and speed conversions
 */

export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type AnimationType = 'slide-up' | 'slide-down' | 'fade-in' | 'scale-up' | 'none';
export type MessageAnimationType = 'fade-in' | 'slide-in' | 'scale-in' | 'none';
export type IdleAnimationType = 'bounce' | 'pulse' | 'shake' | 'glow' | 'none';
export type TypingIndicatorType = 'dots' | 'wave' | 'pulse' | 'none';

/**
 * Convert animation speed to duration in milliseconds
 */
export const getAnimationDuration = (speed: AnimationSpeed): number => {
  const durations = {
    slow: 800,
    normal: 500,
    fast: 300
  };
  return durations[speed];
};

/**
 * Convert animation speed to CSS timing
 */
export const getAnimationTiming = (speed: AnimationSpeed): string => {
  const timings = {
    slow: '0.8s ease-in-out',
    normal: '0.5s ease-in-out',
    fast: '0.3s ease-in-out'
  };
  return timings[speed];
};

/**
 * Get CSS animation name for entrance animations
 */
export const getEntranceAnimationClass = (
  animation: AnimationType,
  speed: AnimationSpeed
): string => {
  if (animation === 'none') return '';
  
  const speedSuffix = speed === 'slow' ? '-slow' : speed === 'fast' ? '-fast' : '';
  return `animate-${animation}${speedSuffix}`;
};

/**
 * Get CSS animation name for message animations
 */
export const getMessageAnimationClass = (
  animation: MessageAnimationType,
  speed: AnimationSpeed
): string => {
  if (animation === 'none') return '';
  
  const speedSuffix = speed === 'slow' ? '-slow' : speed === 'fast' ? '-fast' : '';
  return `animate-message-${animation}${speedSuffix}`;
};

/**
 * Get CSS animation name for idle animations
 */
export const getIdleAnimationClass = (
  animation: IdleAnimationType,
  speed: AnimationSpeed
): string => {
  if (animation === 'none') return '';
  
  const speedSuffix = speed === 'slow' ? '-slow' : speed === 'fast' ? '-fast' : '';
  return `animate-idle-${animation}${speedSuffix}`;
};

/**
 * Get typing indicator animation delay based on speed
 */
export const getTypingIndicatorDelay = (
  speed: AnimationSpeed,
  index: number
): string => {
  const baseDelays = {
    slow: 0.3,
    normal: 0.2,
    fast: 0.1
  };
  
  return `${baseDelays[speed] * index}s`;
};

/**
 * Calculate animation interval in milliseconds
 */
export const calculateAnimationInterval = (
  baseInterval: number,
  speed: AnimationSpeed
): number => {
  const multipliers = {
    slow: 1.5,
    normal: 1,
    fast: 0.7
  };
  
  return Math.round(baseInterval * multipliers[speed]);
};

/**
 * Get CSS transform for entrance animations
 */
export const getEntranceTransform = (animation: AnimationType): string => {
  switch (animation) {
    case 'slide-up':
      return 'translateY(20px)';
    case 'slide-down':
      return 'translateY(-20px)';
    case 'fade-in':
      return 'opacity: 0';
    case 'scale-up':
      return 'scale(0.9)';
    default:
      return '';
  }
};

/**
 * Generate keyframes for custom animations
 */
export const generateCustomKeyframes = (): string => {
  return `
    @keyframes animate-slide-up {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes animate-slide-down {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes animate-scale-up {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes animate-message-fade-in {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes animate-message-slide-in {
      from { transform: translateX(-10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes animate-message-scale-in {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes animate-idle-bounce {
      0% { transform: translateY(0); }
      15% { transform: translateY(-20px); }
      30% { transform: translateY(0); }
      45% { transform: translateY(-12px); }
      60% { transform: translateY(0); }
      75% { transform: translateY(-6px); }
      90% { transform: translateY(0); }
      100% { transform: translateY(0); }
    }
    
    @keyframes animate-idle-pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    @keyframes animate-idle-shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
      20%, 40%, 60%, 80% { transform: translateX(3px); }
    }
    
    @keyframes animate-idle-glow {
      0%, 100% { box-shadow: 0 0 5px rgba(24, 144, 255, 0.3); }
      50% { box-shadow: 0 0 20px rgba(24, 144, 255, 0.6); }
    }
    
    /* Speed variations */
    .animate-slide-up-slow { animation: animate-slide-up 0.8s ease-in-out; }
    .animate-slide-up { animation: animate-slide-up 0.5s ease-in-out; }
    .animate-slide-up-fast { animation: animate-slide-up 0.3s ease-in-out; }
    
    .animate-slide-down-slow { animation: animate-slide-down 0.8s ease-in-out; }
    .animate-slide-down { animation: animate-slide-down 0.5s ease-in-out; }
    .animate-slide-down-fast { animation: animate-slide-down 0.3s ease-in-out; }
    
    .animate-scale-up-slow { animation: animate-scale-up 0.8s ease-in-out; }
    .animate-scale-up { animation: animate-scale-up 0.5s ease-in-out; }
    .animate-scale-up-fast { animation: animate-scale-up 0.3s ease-in-out; }
    
    .animate-message-fade-in-slow { animation: animate-message-fade-in 0.8s ease-in-out; }
    .animate-message-fade-in { animation: animate-message-fade-in 0.5s ease-in-out; }
    .animate-message-fade-in-fast { animation: animate-message-fade-in 0.3s ease-in-out; }
    
    .animate-message-slide-in-slow { animation: animate-message-slide-in 0.8s ease-in-out; }
    .animate-message-slide-in { animation: animate-message-slide-in 0.5s ease-in-out; }
    .animate-message-slide-in-fast { animation: animate-message-slide-in 0.3s ease-in-out; }
    
    .animate-message-scale-in-slow { animation: animate-message-scale-in 0.8s ease-in-out; }
    .animate-message-scale-in { animation: animate-message-scale-in 0.5s ease-in-out; }
    .animate-message-scale-in-fast { animation: animate-message-scale-in 0.3s ease-in-out; }
    
    .animate-idle-bounce-slow { animation: animate-idle-bounce 2s; }
    .animate-idle-bounce { animation: animate-idle-bounce 1.5s; }
    .animate-idle-bounce-fast { animation: animate-idle-bounce 1s; }
    
    .animate-idle-pulse-slow { animation: animate-idle-pulse 3s; }
    .animate-idle-pulse { animation: animate-idle-pulse 2s; }
    .animate-idle-pulse-fast { animation: animate-idle-pulse 1.5s; }
    
    .animate-idle-shake-slow { animation: animate-idle-shake 1s; }
    .animate-idle-shake { animation: animate-idle-shake 0.7s; }
    .animate-idle-shake-fast { animation: animate-idle-shake 0.5s; }
    
    .animate-idle-glow-slow { animation: animate-idle-glow 3s; }
    .animate-idle-glow { animation: animate-idle-glow 2s; }
    .animate-idle-glow-fast { animation: animate-idle-glow 1.5s; }
  `;
}; 