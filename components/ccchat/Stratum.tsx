import type { ReactNode } from "react";

type Agent = "a" | "b" | "c";

interface StratumProps {
  agent: Agent;
  label: string;
  delayMs?: number;
  children: ReactNode;
}

const agentStyle: Record<
  Agent,
  { fontFamily: string; fontWeight: number | string; fontStyle?: string; textTransform?: string; color: string; fontSize: string }
> = {
  a: {
    fontFamily: "var(--ccc-font-condensed)",
    fontWeight: 300,
    textTransform: "uppercase",
    color: "var(--ccc-rust)",
    fontSize: "clamp(1rem, 2vw, 1.15rem)",
  },
  b: {
    fontFamily: "var(--ccc-font-serif)",
    fontWeight: 400,
    fontStyle: "italic",
    color: "var(--ccc-pale-gold)",
    fontSize: "clamp(1rem, 2vw, 1.1rem)",
  },
  c: {
    fontFamily: "var(--ccc-font-mono)",
    fontWeight: 400,
    color: "var(--ccc-sienna)",
    fontSize: "clamp(0.82rem, 1.6vw, 0.95rem)",
  },
};

export default function Stratum({ agent, label, delayMs = 0, children }: StratumProps) {
  return (
    <div
      className={`ccc-stratum ccc-stratum-${agent}`}
      data-stratum-delay={String(delayMs)}
      style={{ marginBottom: "2rem" }}
    >
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
        {label}
      </span>
      <p
        style={{
          margin: 0,
          lineHeight: 1.6,
          ...agentStyle[agent],
        }}
      >
        {children}
      </p>
    </div>
  );
}
