import { RESUME } from "@/lib/resume";

// Machine-first résumé in the JSON Resume standard (jsonresume.org/schema).
// A faithful mirror of the /cv page — an agent can fetch structured fields here.
export function GET() {
  return Response.json(
    {
      $schema:
        "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
      ...RESUME,
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
}
