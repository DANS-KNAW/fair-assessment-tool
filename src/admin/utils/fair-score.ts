const fairFields = [
  "fq1",
  "fq2",
  "fq3",
  "aq1",
  "aq2",
  "iq1",
  "rq1",
  "rq2",
  "rq3",
  "rq4",
] as const;

export const FAIR_QUESTIONS = [
  { key: "fq1", label: "F1: Persistent identifier" },
  { key: "fq2", label: "F2: Metadata for discovery" },
  { key: "fq3", label: "F3: Human & machine readable" },
  { key: "aq1", label: "A1: Licence and access info" },
  { key: "aq2", label: "A2: Metadata persistence" },
  { key: "iq1", label: "I1: Controlled vocabularies" },
  { key: "rq1", label: "R1: Provenance info" },
  { key: "rq2", label: "R2: Community standards" },
  { key: "rq3", label: "R3: Preferred format" },
  { key: "rq4", label: "R4: Digital preservation" },
] as const;

export const INTENTION_LABELS: Record<string, string> = {
  "1": "Very unlikely",
  "2": "Unlikely",
  "3": "Neutral",
  "4": "Likely",
  "5": "Very likely",
};

export function getFairScore(row: Record<string, string | null>): number {
  return fairFields.filter((f) => row[f]?.toLowerCase() === "yes").length;
}

export function getFairLabel(score: number): string {
  if (score < 6) return "Low";
  if (score < 8) return "Moderate";
  return "High";
}
