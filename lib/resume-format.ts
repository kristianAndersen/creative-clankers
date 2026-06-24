import { type Resume } from "./resume";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// "2025-10" → "Oct 2025"; "2012" → "2012"
export function formatDate(d?: string): string {
  if (!d) return "";
  const [y, m] = d.split("-");
  if (!m) return y;
  const mi = parseInt(m, 10) - 1;
  return `${MONTHS[mi] ?? ""} ${y}`.trim();
}

export function formatRange(start: string, end?: string): string {
  const s = formatDate(start);
  const e = end ? formatDate(end) : "Present";
  return `${s} – ${e}`;
}

// schema.org Person — a faithful mirror of the visible résumé, for any agent
// that crawls the /cv URL.
export function toPersonJsonLd(r: Resume) {
  const current = r.work.find((w) => !w.endDate);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: r.basics.name,
    jobTitle: r.basics.label,
    description: r.basics.summary,
    email: r.basics.email,
    telephone: r.basics.phone,
    url: r.basics.url,
    address: {
      "@type": "PostalAddress",
      streetAddress: r.basics.location.address,
      postalCode: r.basics.location.postalCode,
      addressLocality: r.basics.location.city,
      addressCountry: r.basics.location.countryCode,
    },
    sameAs: r.basics.profiles.map((p) => p.url),
    ...(current
      ? {
          worksFor: { "@type": "Organization", name: current.name },
          hasOccupation: {
            "@type": "Occupation",
            name: current.position,
          },
        }
      : {}),
    alumniOf: r.education.map((e) => ({
      "@type": "EducationalOrganization",
      name: e.institution,
    })),
    knowsAbout: r.skills.flatMap((s) => [s.name, ...s.keywords]),
    knowsLanguage: r.languages.map((l) => ({
      "@type": "Language",
      name: l.language,
    })),
    hasCredential: r.certificates.map((c) => ({
      "@type": "EducationalOccupationalCredential",
      name: c.name,
      credentialCategory: "certificate",
      recognizedBy: { "@type": "Organization", name: c.issuer },
    })),
    award: r.awards.map((a) => a.title),
  };
}
