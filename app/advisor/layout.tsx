import type { ReactNode } from "react";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./advisor.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--adv-font-serif-var",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--adv-font-sans-var",
  display: "swap",
});

export const metadata = {
  title: "Advisor — Chief of Staff for Your AI",
  description:
    "A multi-agent orchestrator that breaks your request into focused assignments, runs dedicated specialists in parallel, and hands you one finished answer.",
};

export default function AdvisorLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`adv-root ${playfair.variable} ${dmSans.variable}`}>
      {children}
    </div>
  );
}
