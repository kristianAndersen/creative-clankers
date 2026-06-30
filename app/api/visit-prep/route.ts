import { NextResponse } from "next/server";
import { generateVisitBrief } from "@/lib/visit-prep/generate";
import { rateLimit } from "@/lib/ratelimit";

export const maxDuration = 60;

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const limit = rateLimit(ip);
  if (!limit.ok) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${limit.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const body = await req.json();
  const input = typeof body.input === "string" ? body.input : "";

  const brief = await generateVisitBrief(input);
  return NextResponse.json(brief);
}
