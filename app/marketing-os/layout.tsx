import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./marketing-os.css";

const inter = Inter({
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
  return <div className={`mos-root ${inter.variable}`}>{children}</div>;
}
