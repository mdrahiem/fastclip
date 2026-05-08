import { z } from "zod";
import { SlidePlanSchema, type SlidePlan } from "./slide-plan";

export class SlidePlanValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlidePlanValidationError";
  }
}

function repairCommonJsonSyntax(s: string): string {
  return s
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

function formatZodIssues(err: z.ZodError): string {
  const parts = err.issues
    .slice(0, 12)
    .map((i) => `${i.path.length ? i.path.join(".") : "root"}: ${i.message}`);
  const joined = parts.join("; ");
  return joined || err.message || "(no issue details)";
}

function hasSlidesArray(o: unknown): o is { slides: unknown[] } {
  return Boolean(
    o &&
      typeof o === "object" &&
      "slides" in o &&
      Array.isArray((o as Record<string, unknown>).slides),
  );
}

function isSlideLike(x: unknown): boolean {
  return Boolean(x && typeof x === "object" && "layers" in (x as object));
}

/** Unwrap nested `{ slidePlan: {...} }` and alias `version` → slidePlanVersion. */
export function normalizeSlidePlanRoot(input: unknown): unknown {
  if (!input || typeof input !== "object") return input;
  let cur: Record<string, unknown> = { ...(input as Record<string, unknown>) };

  if (!hasSlidesArray(cur) && Array.isArray(cur.slideList)) {
    cur = { ...cur, slides: cur.slideList };
  }

  if (!hasSlidesArray(cur)) {
    const inner =
      cur.slidePlan ??
      cur.plan ??
      cur.data ??
      cur.slide_plan ??
      cur.result;
    if (inner && typeof inner === "object") {
      cur = { ...(inner as Record<string, unknown>) };
    }
  }

  const out: Record<string, unknown> = { ...cur };
  if (out.slidePlanVersion === undefined && out.version !== undefined) {
    out.slidePlanVersion = out.version;
  }
  if (out.slidePlanVersion === undefined && out.slide_plan_version !== undefined) {
    out.slidePlanVersion = out.slide_plan_version;
  }
  return out;
}

/**
 * Strips markdown fences and surrounding prose so `JSON.parse` sees one JSON **object or array**.
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

  const lb = s.indexOf("[");
  const lc = s.indexOf("{");
  if (lb >= 0 && (lc < 0 || lb < lc)) {
    const rb = s.lastIndexOf("]");
    if (rb > lb) {
      s = s.slice(lb, rb + 1);
    }
  } else if (lc >= 0) {
    const rc = s.lastIndexOf("}");
    if (rc > lc) {
      s = s.slice(lc, rc + 1);
    }
  }

  return repairCommonJsonSyntax(s.trim());
}

export function parseSlidePlanJson(raw: string): SlidePlan {
  const extracted = extractJsonObjectFromModelText(raw);
  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch {
    throw new SlidePlanValidationError("Slide plan JSON could not be parsed.");
  }

  if (Array.isArray(parsed)) {
    const items = parsed as unknown[];
    if (items.length > 0 && items.every(isSlideLike)) {
      parsed = { slidePlanVersion: 1, slides: parsed };
    }
  }

  parsed = normalizeSlidePlanRoot(parsed);

  const result = SlidePlanSchema.safeParse(parsed);
  if (!result.success) {
    throw new SlidePlanValidationError(
      `Slide plan failed schema validation. ${formatZodIssues(result.error)}`,
    );
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
