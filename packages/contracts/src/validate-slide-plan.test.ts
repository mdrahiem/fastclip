import { describe, expect, it } from "vitest";
import {
  parseSlidePlanJson,
  SlidePlanValidationError,
  assertSlideCount,
} from "./validate-slide-plan.js";

const validMinimal = `{
  "slidePlanVersion": 1,
  "slides": [
    { "index": 0, "layers": [{ "type": "text", "role": "hook", "text": "Hello", "region": "center" }] },
    { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "World", "region": "center" }] },
    { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "Follow", "region": "bottom" }] }
  ]
}`;

describe("parseSlidePlanJson", () => {
  it("accepts a minimal valid plan", () => {
    const plan = parseSlidePlanJson(validMinimal);
    expect(plan.slides).toHaveLength(3);
  });

  it("rejects invalid JSON", () => {
    expect(() => parseSlidePlanJson("{")).toThrow(SlidePlanValidationError);
  });
});

describe("assertSlideCount", () => {
  it("throws when counts mismatch", () => {
    const plan = parseSlidePlanJson(validMinimal);
    expect(() => assertSlideCount(plan, 2)).toThrow(SlidePlanValidationError);
  });
});
