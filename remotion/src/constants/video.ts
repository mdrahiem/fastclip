/**
 * Typography and layout constants for polished video output
 */

export const TYPOGRAPHY_CONFIG = {
  // Font sizes by role
  fontSize: {
    hook: 56,
    cta: 44,
    body: 36,
    label: 28,
  },

  // Font weights for hierarchy
  fontWeight: {
    hook: 700, // Bold
    cta: 600, // Semi-bold
    body: 500, // Regular
    label: 600, // Semi-bold
  },

  // Line heights for readability
  lineHeight: {
    tight: 1.2,
    normal: 1.3,
    loose: 1.5,
  },

  // Default to use for all text
  defaultLineHeight: 1.3,
};

export const LAYOUT_CONFIG = {
  // Video dimensions
  slideWidth: 1080,
  slideHeight: 1920,

  // Safe zones (distance from edges to prevent text cutoff)
  safeZone: {
    left: 60,
    right: 60,
    top: 80,
    bottom: 80,
  },

  // Minimum spacing between text elements
  minTextSpacing: 24,

  // Minimum and maximum font sizes
  minFontSize: 24,
  maxFontSize: 72,
};

export const ANIMATION_CONFIG = {
  // Text entrance animation timing
  textFadeDuration: 12, // frames (400ms at 30fps)
  textStaggerDelay: 6, // frames (180ms at 30fps)

  // Slide transition timing
  slideTransitionDuration: 10, // frames (350ms at 30fps)
  slideFadeInDuration: 10, // frames (350ms at 30fps)

  // FPS constant
  fps: 30,
};

/**
 * Calculate readable safe width based on safe zones
 */
export function getSafeWidth(): number {
  return LAYOUT_CONFIG.slideWidth - LAYOUT_CONFIG.safeZone.left - LAYOUT_CONFIG.safeZone.right;
}

/**
 * Calculate readable safe height based on safe zones
 */
export function getSafeHeight(): number {
  return LAYOUT_CONFIG.slideHeight - LAYOUT_CONFIG.safeZone.top - LAYOUT_CONFIG.safeZone.bottom;
}

/**
 * Get font size for a given role
 */
export function getFontSize(role: "hook" | "cta" | "body" | "label"): number {
  return TYPOGRAPHY_CONFIG.fontSize[role];
}

/**
 * Get font weight for a given role
 */
export function getFontWeight(role: "hook" | "cta" | "body" | "label"): number {
  return TYPOGRAPHY_CONFIG.fontWeight[role];
}
