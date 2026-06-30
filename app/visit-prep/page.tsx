import { VisitPrepClient } from "@/components/visit-prep/VisitPrepClient";

export const metadata = {
  title: "Visit Prep Assistant — Creative Clankers",
  description:
    "Paste patient notes and get a structured visit brief: concerns, evidence, and suggested questions — AI-generated, for clinician review only.",
};

export default function VisitPrepPage() {
  return (
    <main className="min-h-screen">
      {/* Header strip — white, 3px dark bottom rule, monospace wordmark */}
      <header className="bg-white" style={{ borderBottom: "3px solid #1A2328" }}>
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <span
            className="text-xl font-normal text-[#000000]"
            style={{
              fontFamily: "var(--font-vp-display, 'Roboto Mono', monospace)",
              letterSpacing: "-0.02em",
            }}
          >
            Visit Prep
          </span>
          <span className="text-xs text-[#484F53] tracking-[0.08em] uppercase">
            AI · Clinician review only
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#484F53]">
          Generative UI · Visit preparation
        </p>

        <h1
          className="max-w-2xl text-balance text-4xl font-normal leading-tight text-[#000000] sm:text-5xl"
          style={{
            fontFamily: "var(--font-vp-display, 'Roboto Mono', monospace)",
            letterSpacing: "-0.02em",
            lineHeight: 1.25,
          }}
        >
          Paste notes.
          <br />
          <span className="text-[#099A93]">Get a brief.</span>
        </h1>

        <p className="mt-5 max-w-xl text-lg text-[#484F53]">
          The model reads your appointment notes and produces a structured
          visit brief — concerns to raise, questions to ask, and the evidence
          behind each item. Layout adapts to the richness of the input.
        </p>

        {/* Horizontal hairline rule */}
        <div className="mt-7 max-w-2xl vp-rule" />

        <div className="mt-10">
          <VisitPrepClient />
        </div>

        <p className="mt-12 pt-6 text-xs text-[#484F53]" style={{ borderTop: "1px solid #1A2328" }}>
          Built by Kristian Andersen · Next.js · Vercel AI SDK. AI-generated output — not a medical device.
        </p>
      </div>
    </main>
  );
}
