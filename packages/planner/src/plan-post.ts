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
    let lastErr: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return finalizePlanFromModelJson(raw, input.templateId);
      } catch (err) {
        lastErr = err;
        if (attempt === 2) break;
        const hint =
          err instanceof Error ? err.message : "Validation failed.";
        messages.push({ role: "assistant", content: raw });
        messages.push({
          role: "user",
          content:
            attempt === 0
              ? `That output failed validation (${hint}). Reply with ONLY one JSON object (no markdown, no prose). Rules: slidePlanVersion is the number 1; exactly ${template.slideCount} slides; slide indices are numbers 0..${template.slideCount - 1} in order; each slide has at least one text layer; layer type is lowercase "text" or "shape"; text.role is hook, body, cta, or label; text.region and shape.region are top, center, or bottom; shape.shape is circle, rect, or line.`
              : `Still invalid (${hint}). Output ONLY compact JSON starting with { and ending with }. Example shape: {"slidePlanVersion":1,"slides":[{"index":0,"layers":[{"type":"text","role":"hook","text":"...","region":"center"}]},{"index":1,"layers":[{"type":"text","role":"body","text":"...","region":"center"}]},{"index":2,"layers":[{"type":"text","role":"cta","text":"...","region":"bottom"}]}]}`,
        });
        raw = await runCompletion(messages);
      }
    }

    if (lastErr instanceof PlannerError) throw lastErr;
    if (lastErr instanceof Error) throw new PlannerError(lastErr.message);
    throw new PlannerError("Slide plan validation failed after retries.");
  } catch (err) {
    if (err instanceof PlannerError) throw err;
    throw new PlannerError(
      err instanceof Error ? err.message : "LLM request failed.",
    );
  }
}
