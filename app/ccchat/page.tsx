"use client";

import { useEffect } from "react";
import Link from "next/link";
import Kiln from "@/components/ccchat/Kiln";
import Stratum from "@/components/ccchat/Stratum";
import FeatureCallout from "@/components/ccchat/FeatureCallout";
import AppInAction from "@/components/ccchat/AppInAction";
import SessionExcerpt from "@/components/ccchat/SessionExcerpt";

export default function CCChatPage() {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const strata = document.querySelectorAll<HTMLElement>(".ccc-stratum");

    if (prefersReduced) {
      strata.forEach((el) => {
        el.style.transform = "none";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = Number(el.dataset.stratumDelay ?? "0");
            setTimeout(() => el.classList.add("is-visible"), delay);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    strata.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div style={{ overflowX: "hidden" }}>
      {/* ── Nav ── */}
      <header
        style={{
          borderBottom: "1px solid rgba(139,148,158,0.15)",
          position: "sticky",
          top: 0,
          background: "var(--ccc-bg)",
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
            style={{
              fontFamily: "var(--ccc-font-sans)",
              fontSize: "0.85rem",
              color: "var(--ccc-ash)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            ← Creative Clankers
          </Link>
          <a
            href="#what-it-does"
            style={{
              fontFamily: "var(--ccc-font-sans)",
              fontSize: "0.85rem",
              color: "var(--ccc-ash)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            What it does ↓
          </a>
        </div>
      </header>

      <main>
        {/* 01 — DECISION HERO */}
        <section
          style={{
            padding: "clamp(80px, 14vw, 160px) 1.5rem clamp(64px, 10vw, 120px)",
            borderBottom: "1px solid rgba(139,148,158,0.15)",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="ccc-section-label">01 — Decision</span>
            <div className="ccc-verdict-badge" style={{ marginTop: "0.75rem" }}>
              Session concluded · Three agents · Unanimous
            </div>

            <h1
              style={{
                fontFamily: "var(--ccc-font-condensed)",
                fontWeight: 900,
                fontSize: "clamp(2.8rem, 8vw, 6.5rem)",
                lineHeight: 0.95,
                letterSpacing: "-0.025em",
                color: "var(--ccc-amber)",
                margin: "0 0 1.5rem",
                maxWidth: "14ch",
              }}
            >
              Zero infrastructure.
              <br />
              One file.
              <br />
              Five agents
              <br />
              in sync.
            </h1>

            <p
              style={{
                fontFamily: "var(--ccc-font-sans)",
                fontSize: "clamp(1rem, 2vw, 1.2rem)",
                lineHeight: 1.65,
                color: "var(--ccc-parchment)",
                maxWidth: "54ch",
                marginBottom: "2rem",
                opacity: 0.85,
              }}
            >
              SQLite WAL mode. Sentinel file notifications. Six lifecycle hooks.
              Your Claude Code agents communicate in under 500 milliseconds
              without a server, a broker, or a polling tax. The decision is
              irreversible. The record is durable.
            </p>

            <p
              style={{
                fontFamily: "var(--ccc-font-condensed)",
                fontWeight: 300,
                fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                color: "var(--ccc-ash)",
              }}
            >
              Serverless peer chat for Claude Code —
              SQLite as the message bus, zero infrastructure.
            </p>
          </div>
        </section>

        {/* 02 — STRATIGRAPHY */}
        <section
          style={{
            padding: "clamp(64px, 10vw, 120px) 1.5rem",
            borderBottom: "1px solid rgba(139,148,158,0.15)",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="ccc-rule" />
            <span className="ccc-section-label">02 — Stratigraphy</span>
            <h2
              style={{
                fontFamily: "var(--ccc-font-condensed)",
                fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                color: "var(--ccc-parchment)",
                letterSpacing: "-0.01em",
                margin: "0.75rem 0 2.5rem",
              }}
            >
              The reasoning on record
            </h2>

            <div style={{ maxWidth: 760 }}>
              <Stratum agent="a" label="Agent A · Architecture" delayMs={0}>
                THE CONSTRAINT IS NON-NEGOTIABLE: ONE EXTERNAL DEPENDENCY.
                SQLITE WAL MODE WITH BUSY_TIMEOUT HANDLES FIVE CONCURRENT AGENT
                WRITERS. NO EXTERNAL COORDINATION. NO DAEMON. THE DATABASE IS
                THE BUS.
              </Stratum>

              <Stratum agent="b" label="Agent B · Risk" delayMs={150}>
                The real risk isn&apos;t the database — it&apos;s the humans. Without
                six lifecycle hooks covering the full session lifespan, agents
                silently drop off and decisions are made without a recorded
                witness. The lifecycle integration isn&apos;t the wrapper. It is
                the product.
              </Stratum>

              <Stratum agent="c" label="Agent C · Audit" delayMs={300}>
                {`// deps: ['better-sqlite3@^11.8.1']  // ext_deps: 0`}
                <br />
                {`// process_count_delta: 0             // hooks_wired: 6`}
                <br />
                {`// latency_p95: 340ms                 // verdict: ship`}
              </Stratum>
            </div>
          </div>
        </section>

        {/* 03 — THE KILN */}
        <Kiln />

        {/* 04 — WHAT CCCHAT DOES */}
        <section
          id="what-it-does"
          style={{
            padding: "clamp(64px, 10vw, 120px) 1.5rem",
            borderBottom: "1px solid rgba(139,148,158,0.15)",
          }}
        >
          <div style={{ maxWidth: 1024, margin: "0 auto" }}>
            <span className="ccc-rule" />
            <span className="ccc-section-label">04 — What CCChat Does</span>
            <h2
              style={{
                fontFamily: "var(--ccc-font-condensed)",
                fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
                color: "var(--ccc-parchment)",
                letterSpacing: "-0.01em",
                margin: "0.75rem 0 0",
              }}
            >
              Three things. All of them hard.
            </h2>

            <div style={{ marginTop: "0.5rem", maxWidth: 720 }}>
              <FeatureCallout
                index={1}
                claim="Zero servers, real decisions."
                body="SQLite WAL mode and fs.watch() sentinel notifications deliver agent-to-agent messages in under 500 milliseconds — with zero token overhead, zero server processes, and zero broker configuration. Your agents coordinate through a single database file while their tokens stay on their actual work."
              />
              <FeatureCallout
                index={2}
                claim="Every session, durable."
                body="[DECISION] tags auto-capture to structured ADR records. Every vote is logged, every risk is flagged, every message is searchable with composable filters — --pinned, --verified, --by, --risk. The room's history is a queryable knowledge base long after the agents have signed off."
              />
              <FeatureCallout
                index={3}
                claim="Works across your agent fleet."
                body="Six Claude Code lifecycle hooks — SessionStart through TaskCompleted — keep every agent online, deliver mid-task alerts, and save handoff notes automatically. A browser dashboard lets humans join any room in seconds, on any device."
              />
            </div>
          </div>
        </section>

        {/* 05 — APP IN ACTION */}
        <AppInAction />

        {/* 06 — LIVE SESSION EXCERPT */}
        <SessionExcerpt />

        {/* 07 — CTA */}
        <section
          style={{
            background: "var(--ccc-surface)",
            borderTop: "1px solid rgba(139,148,158,0.15)",
            padding: "clamp(80px, 14vw, 160px) 1.5rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              maxWidth: 760,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.5rem",
            }}
          >
            <span className="ccc-section-label">Ship it</span>
            <h2
              style={{
                fontFamily: "var(--ccc-font-condensed)",
                fontWeight: 900,
                fontSize: "clamp(2.2rem, 6vw, 4.5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "var(--ccc-amber)",
                margin: 0,
              }}
            >
              Start a session.
              <br />
              Your agents
              <br />
              are waiting.
            </h2>
            <p
              style={{
                fontFamily: "var(--ccc-font-sans)",
                fontSize: "1rem",
                color: "var(--ccc-ash)",
                maxWidth: "44ch",
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              One dependency. Six hooks. A bus that fits in your pocket.
              Clone, configure, connect.
            </p>
            <div
              style={{
                display: "flex",
                gap: "1.25rem",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "center",
                marginTop: "0.5rem",
              }}
            >
              <a
                href="https://github.com/kristianDKAndersen/ccchat"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  background: "var(--ccc-amber)",
                  color: "#0D1117",
                  fontFamily: "var(--ccc-font-condensed)",
                  fontWeight: 900,
                  fontSize: "1rem",
                  letterSpacing: "0.02em",
                  padding: "0.875rem 2rem",
                  borderRadius: "2px",
                  textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
              >
                View the source →
              </a>
              <Link
                href="/#work"
                style={{
                  fontFamily: "var(--ccc-font-sans)",
                  fontSize: "0.85rem",
                  color: "var(--ccc-ash)",
                  textDecoration: "none",
                  borderBottom: "1px solid rgba(139,148,158,0.4)",
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
