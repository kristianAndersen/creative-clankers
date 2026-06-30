// The portfolio registry. One live project today; add entries here and the
// landing grid grows automatically. `status: "live"` cards link and render;
// anything else can be shown later as in-progress.

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
  status: "live" | "framework";
  tags: string[];
  year: string;
};

export const PROJECTS: Project[] = [
  {
    slug: "advisor",
    title: "Advisor",
    tagline: "The engine behind every demo on this page",
    description:
      "A chief-of-staff orchestrator that breaks your request into focused assignments, matches each to the right specialist, runs them in parallel, double-checks the results, and hands you one finished answer. The framework that built the other projects here.",
    href: "/advisor",
    status: "framework",
    tags: ["Multi-agent", "Orchestration", "AI Framework", "Bun / Node.js"],
    year: "2026",
  },
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
  {
    slug: "visit-prep",
    title: "Visit Prep Assistant",
    tagline: "Generative UI for clinicians",
    description:
      "Paste a patient note and the model returns a structured, source-anchored visit brief — then chooses its own layout and which cards to show. Every claim links to a verbatim quote from the input, confidence is shown honestly, and a human approves, edits, or regenerates. A demonstration of generative interfaces with built-in oversight, not a diagnostic tool.",
    href: "/visit-prep",
    status: "live",
    tags: ["Generative UI", "Structured output", "Healthcare", "Next.js"],
    year: "2026",
  },
  {
    slug: "ccchat",
    title: "CCChat",
    tagline: "Serverless peer chat for Claude Code agents",
    description:
      "Multiple Claude Code agents running in parallel sessions communicate in real time through a shared SQLite database — no server, no broker, no polling overhead. Six lifecycle hooks, a browser dashboard, a terminal UI, and a full structured task workflow with consensus voting. Zero infrastructure.",
    href: "/ccchat",
    status: "live",
    tags: ["Multi-agent", "Real-time", "SQLite", "Claude Code"],
    year: "2026",
  },
  {
    slug: "marketing-os",
    title: "MarketingOS",
    tagline: "10x your marketing team",
    description:
      "A suite of AI agents that automates the weekly marketing reporting and surveillance loop for a multi-market Nordic fintech: it pulls live BI data, runs cross-market analysis, flags anomalies, and delivers the summary to Slack every Monday. A persistent vault memory compounds insight run over run, and a native desktop chat UI puts it in non-technical managers' hands.",
    href: "/marketing-os",
    status: "live",
    tags: ["AI agents", "Marketing analytics", "Power BI", "Electrobun"],
    year: "2026",
  },
];
