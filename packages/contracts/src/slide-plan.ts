import { z } from "zod";

const REGION_ENUM = z.enum(["top", "center", "bottom"]);

function normalizeRegion(v: unknown) {
  if (typeof v !== "string") return v;
  const x = v.trim().toLowerCase();
  const map: Record<string, string> = {
    middle: "center",
    centre: "center",
    mid: "center",
    upper: "top",
    lower: "bottom",
    left: "center",
    right: "center",
  };
  return map[x] ?? x;
}

const TextRoleEnum = z.preprocess((v) => {
  if (typeof v !== "string") return v;
  const x = v.trim().toLowerCase().replace(/[\s_]+/g, "-");
  const map: Record<string, string> = {
    headline: "hook",
    title: "hook",
    opening: "hook",
    intro: "hook",
    lede: "hook",
    hook: "hook",
    content: "body",
    main: "body",
    middle: "body",
    insight: "body",
    body: "body",
    detail: "body",
    "call-to-action": "cta",
    calltoaction: "cta",
    closing: "cta",
    outro: "cta",
    cta: "cta",
    caption: "label",
    subtitle: "label",
    label: "label",
    kicker: "label",
    footer: "cta",
    ending: "cta",
    punchline: "cta",
    tagline: "hook",
    takeaway: "body",
    bullet: "body",
    secondary: "label",
    emphasis: "body",
  };
  return map[x] ?? x.replace(/-/g, "");
}, z.enum(["hook", "body", "cta", "label"]));

function normalizeTextLayerFields(raw: Record<string, unknown>): Record<string, unknown> {
  const o = { ...raw };
  let textVal = o.text;
  if (typeof textVal === "number" && Number.isFinite(textVal)) {
    o.text = String(textVal);
    textVal = o.text;
  }
  const textEmpty = typeof textVal !== "string" || !textVal.trim();
  if (textEmpty) {
    for (const k of ["content", "copy", "value", "message", "body"]) {
      const v = o[k];
      if (typeof v === "string" && v.trim()) {
        o.text = v;
        break;
      }
      if (typeof v === "number" && Number.isFinite(v)) {
        o.text = String(v);
        break;
      }
    }
  }
  return o;
}

export const TextLayerSchema = z.object({
  type: z.literal("text"),
  role: TextRoleEnum,
  /** Trimmed and trimmed to 500 chars so minor LLM overflow still validates. */
  text: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().slice(0, 500) : v),
    z.string().min(1).max(500),
  ),
  region: z.preprocess(normalizeRegion, REGION_ENUM),
});

export const ShapeLayerSchema = z.object({
  type: z.literal("shape"),
  shape: z.preprocess((v) => {
    if (typeof v !== "string") return v;
    return v.trim().toLowerCase();
  }, z.enum(["circle", "rect", "line", "rectangle"]).transform((s) => (s === "rectangle" ? "rect" : s))),
  region: z.preprocess(normalizeRegion, REGION_ENUM),
  accent: z.preprocess((v) => {
    if (v === undefined || v === null) return undefined;
    if (typeof v === "boolean") return v;
    if (typeof v === "string") {
      const s = v.trim().toLowerCase();
      if (s === "true" || s === "1" || s === "yes") return true;
      if (s === "false" || s === "0" || s === "no") return false;
    }
    if (typeof v === "number" && Number.isFinite(v)) return v !== 0;
    return v;
  }, z.boolean().optional()),
});

const LayerSchemaCore = z.discriminatedUnion("type", [
  TextLayerSchema,
  ShapeLayerSchema,
]);

/** Lowercase `type`, infer missing `type`, coerce decorative kinds toward text, normalize text aliases. */
export const LayerSchema = z.preprocess((raw) => {
  if (!raw || typeof raw !== "object") return raw;
  let o = { ...(raw as Record<string, unknown>) };
  if (typeof o.type === "string") {
    let t = o.type.trim().toLowerCase();
    if ((t === "image" || t === "icon" || t === "graphic") && (o.text ?? o.content ?? o.copy)) {
      t = "text";
      if (typeof o.role !== "string" || !String(o.role).trim()) o.role = "body";
      if (typeof o.region !== "string" || !String(o.region).trim()) o.region = "center";
    }
    o.type = t;
  } else if (o.type == null || o.type === "") {
    if (typeof o.shape === "string" && String(o.shape).trim()) {
      o.type = "shape";
    } else if (
      "role" in o ||
      typeof o.text === "string" ||
      typeof o.content === "string" ||
      typeof o.copy === "string"
    ) {
      o.type = "text";
    }
  }
  if (o.type === "text") {
    o = normalizeTextLayerFields(o);
  }
  return o;
}, LayerSchemaCore);

function normalizeSlide(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const o = { ...(raw as Record<string, unknown>) };
  const layers = o.layers;
  if (layers && typeof layers === "object" && !Array.isArray(layers)) {
    o.layers = [layers];
  }
  return o;
}

export const SlideSchema = z.preprocess(
  normalizeSlide,
  z.object({
    /** Models sometimes emit string indices; coerce. */
    index: z.coerce.number().int().min(0),
    layers: z.array(LayerSchema).min(1).max(8),
  }),
);

const slidePlanVersionIn = z.preprocess((v) => {
  if (v === undefined || v === null) return 1;
  if (typeof v === "number" && Number.isFinite(v) && Math.round(v) === 1) return 1;
  if (typeof v === "string") {
    const t = v.trim();
    if (t === "1" || t === "1.0") return 1;
  }
  return v;
}, z.literal(1));

export const SlidePlanSchema = z
  .object({
    slidePlanVersion: slidePlanVersionIn,
    meta: z
      .object({
        title: z.preprocess((v) => {
          if (typeof v === "number" && Number.isFinite(v)) return String(v);
          if (typeof v === "string") return v.trim().slice(0, 120);
          return v;
        }, z.string().max(120).optional()),
      })
      .optional(),
    slides: z.array(SlideSchema).min(1),
  })
  .transform((data) => ({
    ...data,
    slides: [...data.slides]
      .sort((a, b) => a.index - b.index)
      .map((slide, i) => ({ ...slide, index: i })),
  }));

export type SlidePlan = z.infer<typeof SlidePlanSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type Layer = z.infer<typeof LayerSchema>;
