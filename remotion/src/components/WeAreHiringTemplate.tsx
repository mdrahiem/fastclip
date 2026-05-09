import type { CSSProperties } from "react";
import { AbsoluteFill } from "remotion";
import type { ThemePack } from "@video-gen/contracts";
import { useWeAreHiringAnimation } from "../hooks/useWeAreHiringAnimation";
import {
  DEFAULT_SAFE_ZONES,
  clampToSafeZone,
} from "../utils/textMeasurement";
import { LAYOUT_CONFIG } from "../constants/video";

type WeAreHiringTemplateProps = {
  positions: [string, string, string, string]; // Exactly 4 positions
  theme: ThemePack;
};

const SLIDE_WIDTH = LAYOUT_CONFIG.slideWidth;
const SLIDE_HEIGHT = LAYOUT_CONFIG.slideHeight;
const SAFE_ZONE = DEFAULT_SAFE_ZONES["9:16"];

/**
 * "We Are Hiring" template
 * Single slide with header + 4 staggered bullet points
 * Yellow background with black text and gray bullets
 */
export function WeAreHiringTemplate({
  positions,
  theme,
}: WeAreHiringTemplateProps) {
  const headerAnimation = useWeAreHiringAnimation({
    bulletIndex: 0,
    totalBullets: 4,
    headerStartFrame: 0,
    bulletStartDelay: 12, // Header fades for 12 frames, then delay
    bulletStaggerDelay: 6, // 180ms between each bullet (6 frames at 30fps)
    fadeDuration: 12, // 400ms fade duration
  });

  const bulletAnimations = positions.map((_, index) =>
    useWeAreHiringAnimation({
      bulletIndex: index,
      totalBullets: 4,
      headerStartFrame: 12,
      bulletStartDelay: 12,
      bulletStaggerDelay: 6,
      fadeDuration: 12,
    })
  );

  const maxWidth = clampToSafeZone(SLIDE_WIDTH, SAFE_ZONE);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#F3C41A", // Yellow background
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Header: "WE'RE HIRING!" */}
      <div
        style={{
          opacity: headerAnimation.headerOpacity,
          marginBottom: 120,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 88,
            fontWeight: 900,
            color: "#000000",
            margin: 0,
            fontFamily: "Inter, sans-serif",
            letterSpacing: "-2px",
          }}
        >
          WE'RE HIRING!
        </h1>
      </div>

      {/* Bullet Points Container */}
      <div
        style={{
          width: maxWidth,
          display: "flex",
          flexDirection: "column",
          gap: 48,
        }}
      >
        {positions.map((position, index) => {
          const anim = bulletAnimations[index]!;
          return (
            <BulletPoint
              key={index}
              text={position}
              opacity={anim.bulletOpacity}
              translateY={anim.bulletY}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
}

function BulletPoint({
  text,
  opacity,
  translateY,
}: {
  text: string;
  opacity: number;
  translateY: number;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        opacity,
        transform: `translateY(${translateY}px)`,
      } as CSSProperties}
    >
      {/* Circular Bullet */}
      <div
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          backgroundColor: "#666666",
          flexShrink: 0,
        }}
      />

      {/* Job Title Text */}
      <span
        style={{
          fontSize: 48,
          fontWeight: 700,
          color: "#000000",
          fontFamily: "Inter, sans-serif",
          lineHeight: 1.3,
          letterSpacing: "-0.5px",
        }}
      >
        {text}
      </span>
    </div>
  );
}
