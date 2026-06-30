interface FeatureCalloutProps {
  claim: string;
  body: string;
  index: number;
}

export default function FeatureCallout({ claim, body, index }: FeatureCalloutProps) {
  return (
    <div
      style={{
        paddingBlock: "2rem",
        borderTop: "1px solid rgba(245,239,224,0.10)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: "1rem" }}>
        <span
          style={{
            fontFamily: "var(--ccc-font-condensed)",
            fontWeight: 900,
            fontSize: "0.7rem",
            color: "var(--ccc-amber)",
            letterSpacing: "0.1em",
            flexShrink: 0,
            opacity: 0.6,
          }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <p
          style={{
            fontFamily: "var(--ccc-font-condensed)",
            fontWeight: 700,
            fontSize: "clamp(1.1rem, 2.2vw, 1.35rem)",
            color: "var(--ccc-parchment)",
            letterSpacing: "-0.01em",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {claim}
        </p>
      </div>
      <p
        style={{
          fontFamily: "var(--ccc-font-sans)",
          fontWeight: 400,
          fontSize: "0.95rem",
          color: "var(--ccc-ash)",
          lineHeight: 1.75,
          margin: 0,
          maxWidth: "62ch",
          paddingLeft: "2.25rem",
        }}
      >
        {body}
      </p>
    </div>
  );
}
