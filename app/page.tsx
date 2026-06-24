import Link from "next/link";
import { PROJECTS } from "@/lib/projects";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white">
      {/* ── Top bar ── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
        <span
          className="text-lg tracking-tight text-white"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          Creative Clankers
        </span>
        <span className="hidden text-xs uppercase tracking-[0.18em] text-white/45 sm:block">
          Portfolio · Kristian Andersen
        </span>
      </header>

      {/* ── Hero — the black wordmark moment ── */}
      <section className="flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
        <p className="mb-8 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-white/50">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-human" />
          Design · Frontend · AI
        </p>

        <h1
          className="text-balance text-6xl leading-[0.95] tracking-tight text-white sm:text-8xl"
          style={{ fontFamily: "var(--font-brand)" }}
        >
          Creative Clankers
        </h1>

        <p className="mt-8 max-w-xl text-lg text-white/60">
          Where craft meets code —{" "}
          <span className="brand-gradient-text font-medium">
            the future is human.
          </span>
        </p>

        <div className="mt-10 h-px w-24 brand-gradient-bg" />

        <Link
          href={PROJECTS[0]?.href ?? "/studio"}
          className="group mt-10 inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3 text-sm text-white/90 transition-colors hover:border-white/60"
        >
          See the work
          <span className="transition-transform group-hover:translate-y-0.5">↓</span>
        </Link>
      </section>

      {/* ── Work ── */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-10">
        <h2 className="mb-6 text-center text-xs font-medium uppercase tracking-[0.24em] text-white/45">
          Selected work
        </h2>

        <div className="grid gap-5 md:grid-cols-2">
          {PROJECTS.map((p) => (
            <Link
              key={p.slug}
              href={p.href}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-7 transition-all hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.05]"
            >
              <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 brand-gradient-bg transition-transform duration-300 group-hover:scale-x-100" />
              <div className="mb-4 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-white/80">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-human" />
                  Live
                </span>
                <span className="text-xs text-white/35">{p.year}</span>
              </div>

              <h3
                className="text-3xl tracking-tight text-white"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {p.title}
              </h3>
              <p className="mt-1 text-sm font-medium brand-gradient-text">
                {p.tagline}
              </p>

              <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-white/55">
                {p.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {p.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-white/12 px-2.5 py-1 text-xs text-white/50"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <span className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-white">
                Open the project
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </span>
            </Link>
          ))}

          {/* honest placeholder — no fake projects */}
          <div className="flex items-center justify-center rounded-2xl border border-dashed border-white/12 p-7 text-center text-sm text-white/30">
            More projects in progress.
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-sm text-white/40 sm:flex-row sm:items-center">
          <span
            className="text-base text-white/70"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            Creative Clankers
          </span>
          <span>Augment people with AI — don&rsquo;t replace them.</span>
        </div>
      </footer>
    </main>
  );
}
