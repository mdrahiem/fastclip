/**
 * Hook for calculating optimal text layout in Remotion videos
 * Handles text measurement, sizing, and positioning to prevent overlaps
 */

import { useMemo } from "react";
import {
  measureText,
  calculatePosition,
  type TextMetrics,
  type LayoutPosition,
} from "../utils/textMeasurement";

export interface TextLayoutConfig {
  /** Text content to measure */
  text: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font family name */
  fontFamily: string;
  /** Line height multiplier (e.g., 1.2) */
  lineHeight: number;
  /** Maximum width in pixels */
  maxWidth: number;
  /** Minimum font size floor (pixels) */
  minFontSize?: number;
}

export interface TextLayout {
  /** Adjusted font size after measurement */
  fontSize: number;
  /** Calculated text metrics */
  metrics: TextMetrics;
  /** Whether the text fits at original or adjusted size */
  isFitting: boolean;
}

/**
 * Hook to calculate optimal text layout
 * Ensures text doesn't overflow and is readable
 */
export function useTextLayout({
  text,
  fontSize,
  fontFamily,
  lineHeight,
  maxWidth,
  minFontSize = 24,
}: TextLayoutConfig): TextLayout {
  return useMemo(() => {
    const metrics = measureText({
      text,
      fontSize,
      fontFamily,
      lineHeight,
      maxWidth,
      minFontSize,
    });

    return {
      fontSize: metrics.adjustedFontSize,
      metrics,
      isFitting: metrics.fits,
    };
  }, [text, fontSize, fontFamily, lineHeight, maxWidth, minFontSize]);
}

export interface MultiTextLayoutConfig {
  /** Array of text items to measure */
  texts: string[];
  /** Font sizes for each text (if different) */
  fontSizes: number[];
  /** Font families for each text (if different) */
  fontFamilies: string[];
  /** Line height multiplier */
  lineHeight: number;
  /** Maximum width in pixels */
  maxWidth: number;
  /** Container height for positioning */
  containerHeight: number;
  /** Region to position text in */
  region: "top" | "center" | "bottom";
  /** Minimum spacing between text elements */
  minSpacing?: number;
  /** Top margin for safe area */
  topMargin?: number;
  /** Bottom margin for safe area */
  bottomMargin?: number;
  /** Minimum font size floor */
  minFontSize?: number;
}

export interface MultiTextLayout {
  /** Array of layouts for each text item */
  layouts: TextLayout[];
  /** Position information for the group */
  position: LayoutPosition;
  /** Total height needed for all text */
  totalHeight: number;
}

/**
 * Hook for laying out multiple text elements
 * Calculates sizing and positioning for all elements to prevent overlaps
 */
export function useMultiTextLayout({
  texts,
  fontSizes,
  fontFamilies,
  lineHeight,
  maxWidth,
  containerHeight,
  region,
  minSpacing = 24,
  topMargin = 80,
  bottomMargin = 80,
  minFontSize = 24,
}: MultiTextLayoutConfig): MultiTextLayout {
  return useMemo(() => {
    const layouts = texts.map((text, i) => {
      const layout = useTextLayout({
        text,
        fontSize: fontSizes[i] ?? 36,
        fontFamily: fontFamilies[i] ?? "system-ui",
        lineHeight,
        maxWidth,
        minFontSize,
      });
      return layout;
    });

    const metrics = layouts.map((l) => l.metrics);

    const position = calculatePosition({
      textMetrics: metrics,
      region,
      containerHeight,
      containerWidth: maxWidth,
      minSpacing,
      topMargin,
      bottomMargin,
    });

    const totalHeight = metrics.reduce((sum, m) => sum + m.estimatedHeight, 0);

    return {
      layouts,
      position,
      totalHeight,
    };
  }, [
    texts,
    fontSizes,
    fontFamilies,
    lineHeight,
    maxWidth,
    containerHeight,
    region,
    minSpacing,
    topMargin,
    bottomMargin,
    minFontSize,
  ]);
}
