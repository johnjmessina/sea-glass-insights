// ── MIR sections — shared by the server (generation) and the dashboard (UI) ──
// Kept free of SDK imports so client components can use it.

export type MirSectionKey =
  | "executive_summary"
  | "business_snapshot"
  | "customer_profile"
  | "competitive_landscape"
  | "positioning"
  | "insights"
  | "recommendations";

export const MIR_SECTION_LABELS: Record<MirSectionKey, string> = {
  executive_summary:     "Executive Summary",
  business_snapshot:     "Business Snapshot",
  customer_profile:      "Customer Profile",
  competitive_landscape: "Competitive Landscape",
  positioning:           "Market Positioning",
  insights:              "Key Insights",
  recommendations:       "Recommendations",
};

// Order sections are generated in. Each section sees the ones before it as
// context, so later sections build on earlier ones: facts first, analysis
// next, and the executive summary last because it summarizes everything.
export const MIR_GENERATION_ORDER: MirSectionKey[] = [
  "business_snapshot",
  "customer_profile",
  "competitive_landscape",
  "positioning",
  "insights",
  "recommendations",
  "executive_summary",
];

export function isMirSectionKey(key: string): key is MirSectionKey {
  return (MIR_GENERATION_ORDER as string[]).includes(key);
}

// Sections a draft is still missing. A legacy draft with the old plain-text
// `snapshot` counts as having its business snapshot.
export function missingMirSections(draft: Record<string, unknown> | null | undefined): MirSectionKey[] {
  const d = draft ?? {};
  return MIR_GENERATION_ORDER.filter(key => {
    if (key === "business_snapshot" && d.snapshot) return false;
    const v = d[key];
    return v === undefined || v === null || v === "";
  });
}
