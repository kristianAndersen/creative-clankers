import {
  convertToModelMessages,
  streamText,
  stepCountIs,
  tool,
  type UIMessage,
} from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { analyze } from "@/lib/analyze";
import type { Dataset } from "@/lib/datasets";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 30;

const apiKey = process.env.GROQ_API_KEY?.trim();
const modelId = process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile";

// Validate whatever dataset the client sends — built-in or user-uploaded.
const DatasetSchema = z.object({
  id: z.string(),
  name: z.string(),
  blurb: z.string().optional(),
  dimension: z.string(),
  metric: z.string(),
  unit: z.enum(["currency", "count"]),
  currencyCode: z.string().optional(),
  period: z.string(),
  goodDirection: z.enum(["up", "down"]),
  mode: z.enum(["compare", "single"]).optional(),
  aggregation: z.enum(["sum", "average"]).optional(),
  points: z
    .array(
      z.object({
        label: z.string(),
        current: z.number(),
        previous: z.number().optional(),
      }),
    )
    .min(1)
    .max(40),
});

const SYSTEM = `You are the analyst inside "Creative Clankers", a live demo agent.
Your job: turn a business dataset into a clear, honest read — then hand the
decision back to the human. You embody one belief: AI does the heavy lifting,
the person keeps the judgment.

RULES
- You do NOT do arithmetic yourself. Call the \`analyze\` tool (pass the dataset's
  name as the argument) to get real, computed figures for the dataset the user
  provided. Only ever cite figures the tool returned. Never invent a number.
- The analysis comes in one of two shapes — adapt to whichever you get:
  • "compare" (has growth %, deltas, a previous period): talk about what rose
    and fell, by how much, and what moved against the goal.
  • "single" (has shares, a total, an average, NO previous period): there is no
    growth to discuss. Talk about ranking, each item's share of the total,
    concentration, and which items sit far above/below the average.
- After the tool returns, write a tight plain-language read (no markdown
  headings, no bullet-symbol spam). Structure it as:
  1. One headline sentence on the overall picture.
  2. Two or three specific points that matter, each with the tool's exact
     numbers (growth %, share, value, or delta — whichever the shape provides).
  3. What it might mean — hypotheses, clearly flagged as hypotheses.
- In compare mode, respect "goodDirection": if it is "down", a RISE is bad
  news — do not celebrate growth.
- The dataset may be uploaded by the user, so use its own metric and dimension
  names; don't assume the domain.
- Close by explicitly handing the call to the human: 2–3 sharp questions only a
  person with context can answer. Make clear the agent is not deciding.
- Be concise and senior. No filler, no "I'm excited to", no emoji.`;

export async function POST(req: Request) {
  if (!apiKey) {
    return Response.json(
      {
        error:
          "No GROQ_API_KEY set. Add a free key from https://console.groq.com/keys to .env.local",
      },
      { status: 500 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return Response.json(
      { error: `Rate limit reached. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await req.json();
  const messages: UIMessage[] = body.messages ?? [];

  const parsed = DatasetSchema.safeParse(body.dataset);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid or missing dataset in request." },
      { status: 400 },
    );
  }
  const dataset = parsed.data as Dataset;

  const groq = createGroq({ apiKey });

  const result = streamText({
    model: groq(modelId),
    system: SYSTEM,
    messages: await convertToModelMessages(messages),
    maxOutputTokens: 900,
    temperature: 0.4,
    stopWhen: stepCountIs(4),
    tools: {
      analyze: tool({
        description:
          "Run real, deterministic analysis on the dataset the user provided. Returns totals, per-row growth, outliers, concentration, and the dataset's goodDirection. Call this before citing any number.",
        // A concrete field keeps tool-calling reliable across models (some emit
        // `null` for an empty schema). The server ignores it — the data comes
        // from the request body — but the model fills it from context.
        inputSchema: z.object({
          datasetName: z
            .string()
            .describe("The name of the dataset you are analyzing."),
        }),
        execute: async () => analyze(dataset),
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
