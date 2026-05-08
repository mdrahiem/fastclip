import { SlidePlanSchema, type SlidePlan } from "./slide-plan.js";

export class SlidePlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlidePlanValidationError";
  }
}

export function parseSlidePlanJson(raw: string): SlidePlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
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
