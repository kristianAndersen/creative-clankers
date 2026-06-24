// Deliberately minimal. The model runs on a free tier, so abuse can't run up a
// bill — the only real risk is exhausting the shared rate limit and making the
// demo briefly unavailable. An in-memory per-IP sliding window is proportionate
// protection for a low-traffic portfolio link (note: per-instance on serverless,
// not global — that's an accepted trade-off, not an oversight).

type Hit = { count: number; windowStart: number };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 8;
const store = new Map<string, Hit>();

export function rateLimit(ip: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const hit = store.get(ip);

  if (!hit || now - hit.windowStart > WINDOW_MS) {
    store.set(ip, { count: 1, windowStart: now });
    return { ok: true, retryAfter: 0 };
  }

  if (hit.count >= MAX_PER_WINDOW) {
    return {
      ok: false,
      retryAfter: Math.ceil((WINDOW_MS - (now - hit.windowStart)) / 1000),
    };
  }

  hit.count += 1;
  return { ok: true, retryAfter: 0 };
}
