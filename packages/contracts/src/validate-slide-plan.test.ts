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

  it("accepts omitted slidePlanVersion (defaults to 1)", () => {
    const raw = `{
      "slides": [
        { "index": 0, "layers": [{ "type": "text", "role": "hook", "text": "Hi", "region": "center" }] },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "Mid", "region": "center" }] },
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "Bye", "region": "bottom" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slidePlanVersion).toBe(1);
  });

  it("normalizes layer type casing and role aliases", () => {
    const raw = `{
      "slidePlanVersion": 1,
      "slides": [
        { "index": 0, "layers": [{ "type": "Text", "role": "Headline", "text": "A", "region": "CENTER" }] },
        { "index": 1, "layers": [{ "type": "text", "role": "insight", "text": "B", "region": "middle" }] },
        { "index": 2, "layers": [{ "type": "TEXT", "role": "closing", "text": "C", "region": "Bottom" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slides[0]?.layers[0]).toMatchObject({
      type: "text",
      role: "hook",
      region: "center",
    });
    expect(plan.slides[1]?.layers[0]).toMatchObject({
      role: "body",
      region: "center",
    });
    expect(plan.slides[2]?.layers[0]).toMatchObject({
      role: "cta",
      region: "bottom",
    });
  });

  it("sorts slides by index then renumbers", () => {
    const raw = `{
      "slidePlanVersion": 1,
      "slides": [
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "C", "region": "bottom" }] },
        { "index": 0, "layers": [{ "type": "text", "role": "hook", "text": "A", "region": "center" }] },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "B", "region": "center" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slides.map((s) => (s.layers[0] as { text?: string }).text)).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(plan.slides.map((s) => s.index)).toEqual([0, 1, 2]);
  });

  it("repairs trailing commas in JSON", () => {
    const raw = `{
      "slidePlanVersion": 1,
      "slides": [
        { "index": 0, "layers": [{ "type": "text", "role": "hook", "text": "Hi", "region": "center" }], },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "Mid", "region": "center" }], },
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "Bye", "region": "bottom" }], },
      ],
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slides).toHaveLength(3);
  });

  it("strips markdown json fences", () => {
    const inner = validMinimal.trim();
    const fenced = "Here is the plan:\n```json\n" + inner + "\n```\n";
    const plan = parseSlidePlanJson(fenced);
    expect(plan.slides).toHaveLength(3);
  });

  it("accepts nested slidePlan root and content instead of text", () => {
    const raw = `{
      "slidePlan": {
        "version": 1,
        "slides": [
          {
            "index": 0,
            "layers": [{ "role": "hook", "content": "Hook line", "region": "left" }]
          },
          {
            "index": 1,
            "layers": [{ "type": "text", "role": "body", "text": "Body", "region": "middle" }]
          },
          {
            "index": 2,
            "layers": [{ "type": "IMAGE", "role": "cta", "copy": "CTA here", "region": "lower" }]
          }
        ]
      }
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slidePlanVersion).toBe(1);
    expect(plan.slides).toHaveLength(3);
    expect(plan.slides[0]?.layers[0]).toMatchObject({
      type: "text",
      region: "center",
      text: "Hook line",
    });
    expect(plan.slides[2]?.layers[0]).toMatchObject({
      type: "text",
      text: "CTA here",
    });
  });

  it("wraps a single layer object in an array", () => {
    const raw = `{
      "slidePlanVersion": 1,
      "slides": [
        { "index": 0, "layers": { "type": "text", "role": "hook", "text": "A", "region": "center" } },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "B", "region": "center" }] },
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "C", "region": "bottom" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slides[0]?.layers).toHaveLength(1);
  });

  it("truncates meta.title beyond 120 chars", () => {
    const title = "x".repeat(200);
    const raw = JSON.stringify({
      slidePlanVersion: 1,
      meta: { title },
      slides: [
        { index: 0, layers: [{ type: "text", role: "hook", text: "A", region: "center" }] },
        { index: 1, layers: [{ type: "text", role: "body", text: "B", region: "center" }] },
        { index: 2, layers: [{ type: "text", role: "cta", text: "C", region: "bottom" }] },
      ],
    });
    const plan = parseSlidePlanJson(raw);
    expect(plan.meta?.title?.length).toBe(120);
  });

  it("accepts top-level JSON array of slides", () => {
    const slides = [
      { index: 0, layers: [{ type: "text", role: "hook", text: "A", region: "center" }] },
      { index: 1, layers: [{ type: "text", role: "body", text: "B", region: "center" }] },
      { index: 2, layers: [{ type: "text", role: "cta", text: "C", region: "bottom" }] },
    ];
    const plan = parseSlidePlanJson(JSON.stringify(slides));
    expect(plan.slidePlanVersion).toBe(1);
    expect(plan.slides).toHaveLength(3);
  });

  it("accepts slide_plan_version and slideList aliases", () => {
    const raw = `{
      "slide_plan_version": "1",
      "slideList": [
        { "index": 0, "layers": [{ "type": "text", "role": "hook", "text": "A", "region": "center" }] },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "B", "region": "center" }] },
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "C", "region": "bottom" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slidePlanVersion).toBe(1);
    expect(plan.slides).toHaveLength(3);
  });

  it("coerces shape accent from string", () => {
    const raw = `{
      "slidePlanVersion": 1,
      "slides": [
        {
          "index": 0,
          "layers": [
            { "type": "text", "role": "hook", "text": "Hi", "region": "center" },
            { "type": "shape", "shape": "circle", "region": "top", "accent": "true" }
          ]
        },
        { "index": 1, "layers": [{ "type": "text", "role": "body", "text": "Mid", "region": "center" }] },
        { "index": 2, "layers": [{ "type": "text", "role": "cta", "text": "End", "region": "bottom" }] }
      ]
    }`;
    const plan = parseSlidePlanJson(raw);
    expect(plan.slides[0]?.layers[1]).toMatchObject({
      type: "shape",
      accent: true,
    });
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
