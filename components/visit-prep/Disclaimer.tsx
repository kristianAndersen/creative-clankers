export function Disclaimer() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 px-5 py-4 text-sm text-[#484F53]"
      style={{ border: "1px solid #1A2328", background: "#D8F5F3" }}
    >
      <span className="mt-0.5 shrink-0 text-[#099A93]" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <p>
        <strong className="font-semibold text-[#1A2328]">Not a medical device.</strong>{" "}
        AI-generated, may be inaccurate. For clinician review only — not diagnosis or treatment advice.
      </p>
    </div>
  );
}
