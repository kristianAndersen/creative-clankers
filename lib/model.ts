import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

/**
 * Provider selection for the AI routes.
 *
 * Default is Google Gemini 2.5 Flash — the most generous genuinely-free tier
 * for a tool-calling agent (15 RPM / 1M TPM / 1500 RPD) with frontier-level
 * instruction following. Groq (llama-3.3-70b-versatile) is the fallback: set
 * AI_PROVIDER=groq to switch, no code change. (Groq's 8b-instant was too weak —
 * it looped and ignored the workflow; never use it for this agent.)
 *
 * Override the model id per provider with GOOGLE_MODEL / GROQ_MODEL.
 * Keys: GOOGLE_GENERATIVE_AI_API_KEY (aistudio.google.com) or GROQ_API_KEY.
 */
export type ResolvedModel = {
  provider: "google" | "groq";
  modelId: string;
  model: LanguageModel;
  /** true when the selected provider's API key is absent from the environment */
  missingKey: boolean;
  /** human-readable hint naming the env var + where to get it */
  keyHint: string;
};

export function resolveModel(): ResolvedModel {
  const provider = (process.env.AI_PROVIDER?.trim() || "google").toLowerCase();

  if (provider === "groq") {
    const apiKey = process.env.GROQ_API_KEY?.trim();
    const modelId = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";
    const groq = createGroq({ apiKey });
    return {
      provider: "groq",
      modelId,
      model: groq(modelId),
      missingKey: !apiKey,
      keyHint: "GROQ_API_KEY (free key from console.groq.com/keys)",
    };
  }

  // default: Google Gemini. The @ai-sdk/google provider reads
  // GOOGLE_GENERATIVE_AI_API_KEY from the environment automatically.
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  const modelId = process.env.GOOGLE_MODEL?.trim() || "gemini-2.5-flash";
  return {
    provider: "google",
    modelId,
    model: google(modelId),
    missingKey: !apiKey,
    keyHint: "GOOGLE_GENERATIVE_AI_API_KEY (free key from aistudio.google.com/apikey)",
  };
}
