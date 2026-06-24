import Link from "next/link";
import { StudioChat } from "@/components/StudioChat";

export const metadata = {
  title: "The Studio — Creative Clankers",
  description:
    "A live data-to-decision agent: streaming, real tool calls, and a human-in-the-loop close.",
};

export default function StudioPage() {
  return (
    <main className="min-h-screen">
      {/* top bar */}
      <header className="border-b border-grey-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-sm text-grey-2 transition-colors hover:text-ink"
          >
            ← Creative Clankers
          </Link>
          <span className="text-xs uppercase tracking-[0.18em] text-grey-2">
            The Studio
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <p className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-grey-2">
          <span className="inline-block h-2 w-2 rounded-full bg-human" />
          Data → Decision
        </p>
        <h1
          className="max-w-2xl text-balance text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Hand it a dataset.
          <br />
          <span className="brand-gradient-text">It hands you a decision.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          The agent streams its thinking, calls a real analysis tool (the math
          runs in code — never hallucinated), and closes by asking the questions
          only a human with context can answer. Try a sample, or upload your own
          CSV.
        </p>
        <div className="mt-7 brand-gradient-rule max-w-2xl" />

        <div className="mt-10">
          <StudioChat />
        </div>

        <p className="mt-12 border-t border-grey-4 pt-6 text-xs text-grey-2">
          Built by Kristian Andersen · Next.js · Vercel AI SDK · Groq (free
          tier). Numbers are computed deterministically in code; the model only
          narrates them.
        </p>
      </div>
    </main>
  );
}
