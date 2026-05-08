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

  const runCompletion = async (
    messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  ): Promise<string> => {
    const response = await client.chat.completions.create({
      model: input.model,
      temperature: 0.35,
      messages,
    });
    const content = response.choices[0]?.message?.content ?? "";
    if (!content) {
      throw new PlannerError("The model returned an empty response.");
    }
    return content;
  };

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    { role: "user", content: user },
  ];

  try {
    let raw = await runCompletion(messages);
    try {
      return finalizePlanFromModelJson(raw, input.templateId);
    } catch {
      messages.push({ role: "assistant", content: raw });
      messages.push({
        role: "user",
        content:
          "That output failed validation. Reply with ONLY one JSON object (no markdown, no prose). Rules: slidePlanVersion is the number 1; each slide.index is a number in order starting at 0; each layer has type \"text\" or \"shape\"; text.role is hook, body, cta, or label; text.region and shape.region are top, center, or bottom; shape.shape is circle, rect, or line.",
      });
      raw = await runCompletion(messages);
      return finalizePlanFromModelJson(raw, input.templateId);
    }
  } catch (err) {
    if (err instanceof PlannerError) throw err;
    throw new PlannerError(
      err instanceof Error ? err.message : "LLM request failed.",
    );
  }
}
