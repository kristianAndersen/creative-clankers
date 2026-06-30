import type { ReactNode } from "react";
import {
  Barlow_Condensed,
  Playfair_Display,
  JetBrains_Mono,
  Inter,
} from "next/font/google";
import "./ccchat.css";

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["300", "700", "900"],
  variable: "--ccc-font-condensed-var",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--ccc-font-serif-var",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--ccc-font-mono-var",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--ccc-font-sans-var",
  display: "swap",
});

export const metadata = {
  title: "CCChat — Serverless Peer Chat for Claude Code Agents",
  description:
    "Zero-server real-time messaging for multi-agent Claude Code workflows. SQLite as the message bus. Six hooks. No infrastructure.",
};

export default function CCChatLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`ccc-root ${barlowCondensed.variable} ${playfair.variable} ${jetbrainsMono.variable} ${inter.variable}`}
    >
      {children}
    </div>
  );
}
