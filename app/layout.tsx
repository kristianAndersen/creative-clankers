import type { Metadata } from "next";
import { Inter, Space_Grotesk, Righteous } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const righteous = Righteous({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-righteous",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creative Clankers — the future is human",
  description:
    "A live demo of a data-to-decision agent: AI does the heavy lifting, you keep the judgment. Built by Kristian Andersen.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${righteous.variable}`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
