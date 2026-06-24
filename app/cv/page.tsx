import Link from "next/link";
import { RESUME } from "@/lib/resume";
import { formatRange, toPersonJsonLd } from "@/lib/resume-format";

export const metadata = {
  title: "Kristian Andersen — Résumé",
  description: RESUME.basics.summary,
};

export default function CV() {
  const r = RESUME;
  const jsonLd = toPersonJsonLd(r);

  return (
    <main className="cv-root min-h-screen bg-cream py-10 text-ink print:bg-white print:py-0">
      {/* Machine channel: faithful mirror of everything below, for crawlers. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[760px] bg-paper px-9 py-10 shadow-[0_4px_40px_rgba(0,0,0,0.08)] print:px-0 print:py-0 print:shadow-none">
        {/* actions — never printed */}
        <div className="no-print mb-7 flex items-center justify-between gap-3 text-xs text-grey-2">
          <Link
            href="/"
            className="group inline-flex items-center gap-2 rounded-full border border-grey-4 px-4 py-1.5 font-medium text-ink transition-colors hover:border-ink"
          >
            <span className="transition-transform group-hover:-translate-x-0.5">←</span>
            Back to portfolio
          </Link>
          <span className="flex items-center gap-3">
            <a
              href="/kristian-andersen-cv.pdf"
              className="rounded-full bg-ink px-4 py-1.5 font-medium text-cream transition-transform hover:-translate-y-0.5"
            >
              Download PDF
            </a>
            <a
              href="/resume.json"
              className="underline-offset-2 hover:text-ink hover:underline"
            >
              /resume.json
            </a>
          </span>
        </div>

        <div className="brand-gradient-rule mb-7" />

        {/* header */}
        <header>
          <h1
            className="text-4xl tracking-tight text-ink"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {r.basics.name}
          </h1>
          <p className="mt-1 text-sm font-medium text-brand">{r.basics.label}</p>
          <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-grey-2">
            <a href={`mailto:${r.basics.email}`} className="hover:text-ink">
              {r.basics.email}
            </a>
            <span aria-hidden>·</span>
            <span>{r.basics.phone}</span>
            <span aria-hidden>·</span>
            <span>
              {r.basics.location.city}, {r.basics.location.countryCode}
            </span>
            {r.basics.profiles.map((p) => (
              <span key={p.network} className="contents">
                <span aria-hidden>·</span>
                <a href={p.url} className="hover:text-ink">
                  {p.network}
                </a>
              </span>
            ))}
          </p>
        </header>

        <p className="mt-5 text-[0.95rem] leading-relaxed text-ink-soft">
          {r.basics.summary}
        </p>

        {/* Experience */}
        <Section title="Experience">
          {r.work.map((w, i) => (
            <article key={i} className="cv-entry mb-4 last:mb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <h3 className="text-[0.98rem] font-semibold text-ink">
                  {w.position}{" "}
                  <span className="font-normal text-grey-2">· {w.name}</span>
                </h3>
                <span className="text-xs tabular-nums text-grey-2">
                  {formatRange(w.startDate, w.endDate)}
                </span>
              </div>
              {w.highlights ? (
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-[0.9rem] leading-snug text-ink-soft marker:text-grey-4">
                  {w.highlights.map((h, hi) => (
                    <li key={hi}>{h}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-[0.9rem] leading-snug text-ink-soft">
                  {w.summary}
                </p>
              )}
            </article>
          ))}
        </Section>

        {/* Skills */}
        <Section title="Skills">
          <div className="space-y-1.5">
            {r.skills.map((s) => (
              <p key={s.name} className="text-[0.9rem]">
                <span className="font-semibold text-ink">{s.name}</span>{" "}
                <span className="text-ink-soft">{s.keywords.join(" · ")}</span>
              </p>
            ))}
          </div>
        </Section>

        {/* Education */}
        <Section title="Education">
          {r.education.map((e, i) => (
            <div
              key={i}
              className="cv-entry mb-2.5 flex flex-wrap items-baseline justify-between gap-x-3 last:mb-0"
            >
              <p className="text-[0.92rem]">
                <span className="font-semibold text-ink">{e.institution}</span>
                <span className="text-grey-2"> — {e.area}</span>
              </p>
              <span className="text-xs tabular-nums text-grey-2">
                {e.endDate ? `${e.startDate}–${e.endDate}` : e.startDate}
              </span>
            </div>
          ))}
        </Section>

        {/* Languages + Certifications + Awards */}
        <div className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
          <Section title="Languages" tight>
            {r.languages.map((l) => (
              <p key={l.language} className="text-[0.9rem]">
                <span className="text-ink">{l.language}</span>{" "}
                <span className="text-grey-2">— {l.fluency}</span>
              </p>
            ))}
          </Section>

          <Section title="Certifications" tight>
            {r.certificates.map((c) => (
              <p key={c.name} className="text-[0.9rem]">
                <span className="text-ink">{c.name}</span>{" "}
                <span className="text-grey-2">— {c.issuer}</span>
              </p>
            ))}
          </Section>
        </div>

        <Section title="Awards">
          {r.awards.map((a) => (
            <div key={a.title} className="cv-entry">
              <p className="text-[0.92rem] font-semibold text-ink">{a.title}</p>
              <p className="text-[0.88rem] text-ink-soft">{a.summary}</p>
            </div>
          ))}
        </Section>

        {/* honest, visible note about the machine channel */}
        <p className="mt-8 border-t border-grey-5 pt-4 text-xs text-grey-3">
          This résumé has a machine-readable twin: structured{" "}
          <a href="/resume.json" className="underline-offset-2 hover:text-ink">
            JSON Resume
          </a>{" "}
          and embedded schema.org metadata — same facts, nothing hidden.
        </p>
      </div>
    </main>
  );
}

function Section({
  title,
  tight,
  children,
}: {
  title: string;
  tight?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={tight ? "mt-0" : "mt-7"}>
      <h2 className="mb-3 border-b border-grey-4 pb-1 text-[0.72rem] font-bold uppercase tracking-[0.04em] text-brand">
        {title}
      </h2>
      {children}
    </section>
  );
}
