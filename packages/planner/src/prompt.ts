import type { VideoTemplate } from "@video-gen/contracts";

export function buildPlannerSystemPrompt(template: VideoTemplate): string {
  return [
    "You convert LinkedIn-style posts into a SlidePlan JSON object for motion graphics.",
    "Return JSON ONLY. No markdown fences. No commentary.",
    "Language: English only for all generated on-screen text.",
    `The SlidePlan MUST set slidePlanVersion to 1.`,
    `The slides array MUST contain exactly ${template.slideCount} slides.`,
    `Slide indexes MUST be 0..${template.slideCount - 1} in order.`,
    "Each slide must include at least one text layer.",
    "Text must be faithful to the post: do not invent facts or quotes.",
    "Keep text concise for large on-screen typography.",
    "Roles: slide 0 uses hook; middle slides use body; final slide uses cta.",
    "Optionally add simple shape layers for visual rhythm (circle/rect/line).",
    "Regions place content top/center/bottom within safe margins.",
  ].join("\n");
}

export function buildPlannerUserPrompt(postText: string): string {
  return [
    "LinkedIn post:",
    postText.trim(),
    "",
    "Produce SlidePlan JSON now.",
  ].join("\n");
}
