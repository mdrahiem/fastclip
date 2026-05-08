import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import type { Layer, Slide as SlideModel, ThemePack } from "@video-gen/contracts";

type SlideProps = {
  slide: SlideModel;
  theme: ThemePack;
};

function regionLayout(region: Layer["region"]): CSSProperties {
  switch (region) {
    case "top":
      return { top: 72, left: 48, right: 48 };
    case "bottom":
      return { bottom: 72, left: 48, right: 48 };
    default:
      return { top: "50%", left: 48, right: 48, transform: "translateY(-50%)" };
  }
}

function TextLayerView({
  layer,
  theme,
}: {
  layer: Extract<Layer, { type: "text" }>;
  theme: ThemePack;
}) {
  const fontFamily =
    layer.role === "body" ? theme.fonts.body : theme.fonts.heading;
  const fontSize =
    layer.role === "hook" ? 56 : layer.role === "cta" ? 44 : 36;
  return (
    <div
      style={{
        position: "absolute",
        ...regionLayout(layer.region),
        color: theme.colors.foreground,
        fontFamily,
        fontSize,
        fontWeight: 600,
        lineHeight: 1.15,
        textAlign: "center",
        whiteSpace: "pre-wrap",
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
          return <TextLayerView key={key} layer={layer} theme={theme} />;
        }
        return <ShapeLayerView key={key} layer={layer} theme={theme} />;
      })}
    </AbsoluteFill>
  );
}
