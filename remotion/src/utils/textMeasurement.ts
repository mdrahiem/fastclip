/**
 * Text measurement utilities for Remotion video rendering
 * Calculates text dimensions to prevent overlapping and ensure proper sizing
 */

export interface TextMetrics {
  /** Estimated width the text will occupy at given font size */
  estimatedWidth: number;
  /** Estimated height the text will occupy at given font size */
  estimatedHeight: number;
  /** Whether the text fits within maxWidth */
  fits: boolean;
  /** Adjusted font size if text doesn't fit (or original if it does) */
  adjustedFontSize: number;
  /** Number of lines the text will break into */
  lineCount: number;
}

interface MeasureParams {
  text: string;
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  maxWidth: number;
  minFontSize?: number;
}

/**
 * Estimates text metrics by calculating character count, line breaks, and dimensions
 * Uses heuristic approach: character count * average character width
 */
export function measureText({
  text,
  fontSize,
  fontFamily,
  lineHeight,
  maxWidth,
  minFontSize = 24,
}: MeasureParams): TextMetrics {
  // Average character width varies by font family
  // These are rough estimates; serif fonts are wider, monospace varies
  const fontCharacterWidthMap: Record<string, number> = {
    // Default estimates
    system: 0.55,
    serif: 0.58,
    monospace: 0.6,
    sansserif: 0.52,
  };

  // Determine character width ratio based on font family
  let charWidthRatio = 0.55; // default
  const fontLower = fontFamily.toLowerCase();
  if (fontLower.includes("serif")) charWidthRatio = 0.58;
  if (fontLower.includes("mono")) charWidthRatio = 0.6;
  if (fontLower.includes("sans")) charWidthRatio = 0.52;

  // Estimate average character width at given font size
  const charWidth = fontSize * charWidthRatio;

  // Split text into lines and calculate metrics
  const lines = text.split("\n");
  let maxLineLength = 0;
  let totalChars = 0;

  for (const line of lines) {
    const lineLength = line.length;
    maxLineLength = Math.max(maxLineLength, lineLength);
    totalChars += lineLength;
  }

  // Calculate width based on longest line
  const estimatedWidth = maxLineLength * charWidth;

  // Check if text fits, if not, calculate adjusted font size
  let adjustedFontSize = fontSize;
  let fits = estimatedWidth <= maxWidth;

  if (!fits && minFontSize > 0) {
    // Scale down font size proportionally
    adjustedFontSize = Math.max(
      minFontSize,
      fontSize * (maxWidth / estimatedWidth) * 0.95, // 0.95 for safety margin
    );
    fits = adjustedFontSize >= minFontSize;
  }

  // Recalculate width with adjusted font size
  const finalWidth = (maxLineLength * fontSize * charWidthRatio * adjustedFontSize) / fontSize;

  // Calculate height based on line count
  const finalLineCount = lines.length;
  const estimatedHeight = finalLineCount * fontSize * lineHeight;

  return {
    estimatedWidth: Math.ceil(finalWidth),
    estimatedHeight: Math.ceil(estimatedHeight),
    fits,
    adjustedFontSize,
    lineCount: finalLineCount,
  };
}

/**
 * Calculates vertical spacing to center/position text layers
 * without overlapping when multiple text elements are present
 */
export interface LayoutPosition {
  /** Top position in pixels */
  top: number;
  /** Height available for text in pixels */
  availableHeight: number;
  /** Whether there's enough space for all elements */
  hasSpace: boolean;
}

interface CalculatePositionParams {
  textMetrics: TextMetrics[];
  region: "top" | "center" | "bottom";
  containerHeight: number;
  containerWidth: number;
  minSpacing?: number;
  topMargin?: number;
  bottomMargin?: number;
}

/**
 * Calculates optimal positions for multiple text layers
 * ensuring they don't overlap
 */
export function calculatePosition({
  textMetrics,
  region,
  containerHeight,
  containerWidth,
  minSpacing = 24,
  topMargin = 80,
  bottomMargin = 80,
}: CalculatePositionParams): LayoutPosition {
  const availableHeight = containerHeight - topMargin - bottomMargin;
  const totalTextHeight = textMetrics.reduce((sum, m) => sum + m.estimatedHeight, 0);
  const totalSpacing = Math.max(0, (textMetrics.length - 1) * minSpacing);
  const requiredHeight = totalTextHeight + totalSpacing;

  const hasSpace = requiredHeight <= availableHeight;

  let top = 0;
  switch (region) {
    case "top":
      top = topMargin;
      break;
    case "bottom":
      top = Math.max(topMargin, containerHeight - bottomMargin - requiredHeight);
      break;
    case "center":
    default:
      top = Math.max(topMargin, (containerHeight - requiredHeight) / 2);
      break;
  }

  return {
    top: Math.ceil(top),
    availableHeight,
    hasSpace,
  };
}

/**
 * Defines safe zones where text should be rendered to account for device bezels
 * and avoid cutoff on various devices
 */
export interface SafeZone {
  /** Minimum distance from left edge (pixels) */
  left: number;
  /** Minimum distance from right edge (pixels) */
  right: number;
  /** Minimum distance from top edge (pixels) */
  top: number;
  /** Minimum distance from bottom edge (pixels) */
  bottom: number;
}

/**
 * Default safe zones for different aspect ratios
 */
export const DEFAULT_SAFE_ZONES: Record<string, SafeZone> = {
  "9:16": {
    left: 60,
    right: 60,
    top: 80,
    bottom: 80,
  },
  "16:9": {
    left: 80,
    right: 80,
    top: 60,
    bottom: 60,
  },
};

/**
 * Clamps text width to safe zone boundaries
 */
export function clampToSafeZone(
  containerWidth: number,
  safeZone: SafeZone,
): number {
  return containerWidth - safeZone.left - safeZone.right;
}
