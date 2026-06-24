# Creative Clankers — *the future is human*

A live, working demo of a **data-to-decision agent**: hand it a messy business
dataset, and it reads it, runs the numbers **in real code**, streams back the
story — and then hands the decision back to you.

> **The belief it demonstrates:** AI does the heavy lifting; the person keeps
> the judgment. Augment people with AI — don't replace them.

🔗 **Live:** https://creativeclankers.vercel.app
🛠 **Stack:** Next.js (App Router) · Vercel AI SDK · Groq (free tier) · bespoke generative UI

---

## Why this exists

I'm a designer-and-frontend-developer of 25 years who now works hands-on with
AI in daily production. Most "AI demos" are either a chatbot in a box or a
slide that never runs. I wanted to ship the opposite: a small product that
actually works, that shows craft, and that takes a clear position on *how* AI
should be used.

The position is the one in the title. The interesting line in any AI product
isn't "can the machine do it" — it's **where the machine stops and the human
decides.** This demo draws that line on purpose and makes it the centre of the
interaction.

## What it does (idea → experience)

1. **You pick a dataset** — regional revenue, signups by channel, or support
   tickets. Generic on purpose; no domain knowledge needed.
2. **The agent reads the brief** and decides it needs real figures.
3. **It calls a tool** — `analyze()` — which is plain, deterministic
   TypeScript. *The model never does the arithmetic.* It gets back totals,
   per-row growth, outliers (flagged at >1σ from the mean move), and
   concentration.
4. **The result renders as a designed panel** — KPIs, a hand-built SVG chart,
   outlier callouts — not a wall of text. This is the Vercel AI SDK's
   generative-UI idea, art-directed rather than default-styled.
5. **The agent narrates** what happened, in plain language, citing only the
   tool's real numbers.
6. **It hands the call back to you** — closing with the two or three sharp
   questions only a human with context can answer. It never pretends to decide.

A deliberate detail: the support-tickets dataset is one where *growth is bad*.
The agent is told the dataset's "good direction" and must not celebrate a rise.
That's the whole thesis in miniature — the numbers are easy; knowing what they
*mean* is the human's job.

## Design notes

The UI is built on **Intellishore's own live design tokens** — their warm-grey
scale, cream/white canvas, and near-black ink — as an exercise in working
inside a real brand system. The two accent colours carry the idea:

- **warm rust-orange** = the *human* moments (decisions, things that need a
  person's attention)
- **cool brand-blue** = the *machine* marks (data, the AI's output)

So the colour system itself says "the future is human."

## How the integrity works

The credibility of an analysis agent is that it doesn't make up numbers. Here,
every figure on screen comes from `lib/analyze.ts` — real computation over
`lib/datasets.ts`. The LLM's job is framing and judgment-prompting, not maths.
You can verify the figures yourself:

```bash
npx tsx -e "import('./lib/analyze.ts').then(m => console.log(m.analyzeById('regional-revenue')))"
```

You can also **upload your own CSV** in the studio, in either of two modes:

- **Compare two periods** — a label column + two numeric columns (before / after);
  the agent reports growth, deltas and what moved against the goal.
- **Rank one metric** — a category column + one numeric column; rows are grouped
  and summed/averaged, and the agent reports ranking, share of total and
  concentration. Built for the records-style tables most real CSVs actually are.

Either way it runs through the exact same deterministic `analyze()` engine; the
model never sees a number it didn't compute.

## Run it locally

```bash
npm install
cp .env.example .env.local      # then paste a free Groq key
npm run dev                     # http://localhost:3000
```

A **free** Groq API key (no credit card) lives at
<https://console.groq.com/keys>. The model defaults to
`llama-3.3-70b-versatile`; override with `GROQ_MODEL`.

## Deploy to Vercel

1. Push this repo to GitHub (already connected).
2. Import it at [vercel.com/new](https://vercel.com/new).
3. Add one environment variable: **`GROQ_API_KEY`**.
4. Deploy. Paste the URL at the top of this README.

There's a light per-IP rate limit and an output-token cap so the shared free
tier survives a busy day; see `lib/ratelimit.ts` for the trade-offs.

---

Built by **Kristian Andersen** — [linkedin.com/in/freaktrick](https://www.linkedin.com/in/freaktrick)
