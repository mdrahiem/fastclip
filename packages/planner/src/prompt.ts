import type { VideoTemplate } from "@video-gen/contracts";

export function buildPlannerSystemPrompt(template: VideoTemplate): string {
  return [
    "You convert LinkedIn-style posts into a SlidePlan JSON object for motion graphics.",
    "Return JSON ONLY. No markdown fences. No commentary.",
    "Language: English only for all generated on-screen text.",
    `The SlidePlan MUST set slidePlanVersion to 1 (JSON number or string "1" is fine).`,
    `The slides array MUST contain exactly ${template.slideCount} slides.`,
    `Each slide "index" MUST be a JSON number: 0, 1, …, ${template.slideCount - 1} in order.`,
    "Each slide must include at least one text layer.",
    `Text layers MUST include type "text", role (hook|body|cta|label), region (top|center|bottom), and "text" as the string property for what appears on screen.`,
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
