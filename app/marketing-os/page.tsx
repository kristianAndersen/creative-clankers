"use client";

import { useEffect } from "react";
import Link from "next/link";

const FEATURES = [
  {
    num: "01",
    icon: "📊",
    title: "Weekly reporting agent",
    body: "Aggregates channel performance across four Nordic markets, surfaces the top drivers, and delivers on schedule with no manual assembly.",
    delay: 0,
  },
  {
    num: "02",
    icon: "🔔",
    title: "Surveillance agent with alarms",
    body: "Continuously watches for anomalies and abnormal swings across markets and channels, alerting before the weekly review.",
    delay: 60,
  },
  {
    num: "03",
    icon: "📋",
    title: "Monthly executive presentation agent",
    body: "Builds the leadership business review: internal results plus external market drivers, with clear conclusions and recommendations.",
    delay: 120,
  },
  {
    num: "04",
    icon: "🧠",
    title: "Compounding vault memory",
    body: "Each run writes structured findings to a persistent store and reads it first next time, so detection and institutional knowledge improve automatically.",
    delay: 0,
  },
  {
    num: "05",
    icon: "⚡",
    title: "Live BI data layer",
    body: "A custom MCP server wraps the Power BI REST API so agents generate real queries against the data warehouse instead of manual exports.",
    delay: 60,
  },
  {
    num: "06",
    icon: "💬",
    title: "Native desktop chat UI",
    body: "A lightweight macOS app gives non-technical managers a chat interface with full history, document upload (PDF/Excel), and Drive sync, no terminal required.",
    delay: 120,
  },
];

const STACK = [
  "Claude Code agents",
  "Advisor framework",
  "Electrobun (macOS)",
  "TypeScript + Bun",
  "MCP servers",
  "Power BI REST API",
  "Slack + email delivery",
];

