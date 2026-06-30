import { Roboto_Mono, Inter } from "next/font/google";
import "./visit-prep.css";
import type { ReactNode } from "react";

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-vp-display",
  display: "swap",
  weight: ["400", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-vp-body",
  display: "swap",
});

export default function VisitPrepLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${robotoMono.variable} ${inter.variable} vp-root`}>
      {children}
    </div>
  );
}
