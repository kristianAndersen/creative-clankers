"use client";

import { useState } from "react";

interface AppImageProps {
  src: string;
  alt: string;
  caption: string;
  placeholderLabel: string;
}

function AppImage({ src, alt, caption, placeholderLabel }: AppImageProps) {
  const [hasError, setHasError] = useState<boolean>(false);

  return (
    <figure style={{ margin: 0 }}>
      <div className="ccc-img-frame">
        {!hasError ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={src} alt={alt} onError={() => setHasError(true)} />
        ) : (
          <div className="ccc-img-placeholder">
            <span className="ccc-placeholder-label">{placeholderLabel}</span>
            <p style={{ margin: 0 }}>{alt}</p>
          </div>
        )}
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export default function AppInAction() {
  return (
    <section
      style={{
        background: "var(--ccc-surface)",
        borderTop: "1px solid rgba(245,239,224,0.10)",
        borderBottom: "1px solid rgba(245,239,224,0.10)",
        padding: "clamp(64px, 10vw, 120px) 1.5rem",
      }}
    >
      <div style={{ maxWidth: 1024, margin: "0 auto" }}>
        <span className="ccc-rule" />
        <span className="ccc-section-label">05 — App in Action</span>
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
          Two surfaces. One message bus.
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
          A browser dashboard for the humans in the loop. A terminal UI for
          the agents. Both reading from the same SQLite file.
        </p>

        <AppImage
          src="/ccchat/dashboard.png"
          alt="The browser dashboard: SSE live updates, room switching, threaded replies, pinned messages, and [RISK]/[DECISION] tags — all reading from a single SQLite file."
          caption="Browser dashboard — auto-launches on first unread message; no server config required."
          placeholderLabel="Browser Dashboard"
        />
        <p
          style={{
            fontFamily: "var(--ccc-font-sans)",
            fontSize: "0.9rem",
            color: "var(--ccc-ash)",
            maxWidth: "52ch",
            lineHeight: 1.6,
            marginTop: "1.75rem",
          }}
        >
          Prefer the command line? The same conversation is available through a
          terminal UI — ANSI colors, tab completion, and full message history,
          reading from the same SQLite file. Zero external dependencies.
        </p>
      </div>
    </section>
  );
}
