import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isTransient, resolveModelChain } from "../model";

describe("isTransient", () => {
  it("returns true for 503 in message", () => {
    expect(isTransient(new Error("503 Service Unavailable"))).toBe(true);
  });

  it("returns true for 'high demand'", () => {
    expect(isTransient(new Error("The model is in high demand"))).toBe(true);
  });

  it("returns true for 'overloaded'", () => {
    expect(isTransient(new Error("Server overloaded, try again"))).toBe(true);
  });

  it("returns true for 'temporarily unavailable'", () => {
    expect(isTransient(new Error("Service temporarily unavailable"))).toBe(true);
  });

  it("returns true for 429 in message", () => {
    expect(isTransient(new Error("429 Too Many Requests"))).toBe(true);
  });

  it("returns true for rate limit", () => {
    expect(isTransient(new Error("rate limit exceeded"))).toBe(true);
  });

  it("returns true for rate-limit (hyphen)", () => {
    expect(isTransient(new Error("rate-limit: quota exceeded"))).toBe(true);
  });

  it("returns true for tokens per minute", () => {
    expect(isTransient(new Error("tokens per minute limit reached"))).toBe(true);
  });

  it("returns true for tokens per day", () => {
    expect(isTransient(new Error("tokens per day exceeded"))).toBe(true);
  });

  it("returns true for TPM shorthand", () => {
    expect(isTransient(new Error("TPM quota exceeded"))).toBe(true);
  });

  it("returns true for TPD shorthand", () => {
    expect(isTransient(new Error("TPD limit reached"))).toBe(true);
  });

  it("returns true for UNAVAILABLE (uppercase)", () => {
    expect(isTransient(new Error("UNAVAILABLE: high traffic"))).toBe(true);
  });

  it("returns true for 'too large' (context window)", () => {
    expect(isTransient(new Error("Request too large for model"))).toBe(true);
  });

  it("returns true for wrapped error object { error: Error }", () => {
    expect(isTransient({ error: new Error("503 overloaded") })).toBe(true);
  });

  it("returns false for 401 Unauthorized", () => {
    expect(isTransient(new Error("401 Unauthorized"))).toBe(false);
  });

  it("returns false for invalid api key", () => {
    expect(isTransient(new Error("invalid api key provided"))).toBe(false);
  });

  it("returns false for 400 Bad Request", () => {
    expect(isTransient(new Error("400 Bad Request"))).toBe(false);
  });

  it("returns false for 403 Forbidden", () => {
    expect(isTransient(new Error("403 Forbidden"))).toBe(false);
  });

  it("returns false for generic error", () => {
    expect(isTransient(new Error("Something went wrong"))).toBe(false);
  });

  it("returns false for empty error", () => {
    expect(isTransient(new Error(""))).toBe(false);
  });

  it("returns false for null", () => {
    expect(isTransient(null)).toBe(false);
  });

  it("returns false for non-matching string", () => {
    expect(isTransient("network timeout")).toBe(false);
  });
});

describe("resolveModelChain", () => {
  const savedEnv = { ...process.env };

  beforeEach(() => {
    // Clean provider-related env vars before each test
    delete process.env.AI_PROVIDER;
    delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GOOGLE_MODEL;
    delete process.env.GROQ_MODEL;
  });

  afterEach(() => {
    // Restore original env
    Object.keys(process.env).forEach((k) => {
      if (!(k in savedEnv)) delete process.env[k];
    });
    Object.assign(process.env, savedEnv);
  });

  it("returns [google, groq] when both keys present and default provider", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "fake-google-key";
    process.env.GROQ_API_KEY = "fake-groq-key";
    const chain = resolveModelChain();
    expect(chain).toHaveLength(2);
    expect(chain[0].provider).toBe("google");
    expect(chain[1].provider).toBe("groq");
  });

  it("returns [groq, google] when AI_PROVIDER=groq and both keys present", () => {
    process.env.AI_PROVIDER = "groq";
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "fake-google-key";
    process.env.GROQ_API_KEY = "fake-groq-key";
    const chain = resolveModelChain();
    expect(chain).toHaveLength(2);
    expect(chain[0].provider).toBe("groq");
    expect(chain[1].provider).toBe("google");
  });

  it("returns only google when only google key present", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "fake-google-key";
    const chain = resolveModelChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].provider).toBe("google");
  });

  it("returns only groq when only groq key present", () => {
    process.env.GROQ_API_KEY = "fake-groq-key";
    const chain = resolveModelChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].provider).toBe("groq");
  });

  it("returns only groq when AI_PROVIDER=groq and only groq key present", () => {
    process.env.AI_PROVIDER = "groq";
    process.env.GROQ_API_KEY = "fake-groq-key";
    const chain = resolveModelChain();
    expect(chain).toHaveLength(1);
    expect(chain[0].provider).toBe("groq");
  });

  it("returns empty array when no keys present", () => {
    const chain = resolveModelChain();
    expect(chain).toHaveLength(0);
  });

  it("uses GOOGLE_MODEL env when set", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "fake-google-key";
    process.env.GOOGLE_MODEL = "gemini-1.5-pro";
    const chain = resolveModelChain();
    expect(chain[0].modelId).toBe("gemini-1.5-pro");
  });

  it("uses GROQ_MODEL env when set", () => {
    process.env.GROQ_API_KEY = "fake-groq-key";
    process.env.GROQ_MODEL = "llama-3.1-8b-instant";
    const chain = resolveModelChain();
    expect(chain[0].modelId).toBe("llama-3.1-8b-instant");
  });

  it("defaults google modelId to gemini-2.5-flash", () => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "fake-google-key";
    const chain = resolveModelChain();
    expect(chain[0].modelId).toBe("gemini-2.5-flash");
  });

  it("defaults groq modelId to openai/gpt-oss-120b", () => {
    process.env.GROQ_API_KEY = "fake-groq-key";
    const chain = resolveModelChain();
    expect(chain[0].modelId).toBe("openai/gpt-oss-120b");
  });
});
