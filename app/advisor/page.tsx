"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AdvisorPage() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const targets = document.querySelectorAll<HTMLElement>(
      ".adv-animate, .adv-fade-slide, .adv-amber-rule"
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = el.dataset.delay ?? "0";
            setTimeout(() => el.classList.add("is-visible"), Number(delay));
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* ── Nav ── */}
      <header
        style={{
          borderBottom: "1px solid var(--adv-rule)",
          position: "sticky",
          top: 0,
          background: "var(--adv-bg)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1024,
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            className="adv-btn-secondary"
            style={{ borderBottom: "none", fontSize: "0.85rem" }}
          >
            ← Creative Clankers
          </Link>
          <a
            href="#how-it-works"
            className="adv-btn-secondary"
            style={{ borderBottom: "none" }}
          >
            See how it works
          </a>
        </div>
      </header>

      <main>
        {/* ── Section 1: Hero ── */}
        <section
          style={{
            maxWidth: 1024,
            margin: "0 auto",
            padding: "clamp(80px, 12vw, 140px) 1.5rem clamp(60px, 8vw, 100px)",
          }}
        >
          <div style={{ maxWidth: 700 }}>
            <h1
              className="adv-display adv-fade-slide"
              style={{ fontSize: "clamp(2.8rem, 7vw, 5rem)", marginBottom: "1.5rem" }}
            >
              Meet Advisor
            </h1>
            <p
              className="adv-fade-slide"
              data-delay="80"
              style={{
                fontFamily: "var(--adv-font-serif)",
                fontSize: "clamp(1.3rem, 2.5vw, 1.8rem)",
                fontWeight: 400,
                lineHeight: 1.3,
                color: "var(--adv-ink-mid)",
                marginBottom: "1.5rem",
              }}
            >
              Your work, handled by a team that never loses the plot.
            </p>
            <p
              className="adv-fade-slide"
              data-delay="160"
              style={{
                maxWidth: "60ch",
                fontSize: "1.05rem",
                lineHeight: 1.7,
                color: "var(--adv-ink-mid)",
                marginBottom: "2.5rem",
              }}
            >
              Most AI tools give you one assistant juggling everything at once —
              until it starts forgetting things and cutting corners. Advisor takes
              a different approach. One sharp coordinator. Dedicated specialists.
              One coherent answer.
            </p>
            <div
              className="adv-fade-slide"
              data-delay="240"
              style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}
            >
              <a href="#how-it-works" className="adv-btn-primary">
                See how it works ↓
              </a>
              <a
                href="https://github.com/kristianDKAndersen/advisor"
                target="_blank"
                rel="noopener noreferrer"
                className="adv-btn-secondary"
              >
                Read the source →
              </a>
            </div>
          </div>
        </section>

        {/* ── Section 2: The Core Idea ── */}
        <section
          style={{
            borderTop: "1px solid var(--adv-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="adv-amber-rule" />
            <span className="adv-section-label adv-fade-slide">01 — The Idea</span>
            <h2
              className="adv-headline adv-fade-slide"
              data-delay="60"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: "1rem 0 2rem", maxWidth: 600 }}
            >
              A chief of staff, not a lone assistant.
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "2rem",
                maxWidth: 700,
              }}
            >
              <p
                className="adv-animate"
                style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "var(--adv-ink-mid)" }}
              >
                When you bring a chief of staff a big request, they break it into
                clear assignments, hand each one to the right person, check the work
                as it comes back, and return to you with one coherent answer.
              </p>
              <p
                className="adv-animate"
                data-delay="80"
                style={{ fontSize: "1.05rem", lineHeight: 1.8, color: "var(--adv-ink-mid)" }}
              >
                That&rsquo;s exactly what Advisor does. It reads your request, splits it
                into well-defined tasks, and summons a specialist for each one: a
                researcher, a planner, a code reviewer, a writer. Each specialist gets
                a precise assignment — what to do, what the finished result should look
                like, and what&rsquo;s explicitly not their job. They work in their own clean
                space, deliver their result, and step away. Advisor then weaves
                everything into a single answer.
              </p>
              <blockquote
                className="adv-pull-quote adv-animate"
                data-delay="160"
                style={{
                  borderLeft: "3px solid var(--adv-amber)",
                  paddingLeft: "1.5rem",
                  margin: "1rem 0",
                }}
              >
                No single helper trying to hold your entire project in its head.
                A coordinated team, each member doing what they&rsquo;re best at.
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── Section 3: Capabilities ── */}
        <section
          style={{
            background: "var(--adv-surface-muted)",
            borderTop: "1px solid var(--adv-rule)",
            borderBottom: "1px solid var(--adv-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="adv-amber-rule" />
            <span className="adv-section-label adv-fade-slide">02 — Capabilities</span>
            <h2
              className="adv-headline adv-fade-slide"
              data-delay="60"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: "1rem 0 2.5rem", maxWidth: 500 }}
            >
              What you can do with it.
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "1rem",
                marginBottom: "2.5rem",
              }}
            >
              {[
                {
                  num: "01",
                  title: "Real research, not a quick skim",
                  body: "Multiple researchers, each covering a different angle, with sources cited for every meaningful claim. A grounded report instead of a confident guess.",
                  delay: 0,
                },
                {
                  num: "02",
                  title: "Code review by a dedicated critic",
                  body: "A reviewer whose only job is finding problems looks at your work — it doesn't write code, so it has no incentive to go easy on itself.",
                  delay: 80,
                },
                {
                  num: "03",
                  title: "Fuzzy goal → concrete plan",
                  body: "Ordered steps, what can happen in parallel, what \"done\" means for each piece — before anyone touches anything.",
                  delay: 160,
                },
                {
                  num: "04",
                  title: "Bugs fixed with proof",
                  body: "Doesn't just say \"fixed.\" First demonstrates the bug, then shows the fix making it go away — evidence included, every time.",
                  delay: 80,
                },
                {
                  num: "05",
                  title: "Run a competition",
                  body: "Several specialists each build their own version using genuinely different approaches, then every entry goes through the same tests. The best solution wins by results, not opinion.",
                  delay: 160,
                  wide: true,
                },
                {
                  num: "06",
                  title: "Documents and pages written",
                  body: "Reports, write-ups, web pages, specs — handled by specialists who deliver finished files, not rough drafts you have to rescue.",
                  delay: 240,
                },
              ].map((card) => (
                <article
                  key={card.num}
                  className={`adv-card adv-animate${card.wide ? " adv-card-wide" : ""}`}
                  data-delay={String(card.delay)}
                  style={card.wide ? { gridColumn: "1 / -1" } : undefined}
                >
                  <p className="adv-feature-title">{card.title}</p>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.7, color: "var(--adv-ink-mid)" }}>
                    {card.body}
                  </p>
                  <span className="adv-card-num">{card.num}</span>
                </article>
              ))}
            </div>

            <p
              className="adv-animate"
              style={{
                textAlign: "center",
                fontFamily: "var(--adv-font-serif)",
                fontSize: "clamp(1.1rem, 2vw, 1.4rem)",
                fontStyle: "italic",
                color: "var(--adv-ink-mid)",
                maxWidth: 600,
                margin: "0 auto",
              }}
            >
              You ask once, in plain language, and the result that comes back is complete.
            </p>
          </div>
        </section>

        {/* ── Section 4: How It Works ── */}
        <section
          id="how-it-works"
          style={{
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
            borderBottom: "1px solid var(--adv-rule)",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="adv-amber-rule" />
            <span className="adv-section-label adv-fade-slide">03 — Process</span>
            <h2
              className="adv-headline adv-fade-slide"
              data-delay="60"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: "1rem 0 3rem", maxWidth: 500 }}
            >
              Three steps, every time.
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: "0",
                flexWrap: "wrap",
              }}
            >
              {[
                {
                  num: "01",
                  title: "Summon",
                  body: "You describe what you want. Advisor turns it into one or more precise assignments and calls up the right specialist for each.",
                  delay: 0,
                },
                {
                  num: "02",
                  title: "Work",
                  body: "Each specialist works independently in its own dedicated space, focused entirely on its one assignment. Watch the whole team work in real time, or simply wait for the answer.",
                  delay: 120,
                },
                {
                  num: "03",
                  title: "Report",
                  body: "Each specialist hands back its finished work. Advisor checks it, pulls everything together, and gives you one clear answer with the finished files attached.",
                  delay: 240,
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className="adv-animate"
                  data-delay={String(step.delay)}
                  style={{
                    flex: "1 1 220px",
                    padding: "0 2rem 0 0",
                    borderRight: i < 2 ? "1px solid var(--adv-rule)" : "none",
                    marginRight: i < 2 ? "2rem" : 0,
                    paddingBottom: "1.5rem",
                  }}
                >
                  <div className="adv-step-num">{step.num}</div>
                  <h3 className="adv-step-title">{step.title}</h3>
                  <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "var(--adv-ink-mid)" }}>
                    {step.body}
                  </p>
                </div>
              ))}
            </div>

            <p
              className="adv-animate"
              style={{
                marginTop: "3rem",
                paddingTop: "2rem",
                borderTop: "1px solid var(--adv-rule)",
                maxWidth: "55ch",
                fontSize: "0.95rem",
                lineHeight: 1.75,
                color: "var(--adv-ink-faint)",
              }}
            >
              If something needs another pass — &ldquo;make it shorter,&rdquo; &ldquo;now cover the
              budget side&rdquo; — Advisor simply sends a fresh specialist to refine it.
              You never have to manage any of this yourself.
            </p>
          </div>
        </section>

        {/* ── Section 5: Why Built This Way ── */}
        <section
          style={{
            background: "var(--adv-surface-muted)",
            borderBottom: "1px solid var(--adv-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="adv-amber-rule" />
            <span className="adv-section-label adv-fade-slide">04 — Rationale</span>
            <h2
              className="adv-headline adv-fade-slide"
              data-delay="60"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: "1rem 0 3rem", maxWidth: 500 }}
            >
              Why it&rsquo;s built this way.
            </h2>

            {[
              {
                label: "Focus produces better work.",
                body: "A specialist with one clear assignment and nothing else on its mind does sharper work than a generalist juggling ten threads. Every assignment comes with explicit boundaries, so no one drifts off-topic or duplicates someone else's effort.",
                delay: 0,
              },
              {
                label: "No overload.",
                body: "AI assistants degrade when they're asked to hold too much at once — details blur, instructions slip. Advisor keeps every helper's workload small and clean: one task, one workspace, one result. The coordinator stays clear-headed too, because it delegates the heavy lifting instead of doing it all itself.",
                delay: 100,
              },
              {
                label: `Nothing gets forgotten.`,
                body: `After every piece of work comes back, Advisor records what was established and what questions remain in writing, not just in memory. Long projects don’t dissolve into ‘wait, what did we decide?’ When an assistant’s working memory fills up, Advisor saves its place first and picks up exactly where it left off. A reset is a pause, not a restart.`,
                delay: 200,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="adv-animate"
                data-delay={String(item.delay)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(180px, 28%) 1fr",
                  gap: "2rem",
                  paddingBlock: "2rem",
                  borderTop: "1px solid var(--adv-rule)",
                }}
              >
                <div>
                  <span
                    className="adv-amber-rule"
                    style={{ animationDelay: `${item.delay}ms` }}
                  />
                  <p className="adv-rationale-label">{item.label}</p>
                </div>
                <p style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--adv-ink-mid)" }}>
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 6: Your Work Is Never Lost ── */}
        <section
          style={{
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
            borderBottom: "1px solid var(--adv-rule)",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="adv-amber-rule" />
            <span className="adv-section-label adv-fade-slide">05 — Durability</span>
            <h2
              className="adv-headline adv-fade-slide"
              data-delay="60"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: "1rem 0 2rem", maxWidth: 500 }}
            >
              Your work is never lost.
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "2.5rem",
                marginBottom: "3rem",
                maxWidth: 800,
              }}
            >
              <p className="adv-animate" style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--adv-ink-mid)" }}>
                Before anything is cleaned away — by anyone, for any reason — every
                file is copied to permanent storage first. If that copy can&rsquo;t be made,
                the cleanup refuses to happen. Deletion waits for safekeeping, never the
                other way around.
              </p>
              <p className="adv-animate" data-delay="80" style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--adv-ink-mid)" }}>
                The automatic janitor that sweeps up old workspaces knows the difference
                between clutter and fresh work. Anything just getting started, or still
                being set up, is left untouched — there&rsquo;s no race between cleanup and a
                specialist that only began a moment ago.
              </p>
              <p className="adv-animate" data-delay="160" style={{ fontSize: "1rem", lineHeight: 1.8, color: "var(--adv-ink-mid)" }}>
                If something crashes mid-task, the system heals itself: no stuck files,
                no half-written records. Should a session ever stall, a built-in check-up
                examines it and reports exactly where things stand — you&rsquo;re diagnosing in
                seconds, not guessing.
              </p>
            </div>

            <div
              className="adv-animate"
              style={{
                borderTop: "3px solid var(--adv-amber)",
                paddingTop: "2rem",
                maxWidth: 640,
              }}
            >
              <blockquote className="adv-pull-quote">
                Deletion waits for safekeeping, never the other way around.
              </blockquote>
            </div>
          </div>
        </section>

        {/* ── Section 7: What Sets It Apart ── */}
        <section
          style={{
            background: "var(--adv-surface-muted)",
            borderBottom: "1px solid var(--adv-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="adv-amber-rule" />
            <span className="adv-section-label adv-fade-slide">06 — What&rsquo;s different</span>
            <h2
              className="adv-headline adv-fade-slide"
              data-delay="60"
              style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: "1rem 0 2.5rem", maxWidth: 500 }}
            >
              What sets it apart.
            </h2>

            <div style={{ maxWidth: 800 }}>
              {[
                {
                  title: "Parallel helpers",
                  body: "Independent tasks run at the same time, not one after another. Ask a question with five angles, and five researchers start at once — each with its own assigned territory so they never cover the same ground twice.",
                  delay: 0,
                },
                {
                  title: "Right brainpower for each job",
                  body: "Not every task deserves the heaviest thinking. Advisor dials each specialist's intelligence to fit the assignment — quick and economical for routine work, stepping up to Fable 5, the most capable model available, for the problems that genuinely need it.",
                  delay: 80,
                },
                {
                  title: "Memory that gets smarter",
                  body: "When an approach fails, the failure is written into a permanent vault as a concrete rule, and that rule is handed to the next specialist before it starts — not after it stumbles. The same mistake doesn't happen twice.",
                  delay: 160,
                },
                {
                  title: "Sees your codebase as a whole",
                  body: "Builds a living map of how everything in your codebase connects: what calls what, what depends on what. Reviewers catch ripple effects a file-by-file reader would never spot — the function that looks safe to change until you see who relies on it.",
                  delay: 0,
                },
                {
                  title: "Marathon projects don't choke",
                  body: "Periodically compresses repetitive chatter while keeping every decision, conclusion, and record that matters — like turning a week of meeting transcripts into clean minutes. The team stays fast on day ten the way it was on day one.",
                  delay: 80,
                },
                {
                  title: "Built-in double-checking",
                  body: "An evaluator scores each deliverable for accuracy, completeness, and source quality — and if the work falls short, Advisor sends it back for another round before you ever see it.",
                  delay: 160,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="adv-diff-item adv-animate"
                  data-delay={String(item.delay)}
                >
                  <span className="adv-diff-dot" />
                  <div>
                    <p className="adv-diff-title">{item.title}</p>
                    <p style={{ fontSize: "0.95rem", lineHeight: 1.75, color: "var(--adv-ink-mid)", margin: 0 }}>
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 8: Closing CTA ── */}
        <section className="adv-dark-panel-section adv-animate">
          <div
            style={{
              maxWidth: 1024,
              margin: "0 auto",
              padding: "clamp(80px, 12vw, 140px) 1.5rem",
            }}
          >
            <h2
              className="adv-display"
              style={{
                fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
                marginBottom: "2rem",
                maxWidth: 600,
                color: "#ffffff",
              }}
            >
              You bring the goal. It brings the team.
            </h2>
            <p
              style={{
                maxWidth: "62ch",
                fontSize: "1.05rem",
                lineHeight: 1.8,
                color: "rgba(255,255,255,0.7)",
                marginBottom: "2.5rem",
              }}
            >
              Advisor is a chief of staff for your AI: it breaks your request into
              focused assignments, matches each one with the right level of
              intelligence, runs them through dedicated specialists — in parallel
              where possible — lets you watch it all live, double-checks the
              results, keeps every file safe no matter what, learns from every
              project, and hands you one finished answer.
            </p>
            <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
              <a
                href="https://github.com/kristianDKAndersen/advisor"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--adv-amber)",
                  color: "#ffffff",
                  fontFamily: "var(--adv-font-sans)",
                  fontWeight: 500,
                  fontSize: "0.9rem",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                Explore the source code →
              </a>
              <Link
                href="/#work"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  color: "rgba(255,255,255,0.55)",
                  fontFamily: "var(--adv-font-sans)",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "0.125rem",
                  transition: "color 0.2s",
                }}
              >
                ← Back to the work
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
