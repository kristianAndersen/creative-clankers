// Single source of truth for the résumé. Shaped to the JSON Resume standard
// (jsonresume.org/schema) so /resume.json is a near-direct serialization, and
// mapped to schema.org Person for the JSON-LD the /cv page embeds.
//
// IMPORTANT: every field here is visible on the human résumé. The machine
// channels are a faithful mirror — nothing hidden, no keyword stuffing.

export type Work = {
  name: string;
  position: string;
  url?: string;
  startDate: string; // "YYYY" or "YYYY-MM"
  endDate?: string; // omitted = present
  location?: string;
  summary?: string; // used for compact (earlier) roles
  highlights?: string[]; // used for recent roles
};

export type Education = {
  institution: string;
  area: string;
  studyType: string;
  startDate: string;
  endDate?: string;
};

export type Resume = {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    url: string;
    summary: string;
    location: {
      address: string;
      postalCode: string;
      city: string;
      countryCode: string;
    };
    profiles: { network: string; username: string; url: string }[];
  };
  work: Work[];
  education: Education[];
  skills: { name: string; keywords: string[] }[];
  languages: { language: string; fluency: string }[];
  certificates: { name: string; date: string; issuer: string }[];
  awards: { title: string; date: string; awarder: string; summary: string }[];
};

