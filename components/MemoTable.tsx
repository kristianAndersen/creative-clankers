"use client";

import type { RankedRow } from "@/lib/substitution";
import type { ProduktDetaljer } from "@/lib/medicinpriser.types";
import { PriceChip } from "./PriceChip";

type PriceEntry = Pick<ProduktDetaljer, "PrisPrEnhed" | "PrisPrPakning">;

const fmt = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Render ranked rows as a plain-text tab-separated string for clipboard export. */
export function rankedToPlainText(
  rows: RankedRow[],
  lockedPrices: Map<string, PriceEntry>,
): string {
  if (rows.length === 0) return "";
  const header = "Rank\tProdukt\tFirma\tStyrke\tPakning\tPris/enhed\tPris/pakning";
  const body = rows.map((row, i) => {
    const d = lockedPrices.get(row.vnr);
    const perEnhed = d?.PrisPrEnhed != null ? fmt.format(d.PrisPrEnhed) : "?";
    const perPakning = d?.PrisPrPakning != null ? fmt.format(d.PrisPrPakning) : "?";
    return `${i + 1}\t${row.Navn}\t${row.Firma}\t${row.Styrke}\t${row.Pakning}\t${perEnhed}\t${perPakning}`;
  });
  return [header, ...body].join("\n");
}

export function MemoTable({
  ranked,
  lockedPrices,
}: {
  ranked: RankedRow[];
  lockedPrices: Map<string, ProduktDetaljer>;
}) {
  if (ranked.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border border-grey-4">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-grey-4 bg-grey-5 text-left">
            <th className="px-3 py-2 font-medium text-grey-2 w-10">#</th>
            <th className="px-3 py-2 font-medium text-grey-2">Produkt</th>
            <th className="px-3 py-2 font-medium text-grey-2">Firma</th>
            <th className="px-3 py-2 font-medium text-grey-2">Styrke</th>
            <th className="px-3 py-2 font-medium text-grey-2">Pakning</th>
            <th className="px-3 py-2 font-medium text-grey-2 text-right">Pris/enhed</th>
            <th className="px-3 py-2 font-medium text-grey-2 text-right">Pris/pakning</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((row, i) => {
            const detail = lockedPrices.get(row.vnr);
            return (
              <tr
                key={row.vnr}
                className="border-b border-grey-5 last:border-0 odd:bg-paper even:bg-grey-5/40"
              >
                <td className="px-3 py-2 text-center">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[0.65rem] font-bold ${
                      i === 0
                        ? "bg-brand text-paper"
                        : "bg-grey-4 text-grey-2"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium text-ink">{row.Navn}</td>
                <td className="px-3 py-2 text-ink-soft">{row.Firma}</td>
                <td className="px-3 py-2 text-ink-soft">{row.Styrke}</td>
                <td className="px-3 py-2 text-ink-soft">{row.Pakning}</td>
                <td className="px-3 py-2 text-right">
                  <PriceChip
                    value={detail?.PrisPrEnhed ?? null}
                    field="PrisPrEnhed"
                  />
                </td>
                <td className="px-3 py-2 text-right">
                  <PriceChip
                    value={detail?.PrisPrPakning ?? null}
                    field="PrisPrPakning"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
