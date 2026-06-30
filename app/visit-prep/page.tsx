import Link from "next/link";
import { VisitPrepClient } from "@/components/visit-prep/VisitPrepClient";

export const metadata = {
  title: "Visit Prep Assistant — Creative Clankers",
  description:
    "Paste patient notes and get a structured visit brief: concerns, evidence, and suggested questions — AI-generated, for clinician review only.",
};

export default function VisitPrepPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-grey-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-sm text-grey-2 transition-colors hover:text-ink"
          >
            ← Creative Clankers
          </Link>
          <span className="text-xs uppercase tracking-[0.18em] text-grey-2">
            Visit Prep Assistant
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <p className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-grey-2">
          <span className="inline-block h-2 w-2 rounded-full bg-machine" />
          Generative UI · Visit preparation
        </p>
        <h1
          className="max-w-2xl text-balance text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Paste notes.
          <br />
          <span className="brand-gradient-text">Get a brief.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          The model reads your appointment notes and produces a structured
          visit brief — concerns to raise, questions to ask, and the evidence
          behind each item. Layout adapts to the richness of the input.
        </p>
        <div className="mt-7 brand-gradient-rule max-w-2xl" />

        <div className="mt-10">
          <VisitPrepClient />
        </div>

        <p className="mt-12 border-t border-grey-4 pt-6 text-xs text-grey-2">
          Built by Kristian Andersen · Next.js · Vercel AI SDK. AI-generated output — not a medical device.
        </p>
      </div>
    </main>
  );
}
