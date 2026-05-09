import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import type { Layer, Slide as SlideModel, ThemePack } from "@video-gen/contracts";
import { useTextLayout } from "../hooks/useTextLayout";
import { useTextAnimation } from "../hooks/useTextAnimation";
import {
  DEFAULT_SAFE_ZONES,
  clampToSafeZone,
} from "../utils/textMeasurement";
import {
  TYPOGRAPHY_CONFIG,
  LAYOUT_CONFIG,
  getFontSize,
  getFontWeight,
} from "../constants/video";

type SlideProps = {
  slide: SlideModel;
  theme: ThemePack;
};

// Video dimensions (9:16 portrait format)
const SLIDE_WIDTH = LAYOUT_CONFIG.slideWidth;
const SLIDE_HEIGHT = LAYOUT_CONFIG.slideHeight;

// Safe zones to prevent text cutoff on device bezels
const SAFE_ZONE = DEFAULT_SAFE_ZONES["9:16"];

function regionLayout(region: Layer["region"]): CSSProperties {
  switch (region) {
    case "top":
      return { top: SAFE_ZONE.top, left: SAFE_ZONE.left, right: SAFE_ZONE.right };
    case "bottom":
      return { bottom: SAFE_ZONE.bottom, left: SAFE_ZONE.left, right: SAFE_ZONE.right };
    default:
      return { top: "50%", left: SAFE_ZONE.left, right: SAFE_ZONE.right, transform: "translateY(-50%)" };
  }
}

function TextLayerView({
  layer,
  theme,
  textLayerIndex = 0,
  totalTextLayers = 1,
}: {
  layer: Extract<Layer, { type: "text" }>;
  theme: ThemePack;
  textLayerIndex?: number;
  totalTextLayers?: number;
}) {
  const fontFamily =
    layer.role === "body" ? theme.fonts.body : theme.fonts.heading;
  const baseFontSize = getFontSize(layer.role as keyof typeof TYPOGRAPHY_CONFIG.fontSize);
  
  // Use the layout hook to calculate optimal font size and metrics
  const maxWidth = clampToSafeZone(SLIDE_WIDTH, SAFE_ZONE);
  const textLayout = useTextLayout({
    text: layer.text,
    fontSize: baseFontSize,
    fontFamily,
    lineHeight: TYPOGRAPHY_CONFIG.defaultLineHeight,
    maxWidth,
    minFontSize: LAYOUT_CONFIG.minFontSize,
  });

  // Use animation hook for entrance animation
  const textAnimation = useTextAnimation({
    textIndex: textLayerIndex,
    totalTexts: totalTextLayers,
    startFrame: 0,
    fadeDuration: 12, // 400ms at 30fps
    staggerDelay: 6, // 180ms stagger
  });

  const fontWeight = getFontWeight(layer.role as keyof typeof TYPOGRAPHY_CONFIG.fontWeight);

  return (
    <div
      style={{
        position: "absolute",
        ...regionLayout(layer.region),
        color: theme.colors.foreground,
        fontFamily,
        fontSize: textLayout.fontSize,
        fontWeight,
        lineHeight: TYPOGRAPHY_CONFIG.defaultLineHeight,
        textAlign: "center",
        whiteSpace: "pre-wrap",
        wordWrap: "break-word",
        overflowWrap: "break-word",
        // Prevent text from flowing outside safe zone
        maxWidth: `${maxWidth}px`,
        // Apply entrance animation
        opacity: textAnimation.opacity,
        // Ensure readability with proper letter spacing
        letterSpacing: "-0.5px",
      }}
    >
      {layer.text}
    </div>
  );
}

function ShapeLayerView({
  layer,
  theme,
}: {
  layer: Extract<Layer, { type: "shape" }>;
  theme: ThemePack;
}) {
  const color = layer.accent ? theme.colors.accent : theme.colors.muted;
  const base: CSSProperties = {
    position: "absolute",
    ...regionLayout(layer.region),
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  };

  if (layer.shape === "circle") {
    return (
      <div style={base}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            backgroundColor: color,
            opacity: 0.45,
          }}
        />
      </div>
    );
  }

  if (layer.shape === "rect") {
    return (
      <div style={base}>
        <div
          style={{
            width: 220,
            height: 120,
            borderRadius: 16,
            backgroundColor: color,
            opacity: 0.35,
          }}
        />
      </div>
    );
  }

  return (
    <div style={base}>
      <div
        style={{
          width: "70%",
          height: 6,
          borderRadius: 3,
          backgroundColor: color,
          opacity: 0.6,
        }}
      />
    </div>
  );
}

export function Slide({ slide, theme }: SlideProps) {
  // Get all text layers to calculate animation indices
  const textLayers = slide.layers.filter((layer) => layer.type === "text");

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.colors.background,
        fontFamily: theme.fonts.body,
      }}
    >
      {slide.layers.map((layer, i) => {
        const key = `${slide.index}-${i}-${layer.type}`;
        if (layer.type === "text") {
          // Find this text layer's index among all text layers (for staggered animation)
          const textLayerIndex = slide.layers
            .slice(0, i)
            .filter((l) => l.type === "text").length;
          return (
            <TextLayerView
              key={key}
              layer={layer}
              theme={theme}
              textLayerIndex={textLayerIndex}
              totalTextLayers={textLayers.length}
            />
          );
        }
        return <ShapeLayerView key={key} layer={layer} theme={theme} />;
      })}
    </AbsoluteFill>
  );
}
