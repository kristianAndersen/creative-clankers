import type { ReactNode } from "react";
import { Instrument_Sans } from "next/font/google";
import "./marketing-os.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--mos-font-sans-var",
  display: "swap",
});

export const metadata = {
  title: "MarketingOS — AI Marketing Agent Suite",
  description:
    "10x your marketing team — without replacing it. AI agents that automate the full marketing reporting-and-surveillance loop for multi-market fintechs.",
};

export default function MarketingOSLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className={`mos-root ${instrumentSans.variable}`}>{children}</div>;
}
