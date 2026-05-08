import { z } from "zod";

export const TextLayerSchema = z.object({
  type: z.literal("text"),
  role: z.enum(["hook", "body", "cta", "label"]),
  text: z.string().min(1).max(320),
  region: z.enum(["top", "center", "bottom"]),
});

export const ShapeLayerSchema = z.object({
  type: z.literal("shape"),
  shape: z.enum(["circle", "rect", "line"]),
  region: z.enum(["top", "center", "bottom"]),
  accent: z.boolean().optional(),
});

export const LayerSchema = z.discriminatedUnion("type", [
  TextLayerSchema,
  ShapeLayerSchema,
]);

export const SlideSchema = z.object({
  index: z.number().int().min(0),
  layers: z.array(LayerSchema).min(1).max(8),
});

export const SlidePlanSchema = z.object({
  slidePlanVersion: z.literal(1),
  meta: z
    .object({
      title: z.string().max(120).optional(),
    })
    .optional(),
  slides: z.array(SlideSchema).min(1),
});

export type SlidePlan = z.infer<typeof SlidePlanSchema>;
export type Slide = z.infer<typeof SlideSchema>;
export type Layer = z.infer<typeof LayerSchema>;
