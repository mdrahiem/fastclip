import {
  assertSlideCount,
  getTemplateById,
  parseSlidePlanJson,
  SlidePlanValidationError,
  type SlidePlan,
  type VideoTemplate,
} from "@video-gen/contracts";
import OpenAI from "openai";
import { buildPlannerSystemPrompt, buildPlannerUserPrompt } from "./prompt.js";

export class PlannerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PlannerError";
  }
}

export type PlanPostInput = {
  /** API key for an OpenAI-compatible endpoint (OpenAI or OpenRouter). */
  apiKey: string;
  /** e.g. `https://openrouter.ai/api/v1` — omit for OpenAI’s default host. */
  baseURL?: string;
  defaultHeaders?: Record<string, string>;
  model: string;
  templateId: VideoTemplate["id"];
  postText: string;
};

export function finalizePlanFromModelJson(
  raw: string,
  templateId: VideoTemplate["id"],
): SlidePlan {
  try {
    const template = getTemplateById(templateId);
    const plan = parseSlidePlanJson(raw);
    assertSlideCount(plan, template.slideCount);
    return plan;
  } catch (err) {
    const message =
      err instanceof SlidePlanValidationError || err instanceof Error
        ? err.message
        : "Slide plan validation failed.";
    throw new PlannerError(message);
  }
}

export async function planPost(input: PlanPostInput): Promise<SlidePlan> {
  const client = new OpenAI({
    apiKey: input.apiKey,
    baseURL: input.baseURL,
    defaultHeaders: input.defaultHeaders,
  });
  const template = getTemplateById(input.templateId);
  const system = buildPlannerSystemPrompt(template);
  const user = buildPlannerUserPrompt(input.postText);

  let raw = "";
  try {
    const response = await client.chat.completions.create({
      model: input.model,
      temperature: 0.4,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    raw = response.choices[0]?.message?.content ?? "";
    if (!raw) {
      throw new PlannerError("The model returned an empty response.");
    }
  } catch (err) {
    if (err instanceof PlannerError) throw err;
    throw new PlannerError(
      err instanceof Error ? err.message : "LLM request failed.",
    );
  }

  return finalizePlanFromModelJson(raw, input.templateId);
}
