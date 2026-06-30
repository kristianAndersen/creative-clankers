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

const MARKETS = [
  { code: "DK", leads: "4,280", pct: 33 },
  { code: "NO", leads: "3,150", pct: 25 },
  { code: "FI", leads: "2,820", pct: 22 },
  { code: "SE", leads: "2,590", pct: 20 },
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
          background: "rgba(15, 20, 26, 0.92)",
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
          {/* subtle grid texture */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "linear-gradient(to right, rgba(52,211,153,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(52,211,153,0.03) 1px, transparent 1px)",
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
                "radial-gradient(ellipse at center, rgba(52,211,153,0.06) 0%, transparent 70%)",
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
                border: "1px solid rgba(52, 211, 153, 0.2)",
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

        {/* ── Section 2: App in Action (Dashboard Mockup) ── */}
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
                margin: "0.75rem 0 2.5rem",
                maxWidth: 520,
              }}
            >
              One dashboard. Every market. Every week.
            </h2>

            {/* Dashboard mockup window */}
            <div
              className="mos-animate"
              data-delay="120"
              style={{
                background: "#0A0F15",
                border: "1px solid var(--mos-rule-bright)",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow:
                  "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(52,211,153,0.05)",
              }}
            >
              {/* Window chrome / titlebar */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "10px 16px",
                  borderBottom: "1px solid var(--mos-rule)",
                  background: "#07090E",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#FF5F57",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#FEBC2E",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "#28C840",
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    marginLeft: 16,
                    fontSize: "0.72rem",
                    color: "var(--mos-ink-faint)",
                    fontWeight: 500,
                  }}
                >
                  MarketingOS — Mission Control
                </span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span className="mos-live-dot" style={{ width: 6, height: 6 }} />
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: "var(--mos-accent)",
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                    }}
                  >
                    LIVE
                  </span>
                </div>
              </div>

              {/* Tab bar */}
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid var(--mos-rule)",
                  padding: "0 16px",
                  background: "#09101A",
                }}
              >
                {["Weekly Report", "Surveillance", "Exec View"].map((tab, i) => (
                  <div
                    key={tab}
                    style={{
                      padding: "9px 16px",
                      fontSize: "0.73rem",
                      fontWeight: i === 0 ? 600 : 400,
                      color: i === 0 ? "var(--mos-accent)" : "var(--mos-ink-faint)",
                      borderBottom:
                        i === 0
                          ? "2px solid var(--mos-accent)"
                          : "2px solid transparent",
                      cursor: "default",
                      userSelect: "none",
                    }}
                  >
                    {tab}
                  </div>
                ))}
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    padding: "0 4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "var(--mos-ink-faint)",
                    }}
                  >
                    W25, 2024 · Agent ran 42 min ago · Next: Mon 07:00
                  </span>
                </div>
              </div>

              {/* Dashboard body */}
              <div style={{ padding: "16px 20px 20px" }}>
                {/* KPI tiles row */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 10,
                    marginBottom: 14,
                  }}
                >
                  {[
                    { label: "Total Leads", value: "12,840", delta: "+8.4% WoW", up: true },
                    { label: "Blended CAC", value: "€42.10", delta: "−3.2% WoW", up: true },
                    { label: "Paid ROAS", value: "4.8×", delta: "+0.6× WoW", up: true },
                    { label: "Budget vs Plan", value: "97.2%", delta: "−2.8pp", up: false },
                  ].map((kpi) => (
                    <div key={kpi.label} className="mos-kpi-tile">
                      <div className="mos-kpi-label">{kpi.label}</div>
                      <div className="mos-kpi-value">{kpi.value}</div>
                      <div className={`mos-kpi-delta ${kpi.up ? "up" : "down"}`}>
                        {kpi.up ? "↑" : "↓"} {kpi.delta}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Chart + Markets side by side */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 240px",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  {/* Trend chart */}
                  <div
                    style={{
                      background: "var(--mos-surface-raised)",
                      border: "1px solid var(--mos-rule)",
                      borderRadius: 8,
                      padding: "12px 16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "baseline",
                        marginBottom: 10,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: "var(--mos-ink-faint)",
                        }}
                      >
                        Total Leads — 6-week trend
                      </span>
                      <span
                        style={{
                          fontSize: "0.65rem",
                          color: "var(--mos-accent)",
                          fontWeight: 500,
                        }}
                      >
                        All markets combined
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 320 72"
                      preserveAspectRatio="none"
                      style={{ width: "100%", height: 72, display: "block" }}
                      aria-hidden
                    >
                      <defs>
                        <linearGradient id="mosChartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#34D399" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {/* Grid lines */}
                      <line x1="0" y1="18" x2="320" y2="18" stroke="#1C2836" strokeWidth="1" />
                      <line x1="0" y1="36" x2="320" y2="36" stroke="#1C2836" strokeWidth="1" />
                      <line x1="0" y1="54" x2="320" y2="54" stroke="#1C2836" strokeWidth="1" />
                      {/* Area fill */}
                      <polygon
                        points="0,72 0,66 64,54 128,43 192,37 256,26 320,11 320,72"
                        fill="url(#mosChartGrad)"
                      />
                      {/* Line */}
                      <polyline
                        points="0,66 64,54 128,43 192,37 256,26 320,11"
                        fill="none"
                        stroke="#34D399"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Data points */}
                      {([[0, 66], [64, 54], [128, 43], [192, 37], [256, 26], [320, 11]] as [number, number][]).map(
                        ([x, y], i) => (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r={i === 5 ? 4 : 2.5}
                            fill={i === 5 ? "#34D399" : "#0A0F15"}
                            stroke="#34D399"
                            strokeWidth={i === 5 ? 0 : 1.5}
                          />
                        )
                      )}
                    </svg>
                    {/* X-axis labels */}
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: 6,
                      }}
                    >
                      {["W20", "W21", "W22", "W23", "W24", "W25"].map((w) => (
                        <span
                          key={w}
                          style={{
                            fontSize: "0.6rem",
                            color: "var(--mos-ink-faint)",
                          }}
                        >
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Market breakdown */}
                  <div
                    style={{
                      background: "var(--mos-surface-raised)",
                      border: "1px solid var(--mos-rule)",
                      borderRadius: 8,
                      padding: "12px 14px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: "var(--mos-ink-faint)",
                        marginBottom: 12,
                      }}
                    >
                      Market Breakdown
                    </div>
                    {MARKETS.map((m) => (
                      <div key={m.code} style={{ marginBottom: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "baseline",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "var(--mos-ink)",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {m.code}
                          </span>
                          <span
                            style={{
                              fontSize: "0.7rem",
                              color: "var(--mos-ink-mid)",
                            }}
                          >
                            {m.leads}
                          </span>
                        </div>
                        <div className="mos-market-bar-track">
                          <div
                            className="mos-market-bar-fill"
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: 14,
                        paddingTop: 10,
                        borderTop: "1px solid var(--mos-rule)",
                        fontSize: "0.65rem",
                        color: "var(--mos-ink-faint)",
                      }}
                    >
                      0 anomalies detected this week
                    </div>
                  </div>
                </div>

                {/* Agent pipeline */}
                <div
                  style={{
                    background: "var(--mos-surface-muted)",
                    border: "1px solid var(--mos-rule)",
                    borderRadius: 8,
                    padding: "12px 16px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: "var(--mos-ink-faint)",
                      marginBottom: 10,
                    }}
                  >
                    Agent Pipeline
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "stretch",
                      gap: 0,
                    }}
                  >
                    {[
                      {
                        label: "Weekly",
                        name: "Reporting Agent",
                        sub: "Mon 07:00 · Slack + email",
                        status: "✓ Complete",
                        ok: true,
                      },
                      {
                        label: "Continuous",
                        name: "Surveillance Agent",
                        sub: "Alarm threshold: 2σ",
                        status: "● Monitoring",
                        ok: true,
                      },
                      {
                        label: "Monthly",
                        name: "Exec Presentation",
                        sub: "Last week of month",
                        status: "◷ Scheduled",
                        ok: false,
                      },
                    ].map((box, i) => (
                      <div key={box.name} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                        <div className="mos-pipeline-box">
                          <div className="mos-pipeline-box-label">{box.label}</div>
                          <div className="mos-pipeline-box-name">{box.name}</div>
                          <div className="mos-pipeline-box-sub">{box.sub}</div>
                          <div
                            style={{
                              marginTop: "0.4rem",
                              fontSize: "0.62rem",
                              fontWeight: 500,
                              color: box.ok ? "var(--mos-accent)" : "var(--mos-ink-faint)",
                            }}
                          >
                            {box.status}
                          </div>
                        </div>
                        {i < 2 && (
                          <div
                            style={{
                              padding: "0 8px",
                              color: "var(--mos-ink-faint)",
                              fontSize: "0.8rem",
                              flexShrink: 0,
                            }}
                          >
                            →
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <p
              className="mos-animate"
              data-delay="200"
              style={{
                marginTop: "1.5rem",
                fontSize: "0.8rem",
                color: "var(--mos-ink-faint)",
                textAlign: "center",
              }}
            >
              Stylized mockup — representative of the actual agent output and interface
            </p>
          </div>
        </section>

        {/* ── Section 3: Features ── */}
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

        {/* ── Section 4: How It Works ── */}
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
            <span className="mos-section-label mos-fade-slide">03 — Process</span>
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
                  {/* Connecting arrow between steps */}
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

        {/* ── Section 5: Closing CTA ── */}
        <section
          style={{
            background: "var(--mos-dark-panel)",
            borderTop: "1px solid rgba(52, 211, 153, 0.12)",
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
                "radial-gradient(ellipse at center, rgba(52,211,153,0.07) 0%, transparent 70%)",
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
                  color: "var(--mos-accent)",
                  marginBottom: "1.5rem",
                }}
              >
                04 — Outcome
              </span>
              <h2
                className="mos-display"
                style={{
                  fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
                  marginBottom: "1.5rem",
                  maxWidth: 640,
                  color: "#fff",
                }}
              >
                The report writes itself. You just act on it.
              </h2>
              <p
                style={{
                  maxWidth: "58ch",
                  fontSize: "1.05rem",
                  lineHeight: 1.8,
                  color: "rgba(221, 228, 237, 0.65)",
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
                  borderTop: "1px solid rgba(255,255,255,0.06)",
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
                        color: "var(--mos-accent)",
                        lineHeight: 1,
                        marginBottom: "0.3rem",
                      }}
                    >
                      {s.stat}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "rgba(221, 228, 237, 0.45)",
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
                    color: "rgba(221,228,237,0.5)",
                    fontFamily: "var(--mos-font-sans)",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    textDecoration: "none",
                    borderBottom: "1px solid rgba(255,255,255,0.15)",
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
