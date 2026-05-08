import { describe, expect, it } from "vitest";
import {
  DEFAULT_VIDEO_TEMPLATE_ID,
  getTemplateById,
  VIDEO_TEMPLATES,
} from "./templates.js";

describe("templates", () => {
  it("has a default template", () => {
    expect(DEFAULT_VIDEO_TEMPLATE_ID).toBe("linkedin-three-beat-v1");
    expect(VIDEO_TEMPLATES).toHaveLength(1);
  });

  it("returns template by id", () => {
    const t = getTemplateById("linkedin-three-beat-v1");
    expect(t.slideCount).toBe(3);
    expect(t.slideDurationsSec).toEqual([5, 5, 5]);
  });
});
