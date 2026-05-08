export type AspectRatioId = "9:16" | "16:9";

export type VideoTemplate = {
  id: "linkedin-three-beat-v1";
  label: string;
  description: string;
  slideCount: number;
  /** Seconds per slide; length must equal slideCount */
  slideDurationsSec: number[];
};

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  {
    id: "linkedin-three-beat-v1",
    label: "Three-beat post recap",
    description: "Hook, supporting insight, CTA—three slides, fixed pacing.",
    slideCount: 3,
    slideDurationsSec: [5, 5, 5],
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