export const RESUME: Resume = {
  basics: {
    name: "Kristian Andersen",
    label: "Creative Technologist · Design + Frontend + AI",
    email: "krilleandersen@gmail.com",
    phone: "+45 22 42 04 59",
    url: "https://creativeclankers.vercel.app",
    summary:
      "Creative technologist with 25+ years across visual design, digital production and frontend engineering — and the rare ability to carry an idea from the first sketch to a shipped product in the browser. Today I drive AI adoption across a development team and work hands-on with AI coding and agent tools every day. My conviction: augment and 10x people with AI — don't replace them. Award-winning creative background (Gold, 2014).",
    location: {
      address: "Oxford Allé 102",
      postalCode: "2300",
      city: "Copenhagen",
      countryCode: "DK",
    },
    profiles: [
      {
        network: "LinkedIn",
        username: "freaktrick",
        url: "https://www.linkedin.com/in/freaktrick",
      },
      {
        network: "GitHub",
        username: "kristianAndersen",
        url: "https://github.com/kristianAndersen",
      },
    ],
  },

  work: [
    {
      name: "Sambla Group",
      position: "Frontend Web Developer",
      startDate: "2025-10",
      highlights: [
        "Build frontend web solutions across Sambla Group's products and brands.",
        "AI ambassador for the organisation — drive adoption of AI coding and agent tools (incl. Claude Code) across the development team.",
        "Use AI-assisted development hands-on to raise delivery speed and code quality in daily production.",
      ],
    },
    {
      name: "Sambla Group",
      position: "Web Designer",
      startDate: "2023-01",
      endDate: "2025-12",
      highlights: [
        "Designed and maintained digital interfaces and campaign material.",
        "Owned visual consistency across platforms and brands.",
      ],
    },
    {
      name: "Salus Group Oy",
      position: "Graphic Design Officer",
      startDate: "2021-11",
      endDate: "2023-06",
      highlights: [
        "Led graphic production for marketing, plus UI/UX design and frontend development on Salus Group's products.",
        "Delivered visual design, motion graphics and frontend implementation for digital marketing campaigns.",
      ],
    },
    {
      name: "Experis",
      position: "Frontend Developer & Full-Stack Designer",
      startDate: "2021-01",
      endDate: "2021-11",
      highlights: [
        "Frontend development in Vue, HTML/CSS and JavaScript.",
        "UX/UI design in close collaboration with the backend team.",
      ],
    },
    {
      name: "Danske Spil A/S",
      position: "Senior Designer / Art Director",
      startDate: "2015-06",
      endDate: "2020-12",
      highlights: [
        "Founded, structured and grew Danske Spil's in-house creative department.",
        "Led daily creative direction and production for 12+ brands (Lotto, Casino, Poker, Quick, Bingo) — roughly 1,000 campaigns a year.",
        "Art-directed and designed game identities and logos: Quick Millionjagten, Bingofesten, Quickgames Regnbuehjulet, Den Gyldne Kop and others.",
        "Introduced Meistertask as the department's project- and task-management tool.",
      ],
    },
    {
      name: "Bonnie & Clyde — Creative Communications & Design",
      position: "Art Director / Founder",
      startDate: "2011-10",
      endDate: "2015-11",
      highlights: [
        "Broad creative work for own clients and as a subcontractor to larger agencies — from hand drawing to frontend programming.",
        "Concept, design and art direction of the Semper app Klar, parat, spis! and its companion brochure, published in 70,000+ copies.",
        "Visual identity and website for Laungaard Arkitekter.",
      ],
    },
    {
      name: "OgilvyOne Worldwide",
      position: "Freelance Art Director",
      startDate: "2012",
      endDate: "2013",
      highlights: [
        "Art direction, graphics and illustration for IBM's B2B campaign Lykkelig Uvidenhed — winner of the Direct Marketing Prize 2014 (Gold, Best Direct Mail).",
        "Email and newsletter design for Telia, YouSee and DSB.",
      ],
    },
    {
      name: "Freelance — AdPeople, Patchwork, Isobar, Moch, Wunderman",
      position: "Digital Art Director / Interactive Designer",
      startDate: "2011",
      endDate: "2013",
      summary:
        "Rich-media and interactive campaigns for Dell, MovieStarPlanet, Lego, Paco Rabanne, Rimmel, Ford, Nokia and the Roskilde Festival 2013 Facebook app.",
    },
    {
      name: "Copenhagen Cloud Company",
      position: "Interactive Developer / Web Designer",
      startDate: "2010-11",
      endDate: "2011-12",
      summary:
        "Intranet modules for Novo Nordisk (GlobeShare), the Paradise Hotel site and a TV3 Facebook game, e-commerce checkout for Fritz Hansen, and a mobile demo for Thomas Cook Airlines.",
    },
    {
      name: "3Dhuset",
      position: "Interactive Designer / Digital Graphic Designer",
      startDate: "2010",
      summary:
        "Interactive banners and digital graphics for clients including Nordea Ejendomme; maintenance of existing HTML solutions.",
    },
    {
      name: "Graphit",
      position: "Media Graphic Designer",
      startDate: "2006-04",
      endDate: "2009-06",
      summary:
        "Concept and motion graphics for Statoil's in-store TV; logo design; banners, web design and image editing for Hyundai, Statoil and others; frontend for Graphit's online media bank.",
    },
    {
      name: "FreakTrick Creative (Self-employed)",
      position: "Web Designer, Graphic Designer, Illustrator & Visual Artist",
      startDate: "2000-01",
      endDate: "2010-09",
      summary:
        "Illustration and digital work for BG Bank, Nesa, BBDO, CoreComp and Statoil; campaign sites for Nordea Ejendomme; band identities; storyboards for award-winning director Nicolo Donato; commissioned fine art for private collectors.",
    },
    {
      name: "Operation Dagsværk",
      position: "Graphic Designer",
      startDate: "2000-02",
      endDate: "2000-10",
      summary:
        "Layout of educational materials, magazines, posters and flyers.",
    },
  ],

  education: [
    {
      institution: "Copenhagen Technical School (KTS)",
      area: "Media Graphics — digital specialism (internet production, advanced web design, multimedia)",
      studyType: "Advanced programme",
      startDate: "2006",
      endDate: "2009",
    },
    {
      institution: "Private tuition in fine art — Winnie Wögel, cand.phil.",
      area: "Visual language, freehand drawing, colour theory",
      studyType: "Apprenticeship",
      startDate: "2004",
      endDate: "2005",
    },
    {
      institution: "Copenhagen Technical School (KTS)",
      area: "Media Graphics — graphic design, digital communication, image editing",
      studyType: "Foundation programme",
      startDate: "2003",
      endDate: "2004",
    },
    {
      institution: "TEC / School of Art and Design, Frederiksberg",
      area: "Art & Design, visual track — industrial design, drawing, ideation",
      studyType: "Programme",
      startDate: "2001",
    },
    {
      institution: "KEA – Copenhagen School of Design and Technology",
      area: "Web programming — fundamentals of PHP and MySQL",
      studyType: "Course",
      startDate: "2010",
    },
  ],

  skills: [
    {
      name: "Design",
      keywords: [
        "Art Direction",
        "UI/UX Design",
        "Adobe Illustrator",
        "Adobe Photoshop",
        "InDesign",
        "Figma",
        "Motion Graphics",
        "Illustration",
        "3D Graphics",
      ],
    },
    {
      name: "Frontend",
      keywords: ["HTML", "CSS", "JavaScript", "Vue.js", "Node.js", "Next.js"],
    },
    {
      name: "AI",
      keywords: [
        "AI-assisted development",
        "Claude Code",
        "Agent tooling",
        "Prompt engineering",
        "AI adoption / enablement",
      ],
    },
  ],

  languages: [
    { language: "Danish", fluency: "Native" },
    { language: "English", fluency: "Professional" },
    { language: "Swedish", fluency: "Basic" },
  ],

  certificates: [
    { name: "AI for Sensitive Data", date: "2026-04", issuer: "Sambla Group" },
    {
      name: "AI for Software Development",
      date: "2026-03",
      issuer: "Sambla Group",
    },
  ],

  awards: [
    {
      title: "Gold — Direct Marketing Prize 2014",
      date: "2014",
      awarder: "Direct Marketing Prisen",
      summary:
        "“Lykkelig Uvidenhed” (Happy Ignorance) campaign for IBM, via OgilvyOne Worldwide. Best Direct Mail.",
    },
  ],
};
