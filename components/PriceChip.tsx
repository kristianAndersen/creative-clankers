// PriceChip — inline locked-price chip.
// Numbers here come from the API (tool-getDetail output), never from the model's
// streamed text. The lock-pulse micro-animation is the visual proof of that guarantee.
//
// formatValue from lib/format.ts multiplies by 1000 (designed for thousands-denominated
// business data) and uses compact notation — WRONG for these prices which are actual DKK
// kroner per medicinpriser.types.ts comment: "Do NOT multiply by 1000."
// We format directly here.

type PriceField = "PrisPrPakning" | "PrisPrEnhed" | "AIP" | "TilskudBeregnesAf";

const FIELD_LABEL: Record<PriceField, string> = {
  PrisPrPakning: "pr. pakning",
  PrisPrEnhed: "pr. enhed",
  AIP: "AIP",
  TilskudBeregnesAf: "tilskud",
};

export function PriceChip({
  value,
  field,
  cached = false,
}: {
  value: number | null;
  field: string;
  cached?: boolean;
}) {
  if (value === null) {
    return (
      <span className="lock-pulse inline-flex items-center gap-1 rounded bg-grey-5 px-1.5 py-0.5 text-sm font-medium text-grey-2">
        —
      </span>
    );
  }

  const fieldLabel = FIELD_LABEL[field as PriceField] ?? field;
  const formatted = new Intl.NumberFormat("da-DK", {
    style: "currency",
    currency: "DKK",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <span className="lock-pulse inline-flex items-baseline gap-1">
      <span className="rounded bg-sky px-1.5 py-0.5 text-sm font-medium text-machine">
        {formatted}
      </span>
      <span className="text-[0.68rem] uppercase tracking-[0.1em] text-grey-2">
        {fieldLabel}
      </span>
      {cached && (
        <span className="text-[10px] text-grey-3" title="Cached from earlier fetch">
          ·cached
        </span>
      )}
    </span>
  );
}
