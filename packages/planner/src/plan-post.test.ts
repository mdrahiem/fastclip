import { describe, expect, it } from "vitest";
import { finalizePlanFromModelJson, PlannerError } from "./plan-post.js";

const raw = `{
  "slidePlanVersion": 1,
  "slides": [
    { "index": 0, "layers": [{ "type": "text", "role": "hook", "text": "Hook", "region": "center" }] },
    { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "Body", "region": "center" }] },
    { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "CTA", "region": "bottom" }] }
  ]
}`;

describe("finalizePlanFromModelJson", () => {
  it("parses and enforces slide count for template", () => {
    const plan = finalizePlanFromModelJson(raw, "linkedin-three-beat-v1");
    expect(plan.slides).toHaveLength(3);
  });

  it("throws PlannerError on bad json", () => {
    expect(() =>
      finalizePlanFromModelJson("{", "linkedin-three-beat-v1"),
    ).toThrow(PlannerError);
  });
});
