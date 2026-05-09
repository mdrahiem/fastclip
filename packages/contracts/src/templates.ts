export type AspectRatioId = "9:16" | "16:9";

export type TemplateId = "linkedin-three-beat-v1" | "we-are-hiring-v1";

export type VideoTemplate = {
  id: TemplateId;
  label: string;
  description: string;
  slideCount: number;
  /** Seconds per slide; length must equal slideCount */
  slideDurationsSec: number[];
  /** Aspect ratio required for this template */
  aspectRatio: AspectRatioId;
};

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: "linkedin-three-beat-v1",
    label: "Three-beat post recap",
    description: "Hook, supporting insight, CTA—three slides, fixed pacing.",
    slideCount: 3,
    slideDurationsSec: [5, 5, 5],
    aspectRatio: "16:9",
  },
  {
    id: "we-are-hiring-v1",
    label: "We Are Hiring",
    description: "Animated job listings with circular bullets and fade-in animations.",
    slideCount: 1,
    slideDurationsSec: [15],
    aspectRatio: "9:16",
  },
];

export const DEFAULT_VIDEO_TEMPLATE_ID = VIDEO_TEMPLATES[0]?.id;

export function getTemplateById(id: VideoTemplate["id"]): VideoTemplate {
  const found = VIDEO_TEMPLATES.find((t) => t.id === id);
  if (!found) {
    throw new Error(`Unknown template: ${id}`);
  }

  if (found.slideDurationsSec.length !== found.slideCount) {
    throw new Error(`Invalid template configuration for ${id}`);
  }

  return found;
}