export default function MarketingOSPage() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const targets = document.querySelectorAll<HTMLElement>(
      ".mos-animate, .mos-fade-slide, .mos-accent-rule"
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
      { threshold: 0.12 }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* ── Nav ── */}
      <header
        style={{
          borderBottom: "1px solid var(--mos-rule)",
          position: "sticky",
          top: 0,
          background: "rgba(248, 243, 232, 0.96)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 1080,
            margin: "0 auto",
            padding: "0.875rem 1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            href="/"
            className="mos-btn-secondary"
            style={{ borderBottom: "none", fontSize: "0.82rem" }}
          >
            ← Creative Clankers
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="mos-live-dot" />
            <span
              style={{
                fontSize: "0.75rem",
                color: "var(--mos-accent)",
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              MarketingOS
            </span>
          </div>
          <a
            href="#how-it-works"
            className="mos-btn-secondary"
            style={{ borderBottom: "none", fontSize: "0.82rem" }}
          >
            How it works ↓
          </a>
        </div>
      </header>

      <main>
        {/* ── Section 1: Hero ── */}
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding:
              "clamp(80px, 12vw, 140px) 1.5rem clamp(60px, 8vw, 100px)",
            borderBottom: "1px solid var(--mos-rule)",
          }}
        >
          {/* subtle warm grid texture */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(68,0,16,0.025) 1px, transparent 1px), linear-gradient(to bottom, rgba(68,0,16,0.025) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
              pointerEvents: "none",
            }}
          />
          {/* radial glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: "-20%",
              left: "-10%",
              width: "60%",
              height: "60%",
              background:
                "radial-gradient(ellipse at center, rgba(218,159,239,0.14) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}>
            <div
              className="mos-fade-slide"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                background: "var(--mos-accent-pale)",
                border: "1px solid rgba(68, 0, 16, 0.18)",
                borderRadius: "100px",
                padding: "0.3rem 0.85rem",
                marginBottom: "2rem",
              }}
            >
              <span className="mos-live-dot" style={{ width: 6, height: 6 }} />
              <span
                style={{
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--mos-accent)",
                }}
              >
                AI Agent Suite
              </span>
            </div>

            <h1
              className="mos-display mos-fade-slide"
              data-delay="80"
              style={{
                fontSize: "clamp(2.8rem, 7vw, 5.2rem)",
                marginBottom: "1.5rem",
                maxWidth: 720,
              }}
            >
              10x your marketing team&thinsp;—&thinsp;without replacing it.
            </h1>

            <p
              className="mos-fade-slide"
              data-delay="160"
              style={{
                maxWidth: "62ch",
                fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
                lineHeight: 1.75,
                color: "var(--mos-ink-mid)",
                marginBottom: "2.5rem",
              }}
            >
              Marketing teams at multi-market fintechs lose days each week assembling channel reports
              by hand — pulling paid-search, SEO, social and finance data, reconciling budget vs.
              actuals, and re-discovering the same patterns every cycle. MarketingOS automates the
              full reporting-and-surveillance loop: it pulls live BI data, runs cross-market
              analysis, and delivers the weekly summary straight to Slack every Monday —
              automatically. A persistent vault memory means each run learns from the last, so
              insight compounds instead of starting from zero.
            </p>

            <div
              className="mos-fade-slide"
              data-delay="240"
              style={{
                display: "flex",
                gap: "1.25rem",
                flexWrap: "wrap",
                alignItems: "center",
              }}
            >
              <a href="#app-in-action" className="mos-btn-primary">
                See it in action ↓
              </a>
              <a href="#how-it-works" className="mos-btn-secondary">
                How it works →
              </a>
            </div>

            {/* Stack chips */}
            <div
              className="mos-fade-slide"
              data-delay="320"
              style={{
                marginTop: "3rem",
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              {STACK.map((s) => (
                <span
                  key={s}
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 500,
                    color: "var(--mos-ink-faint)",
                    background: "var(--mos-surface)",
                    border: "1px solid var(--mos-rule)",
                    borderRadius: "4px",
                    padding: "0.2rem 0.6rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 2: App in Action ── */}
        <section
          id="app-in-action"
          style={{
            background: "var(--mos-surface-muted)",
            borderBottom: "1px solid var(--mos-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <span className="mos-accent-rule" />
            <span className="mos-section-label mos-fade-slide">01 — App in action</span>
            <h2
              className="mos-headline mos-fade-slide"
              data-delay="60"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
                margin: "0.75rem 0 1rem",
                maxWidth: 520,
              }}
            >
              Upload documents. Ask a question. Get a brief.
            </h2>
            <p
              className="mos-fade-slide"
              data-delay="100"
              style={{
                maxWidth: "62ch",
                fontSize: "1rem",
                lineHeight: 1.75,
                color: "var(--mos-ink-mid)",
                marginBottom: "2.5rem",
              }}
            >
              Drag in competitor PDFs, sync from Google Drive, then ask MarketingOS anything.
              It converts your documents, reasons across them, and surfaces a structured brief — sourced, formatted, and ready to act on.
            </p>

            <div className="mos-screenshot-frame mos-animate" data-delay="120">
              <img
                src="/marketing-os/marketingos-hero.png"
                alt="MarketingOS app — Documents panel showing uploaded competitor PDFs (Q2 Performance Deck, Lendo Pricing Snapshot, Axo Q1 Report) with Ready/Converted/Converting status pills and a green Sync from Google Drive button; below, a purple user bubble asking for a competitive brief on the Nordic personal-loan market; the generated Sambla Group — Nordic Personal-Loan Market Competitive Brief report beginning to appear"
              />
            </div>
          </div>
        </section>

        {/* ── Section 3: Capabilities ── */}
        <section
          style={{
            borderBottom: "1px solid var(--mos-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <span className="mos-accent-rule" />
            <span className="mos-section-label mos-fade-slide">02 — Capabilities</span>
            <h2
              className="mos-headline mos-fade-slide"
              data-delay="60"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
                margin: "0.75rem 0 2.5rem",
                maxWidth: 480,
              }}
            >
              Six agents. The full loop, automated.
            </h2>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "0.875rem",
              }}
            >
              {FEATURES.map((f) => (
                <article
                  key={f.num}
                  className="mos-card mos-animate"
                  data-delay={String(f.delay)}
                >
                  <div className="mos-card-icon" aria-hidden>
                    {f.icon}
                  </div>
                  <p className="mos-card-title">{f.title}</p>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.7,
                      color: "var(--mos-ink-mid)",
                      margin: 0,
                    }}
                  >
                    {f.body}
                  </p>
                  <span className="mos-card-num">{f.num}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: Generated reports ── */}
        <section
          id="generated-reports"
          style={{
            background: "var(--mos-surface-muted)",
            borderBottom: "1px solid var(--mos-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <span className="mos-accent-rule" />
            <span className="mos-section-label mos-fade-slide">03 — Generated reports</span>
            <h2
              className="mos-headline mos-fade-slide"
              data-delay="60"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
                margin: "0.75rem 0 1rem",
                maxWidth: 560,
              }}
            >
              From raw question to structured brief — in seconds.
            </h2>
            <p
              className="mos-fade-slide"
              data-delay="100"
              style={{
                maxWidth: "62ch",
                fontSize: "1rem",
                lineHeight: 1.75,
                color: "var(--mos-ink-mid)",
                marginBottom: "2.5rem",
              }}
            >
              The generated brief reads like a real analyst wrote it: executive summary with bold
              insight callouts, a market-position comparison table across CVR, CPC, and share of
              voice, and a "What changed this quarter" breakdown by market. Every claim is traceable
              to your uploaded sources.
            </p>

            <div className="mos-screenshot-frame mos-animate" data-delay="120">
              <img
                src="/marketing-os/marketingos-report-full.png"
                alt="Generated Sambla Group competitive brief — executive summary callout highlighting Lendo undercutting on Swedish branded CPC and Axo gaining share in Norway; Market position at a glance table comparing Sambla Group, Lendo, Axo Finans, and Zmarta on blended CVR, avg CPC, share of voice, and QoQ change; What changed this quarter bullet analysis by market"
              />
            </div>
          </div>
        </section>

        {/* ── Section 5: Persistent memory ── */}
        <section
          id="persistent-memory"
          style={{
            borderBottom: "1px solid var(--mos-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <span className="mos-accent-rule" />
            <span className="mos-section-label mos-fade-slide">04 — Persistent memory</span>
            <h2
              className="mos-headline mos-fade-slide"
              data-delay="60"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
                margin: "0.75rem 0 1rem",
                maxWidth: 520,
              }}
            >
              Every session builds on the last.
            </h2>
            <p
              className="mos-fade-slide"
              data-delay="100"
              style={{
                maxWidth: "62ch",
                fontSize: "1rem",
                lineHeight: 1.75,
                color: "var(--mos-ink-mid)",
                marginBottom: "2.5rem",
              }}
            >
              Prior sessions are pinned, tagged by priority, and instantly loadable. MarketingOS
              remembers what you've investigated — the vault compounds with every run, so detection
              improves automatically and institutional knowledge stops living in someone's inbox.
            </p>

            <div className="mos-screenshot-frame mos-animate" data-delay="120">
              <img
                src="/marketing-os/marketingos-memory.png"
                alt="MarketingOS Prior sessions panel showing pinned past sessions: Swedish brand-defence audit (HIGH priority, 2026-06-12), Norway broker-payout teardown (HIGH priority, 2026-05-28), Finland prospecting feasibility (MEDIUM priority, 2026-05-09) — with a burgundy Load history button at top"
              />
            </div>
          </div>
        </section>

        {/* ── Section 6: How It Works ── */}
        <section
          id="how-it-works"
          style={{
            background: "var(--mos-surface-muted)",
            borderBottom: "1px solid var(--mos-rule)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
          }}
        >
          <div style={{ maxWidth: 1080, margin: "0 auto" }}>
            <span className="mos-accent-rule" />
            <span className="mos-section-label mos-fade-slide">05 — Process</span>
            <h2
              className="mos-headline mos-fade-slide"
              data-delay="60"
              style={{
                fontSize: "clamp(1.7rem, 3.5vw, 2.6rem)",
                margin: "0.75rem 0 3rem",
                maxWidth: 480,
              }}
            >
              From raw data to your inbox.
            </h2>

            {/* Flow diagram */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "1.25rem",
                alignItems: "stretch",
                marginBottom: "3rem",
              }}
            >
              {[
                {
                  num: "01",
                  icon: "🗄️",
                  title: "Live data",
                  body: "A custom MCP server connects to the Power BI data warehouse and fetches real metrics across all markets and channels — no CSV exports, no manual pulls.",
                  delay: 0,
                },
                {
                  num: "02",
                  icon: "🤖",
                  title: "Agents run",
                  body: "The weekly reporting, surveillance, and executive presentation agents each pick up the latest data, cross-reference vault memory from prior runs, and produce structured analysis.",
                  delay: 120,
                },
                {
                  num: "03",
                  icon: "📬",
                  title: "Delivered to you",
                  body: "The weekly summary arrives in Slack on Monday morning. Alarms fire immediately when anomalies are detected. The executive presentation builds to a final slide deck, on schedule.",
                  delay: 240,
                },
              ].map((step, i) => (
                <div
                  key={step.num}
                  className="mos-animate"
                  data-delay={String(step.delay)}
                  style={{
                    flex: "1 1 260px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    padding: "1.5rem",
                    background: "var(--mos-surface-card)",
                    border: "1px solid var(--mos-rule)",
                    borderRadius: 10,
                    position: "relative",
                  }}
                >
                  {i < 2 && (
                    <div
                      aria-hidden
                      style={{
                        position: "absolute",
                        right: -28,
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.1rem",
                        color: "var(--mos-ink-faint)",
                        zIndex: 2,
                        display: "window" in globalThis ? undefined : "none",
                      }}
                    >
                      →
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                    }}
                  >
                    <div className="mos-step-badge">{step.num}</div>
                    <span style={{ fontSize: "1.25rem" }} aria-hidden>
                      {step.icon}
                    </span>
                  </div>
                  <h3 className="mos-step-title">{step.title}</h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      lineHeight: 1.75,
                      color: "var(--mos-ink-mid)",
                      margin: 0,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              ))}
            </div>

            {/* Who it's for */}
            <div
              className="mos-animate"
              style={{
                borderTop: "1px solid var(--mos-rule)",
                paddingTop: "2.5rem",
                display: "grid",
                gridTemplateColumns: "minmax(160px, 24%) 1fr",
                gap: "2rem",
              }}
            >
              <div>
                <span className="mos-accent-rule" />
                <p
                  style={{
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: "var(--mos-ink)",
                    letterSpacing: "0.02em",
                  }}
                >
                  Built for them.
                </p>
              </div>
              <p
                style={{
                  fontSize: "0.95rem",
                  lineHeight: 1.8,
                  color: "var(--mos-ink-mid)",
                  margin: 0,
                }}
              >
                Country marketing managers at a multi-market Nordic fintech — covering DK, NO, FI, and SE —
                who receive the weekly Slack summary and can access the chat app without opening a terminal.
                The vault memory means every market manager benefits from patterns detected in any market,
                automatically surfaced in the next run.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 7: Closing CTA ── */}
        <section
          style={{
            background: "var(--mos-dark-panel)",
            borderTop: "1px solid rgba(68, 0, 16, 0.15)",
            padding: "clamp(80px, 12vw, 140px) 1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* accent radial */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              bottom: "-30%",
              right: "-10%",
              width: "50%",
              height: "70%",
              background:
                "radial-gradient(ellipse at center, rgba(218,159,239,0.12) 0%, transparent 70%)",
              pointerEvents: "none",
            }}
          />

          <div
            style={{ maxWidth: 1080, margin: "0 auto", position: "relative" }}
          >
            <div className="mos-animate">
              <span
                style={{
                  display: "inline-block",
                  fontSize: "0.68rem",
                  fontWeight: 600,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#DA9FEF",
                  marginBottom: "1.5rem",
                }}
              >
                06 — Outcome
              </span>
              <h2
                className="mos-display"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                  marginBottom: "1.5rem",
                  maxWidth: 640,
                  color: "#FDEEF2",
                }}
              >
                The report writes itself. You just act on it.
              </h2>
              <p
                style={{
                  maxWidth: "58ch",
                  fontSize: "1.05rem",
                  lineHeight: 1.8,
                  color: "rgba(253, 238, 242, 0.75)",
                  marginBottom: "2.5rem",
                }}
              >
                MarketingOS is a suite of AI agents that automates the full
                reporting-and-surveillance loop for multi-market fintech marketing teams.
                Live BI data in, structured Slack report out — every Monday, every market,
                compounding in knowledge with every run.
              </p>

              {/* Stat strip */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "2rem",
                  marginBottom: "3rem",
                  paddingTop: "2rem",
                  borderTop: "1px solid rgba(253, 238, 242, 0.08)",
                }}
              >
                {[
                  { stat: "4", label: "markets covered" },
                  { stat: "3", label: "agent types" },
                  { stat: "Monday 07:00", label: "weekly delivery" },
                  { stat: "∞", label: "compounding memory" },
                ].map((s) => (
                  <div key={s.label}>
                    <div
                      style={{
                        fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                        fontWeight: 700,
                        letterSpacing: "-0.03em",
                        color: "#DA9FEF",
                        lineHeight: 1,
                        marginBottom: "0.3rem",
                      }}
                    >
                      {s.stat}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(253, 238, 242, 0.5)",
                        fontWeight: 500,
                      }}
                    >
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1.25rem",
                  flexWrap: "wrap",
                  alignItems: "center",
                }}
              >
                <Link
                  href="/#work"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    color: "rgba(253, 238, 242, 0.55)",
                    fontFamily: "var(--mos-font-sans)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(253, 238, 242, 0.18)",
                    paddingBottom: "0.125rem",
                    transition: "color 0.2s",
                  }}
                >
                  ← Back to the work
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
