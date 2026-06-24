import Link from "next/link";
import { SubstitutionBriefing } from "@/components/SubstitutionBriefing";

export const metadata = {
  title: "Substitution Briefing Agent — Creative Clankers",
  description:
    "Natural-language drug substitution analysis: a streaming multi-step agent searches medicinpriser.dk, locks prices from the API, and delivers copy-pasteable procurement language.",
};

export default function SubstitutionPage() {
  return (
    <main className="min-h-screen">
      {/* top bar — mirrors app/studio/page.tsx */}
      <header className="border-b border-grey-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="text-sm text-grey-2 transition-colors hover:text-ink"
          >
            ← Creative Clankers
          </Link>
          <span className="text-xs uppercase tracking-[0.18em] text-grey-2">
            Substitution Briefing
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <p className="mb-4 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-grey-2">
          <span className="inline-block h-2 w-2 rounded-full bg-machine" />
          Pharmacy procurement · medicinpriser.dk
        </p>
        <h1
          className="max-w-2xl text-balance text-4xl leading-[1.05] tracking-tight text-ink sm:text-5xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Type a drug.
          <br />
          <span className="brand-gradient-text">Get a memo.</span>
        </h1>
        <p className="mt-5 max-w-xl text-lg text-ink-soft">
          The agent searches substitution candidates, filters discontinued
          products mid-reasoning, locks every price from the live API — and
          delivers structured procurement language you can paste straight into a
          tender document.
        </p>
        <div className="mt-7 brand-gradient-rule max-w-2xl" />

        <div className="mt-10">
          <SubstitutionBriefing />
        </div>

        <p className="mt-12 border-t border-grey-4 pt-6 text-xs text-grey-2">
          Built by Kristian Andersen · Next.js · Vercel AI SDK · Groq ·
          medicinpriser.dk. Numbers are fetched live from the Danish medicines
          price register; the model only narrates them.
        </p>
      </div>
    </main>
  );
}
