// The portfolio registry. One live project today; add entries here and the
// landing grid grows automatically. `status: "live"` cards link and render;
// anything else can be shown later as in-progress.

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  status: "live";
  tags: string[];
  year: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "data-to-decision",
    title: "Data → Decision",
    tagline: "A live AI agent",
    description:
      "Hand it a business dataset — or upload your own — and it reads it, runs the numbers in real code, streams back the story, and hands the decision back to you. A working demonstration of AI that augments judgment instead of replacing it.",
    href: "/studio",
    status: "live",
    tags: ["Streaming UI", "Tool use", "Generative UI", "Next.js"],
    year: "2026",
  },
  {
    slug: "substitution-briefing-agent",
    title: "Substitution Briefing",
    tagline: "Pharmacy procurement, automated",
    description:
      "Type a drug name. A multi-step agent searches the Danish medicines register, filters discontinued substitutes mid-reasoning, and streams structured procurement language — with every price locked from the live API, never hallucinated.",
    href: "/substitution",
    status: "live",
    tags: ["Multi-step agent", "Streaming UI", "Tool use", "medicinpriser.dk"],
    year: "2026",
  },
];
