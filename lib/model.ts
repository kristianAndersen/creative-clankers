import { google } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import type { LanguageModel } from "ai";

/**
 * Provider selection for the AI routes.
 *
 * Default is Google Gemini 2.5 Flash — the most generous genuinely-free tier
 * for a tool-calling agent (15 RPM / 1M TPM / 1500 RPD) with frontier-level
 * instruction following. Groq (openai/gpt-oss-120b) is the fallback: set
 * AI_PROVIDER=groq to switch, no code change. (Groq's 8b-instant and the smaller
 * gpt-oss-20b were too weak for the enum-nested VisitBrief schema — they emit
 * out-of-enum values that Groq strict mode rejects; do not use them for
 * structured output here.)
 *
 * Groq default is openai/gpt-oss-120b (free-tier, 30 RPM / 8K TPM) because it
 * reliably produces generateObject json_schema structured outputs in strict mode.
 * llama-3.3-70b-versatile does NOT support json_schema and throws "This model
 * does not support response format json_schema" on every generateObject call.
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

export type ModelChainEntry = {
  provider: "google" | "groq";
  modelId: string;
  model: LanguageModel;
};

/**
 * Classify an error as transient (503/high-demand/429/rate-limit) — safe to
 * retry on the next provider. Auth errors (401/403/invalid key) and bad-request
 * (400) are NOT transient and must surface immediately.
 */
export function isTransient(err: unknown): boolean {
  // Unwrap wrapped error objects (e.g. { error: originalErr })
  const e =
    err && typeof err === "object" && "error" in err
      ? (err as { error: unknown }).error
      : err;
  const anyE = e as {
    message?: string;
    responseBody?: string;
    name?: string;
  } | null;
  const msg =
    anyE?.message ||
    anyE?.responseBody ||
    (typeof e === "string" ? e : "") ||
    anyE?.name ||
    "";
  return /high demand|overloaded|temporarily|unavailable|503|tokens per (minute|day)|\bTPM\b|\bTPD\b|rate.?limit|too large|\b429\b|quota|exceeded your|resource.?exhausted|insufficient/i.test(
    msg,
  );
}

function buildGoogleEntry(): ModelChainEntry | null {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY?.trim();
  if (!apiKey) return null;
  const modelId = process.env.GOOGLE_MODEL?.trim() || "gemini-2.5-flash";
  return { provider: "google", modelId, model: google(modelId) };
}

function buildGroqEntry(): ModelChainEntry | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  const modelId = process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b";
  const groq = createGroq({ apiKey });
  return { provider: "groq", modelId, model: groq(modelId) };
}

/**
 * Returns an ordered array of available providers (primary first, filtered by
 * key presence). Primary is determined by AI_PROVIDER env (default "google").
 * Each entry is ready to use as a LanguageModel.
 */
export function resolveModelChain(): ModelChainEntry[] {
  const primary = (process.env.AI_PROVIDER?.trim() || "google").toLowerCase();
  const order: Array<"google" | "groq"> =
    primary === "groq" ? ["groq", "google"] : ["google", "groq"];
  return order
    .map<ModelChainEntry | null>((p) =>
      p === "groq" ? buildGroqEntry() : buildGoogleEntry(),
    )
    .filter((e): e is ModelChainEntry => e !== null);
}

export function resolveModel(): ResolvedModel {
  const chain = resolveModelChain();
  const preferredProvider = (
    (process.env.AI_PROVIDER?.trim() || "google").toLowerCase()
  ) as "google" | "groq";

  if (chain.length === 0) {
    const isGroq = preferredProvider === "groq";
    const modelId = isGroq
      ? process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-120b"
      : process.env.GOOGLE_MODEL?.trim() || "gemini-2.5-flash";
    return {
      provider: preferredProvider,
      modelId,
      // dummy model instance — missingKey: true so route returns early before using it
      model: isGroq
        ? createGroq({ apiKey: "" })(modelId)
        : google(modelId),
      missingKey: true,
      keyHint: isGroq
        ? "GROQ_API_KEY (free key from console.groq.com/keys)"
        : "GOOGLE_GENERATIVE_AI_API_KEY (free key from aistudio.google.com/apikey)",
    };
  }

  const first = chain[0];
  return {
    ...first,
    missingKey: false,
    keyHint: "",
  };
}
