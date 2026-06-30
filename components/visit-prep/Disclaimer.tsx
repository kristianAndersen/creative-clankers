export function Disclaimer() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-xl border border-grey-4 bg-sky px-5 py-4 text-sm text-ink-soft"
    >
      <span className="mt-0.5 shrink-0 text-brand" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v4M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
      <p>
        <strong className="font-semibold text-ink">Not a medical device.</strong>{" "}
        AI-generated, may be inaccurate. For clinician review only — not diagnosis or treatment advice.
      </p>
    </div>
  );
}
