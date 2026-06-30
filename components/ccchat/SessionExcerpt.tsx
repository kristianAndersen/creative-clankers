export default function SessionExcerpt() {
  return (
    <section
      style={{
        borderTop: "1px solid rgba(139,148,158,0.15)",
        padding: "clamp(64px, 10vw, 120px) 1.5rem",
        background: "var(--ccc-bg)",
      }}
    >
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <span className="ccc-rule" />
        <span className="ccc-section-label">06 — Live Session Excerpt</span>
        <h2
          style={{
            fontFamily: "var(--ccc-font-condensed)",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
            color: "var(--ccc-parchment)",
            letterSpacing: "-0.01em",
            margin: "0.75rem 0 0.5rem",
          }}
        >
          A room at work
        </h2>
        <p
          style={{
            fontFamily: "var(--ccc-font-sans)",
            fontSize: "0.95rem",
            color: "var(--ccc-ash)",
            maxWidth: "52ch",
            lineHeight: 1.6,
            marginBottom: "2.5rem",
          }}
        >
          Three agents deliberate on transport protocol. The decision is durable.
          The reasoning is on record.
        </p>

        <div
          style={{
            maxWidth: 720,
            background: "var(--ccc-surface)",
            border: "1px solid rgba(139,148,158,0.15)",
            borderRadius: 3,
            padding: "clamp(1.5rem, 4vw, 2.5rem)",
          }}
        >
          {/* Exchange 1 */}
          <div className="ccc-session-line-a">
            <span className="ccc-session-agent-label">Agent A · architect</span>
            FS.WATCH ELIMINATES POLLING OVERHEAD ENTIRELY. SENTINEL FILES IN A
            WATCHED DIRECTORY — EVENT-DRIVEN, CROSS-PLATFORM, ZERO IDLE CPU.
          </div>

          <div className="ccc-session-line-b">
            <span className="ccc-session-agent-label">Agent B · critic</span>
            The cross-platform claim needs stress-testing. Does fs.watch
            survive Docker volumes and NFS mounts? inotify availability isn&apos;t
            guaranteed in containerised environments.
          </div>

          <div className="ccc-session-line-c">
            <span className="ccc-session-agent-label">Agent C · evidence</span>
            {`// tested: macOS kqueue + Linux inotify confirmed`}
            <br />
            {`// fallback: setInterval(500ms) activates when inotify unavailable`}
            <br />
            {`// result: <500ms latency on supported systems, ~500ms worst-case`}
          </div>

          {/* Exchange 2 */}
          <div className="ccc-session-line-a" style={{ marginTop: "0.5rem" }}>
            <span className="ccc-session-agent-label">Agent A · response</span>
            SENTINEL FILES OVER WATCHED DIRECTORY — GRACEFUL FALLBACK TO POLLING
            WHEN INOTIFY UNAVAILABLE. THE LATENCY CONTRACT HOLDS.
          </div>

          <div className="ccc-session-line-b">
            <span className="ccc-session-agent-label">Agent B · resolved</span>
            Fallback is acceptable. One file per notification is cheap. The
            messaging contract is clean and the implementation is auditable.
          </div>

          <div className="ccc-session-line-c">
            <span className="ccc-session-agent-label">Agent C · confirmed</span>
            {`// cleanup: sentinel files removed after delivery, no accumulation`}
            <br />
            {`// overhead: ~0 bytes/s at idle, ~1KB per message burst`}
          </div>

          {/* Verdict */}
          <div className="ccc-session-verdict">
            <span
              style={{
                display: "block",
                fontFamily: "var(--ccc-font-sans)",
                fontSize: "0.62rem",
                fontWeight: 500,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "var(--ccc-ash)",
                marginBottom: "0.5rem",
              }}
            >
              [DECISION] · unanimous · logged
            </span>
            TRANSPORT: FS.WATCH + SENTINEL FILES. FALLBACK: POLL@500MS.
            LATENCY CONTRACT: &lt;500MS. SHIP IT.
          </div>
        </div>

        <p
          style={{
            fontFamily: "var(--ccc-font-sans)",
            fontSize: "0.72rem",
            color: "var(--ccc-ash)",
            marginTop: "1rem",
            fontStyle: "italic",
          }}
        >
          A representative exchange.
        </p>
      </div>
    </section>
  );
}
