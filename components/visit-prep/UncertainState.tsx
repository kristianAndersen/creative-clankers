interface UncertainStateProps {
  reason: string;
}

export function UncertainState({ reason }: UncertainStateProps) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-grey-4 bg-paper px-8 py-12 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-sky text-brand">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path
            d="M12 7v6M12 16.5v.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-ink">Couldn't prepare a brief</h2>
        <p className="mt-2 max-w-sm text-base text-ink-soft">{reason}</p>
      </div>
      <p className="text-sm text-grey-2">
        Try pasting your appointment notes, referral letter, patient summary, or a description of your upcoming visit.
      </p>
    </div>
  );
}
