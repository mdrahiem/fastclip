import { SlidePlanSchema, type SlidePlan } from "./slide-plan";

export class SlidePlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlidePlanValidationError";
  }
}

/**
 * Strips markdown fences and surrounding prose so `JSON.parse` sees one object.
 * OpenRouter / chat models often wrap the payload in ```json ... ```.
 */
export function extractJsonObjectFromModelText(raw: string): string {
  let s = raw.trim();
  if (!s) return s;

  const fenceBlock = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/im;
  const blockMatch = s.match(fenceBlock);
  if (blockMatch?.[1]) {
    s = blockMatch[1].trim();
  } else if (s.startsWith("```")) {
    s = s
      .replace(/^```(?:json)?\s*\n?/i, "")
      .replace(/\n?```\s*$/i, "")
      .trim();
  }

  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start >= 0 && end > start) {
    s = s.slice(start, end + 1);
  }

  return s.trim();
}

export function parseSlidePlanJson(raw: string): SlidePlan {
  const extracted = extractJsonObjectFromModelText(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch {
    throw new SlidePlanValidationError("Slide plan JSON could not be parsed.");
  }

  const result = SlidePlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new SlidePlanValidationError("Slide plan failed schema validation.");
  }

  return result.data;
}

export function assertSlideCount(plan: SlidePlan, expected: number): void {
  if (plan.slides.length !== expected) {
    throw new SlidePlanValidationError(
      `Expected ${expected} slides, received ${plan.slides.length}.`,
    );
  }

  for (let i = 0; i < plan.slides.length; i += 1) {
    if (plan.slides[i]?.index !== i) {
      throw new SlidePlanValidationError(`Slide index mismatch at position ${i}.`);
    }
  }
}
