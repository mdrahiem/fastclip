import { describe, expect, it } from "vitest";
import {
  assertSlideCount,
  extractJsonObjectFromModelText,
  parseSlidePlanJson,
  SlidePlanValidationError,
} from "./validate-slide-plan";

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

  it("accepts slidePlanVersion as string \"1\" and stringy indices", () => {
    const raw = `{
      "slidePlanVersion": "1",
      "slides": [
        { "index": "0", "layers": [{ "type": "text", "role": "hook", "text": "Hi", "region": "center" }] },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "Mid", "region": "center" }] },
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "Bye", "region": "bottom" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slidePlanVersion).toBe(1);
    expect(plan.slides[0]?.index).toBe(0);
  });

  it("strips markdown json fences", () => {
    const inner = validMinimal.trim();
    const fenced = "Here is the plan:\n```json\n" + inner + "\n```\n";
    const plan = parseSlidePlanJson(fenced);
    expect(plan.slides).toHaveLength(3);
  });
});

describe("extractJsonObjectFromModelText", () => {
  it("extracts object from prose and fences", () => {
    const s = extractJsonObjectFromModelText(
      'Ok\n```json\n{"a":1}\n```\ntrailing',
    );
    expect(JSON.parse(s)).toEqual({ a: 1 });
  });
});

describe("assertSlideCount", () => {
  it("throws when counts mismatch", () => {
    const plan = parseSlidePlanJson(validMinimal);
    expect(() => assertSlideCount(plan, 2)).toThrow(SlidePlanValidationError);
  });
});
