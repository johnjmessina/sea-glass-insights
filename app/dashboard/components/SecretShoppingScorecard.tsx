"use client";

// ── Secret Shopping scorecard types + rendering ────────────────────────────────

export interface SSDimension {
  key:    string;
  label:  string;
  weight: number;
  yesno:  { key: string; label: string }[];
  rated:  { key: string; label: string }[];
}

export const SS_DIMENSIONS: SSDimension[] = [
  {
    key: "first_impression", label: "First Impression", weight: 0.10,
    yesno: [
      { key: "fi_exterior_signage", label: "Exterior signage is visible, clean, and professional" },
      { key: "fi_entrance_clear",   label: "Entrance is clear, accessible, and inviting" },
      { key: "fi_hours_posted",     label: "Store hours are posted and visible" },
      { key: "fi_acknowledged_60s", label: "Staff acknowledged customer within 60 seconds of entry" },
    ],
    rated: [
      { key: "fi_greeting_quality", label: "Quality of initial greeting — warmth and genuineness" },
      { key: "fi_overall_first",    label: "Overall first impression matches brand promise" },
    ],
  },
  {
    key: "physical_environment", label: "Physical Environment", weight: 0.10,
    yesno: [
      { key: "pe_clean",            label: "Store is clean — floors, surfaces, windows" },
      { key: "pe_organized",        label: "Merchandise is organized and easy to navigate" },
      { key: "pe_interior_signage", label: "Interior signage is clear and helpful" },
      { key: "pe_lighting",         label: "Lighting is appropriate for the environment" },
      { key: "pe_music",            label: "Music or ambiance suits the brand" },
      { key: "pe_temperature",      label: "Temperature is comfortable" },
    ],
    rated: [
      { key: "pe_overall_env",  label: "Overall environment — makes you want to stay longer" },
      { key: "pe_visual_merch", label: "Visual merchandising quality and appeal" },
    ],
  },
  {
    key: "staff_engagement", label: "Staff Engagement", weight: 0.25,
    yesno: [
      { key: "se_visible",  label: "Staff was visible and accessible without being intrusive" },
      { key: "se_natural",  label: "Approach felt natural, not scripted or forced" },
      { key: "se_listened", label: "Staff listened before recommending" },
      { key: "se_accurate", label: "Staff handled a direct question accurately" },
    ],
    rated: [
      { key: "se_friendliness", label: "Friendliness and warmth of staff interaction" },
      { key: "se_knowledge",    label: "Depth of product or service knowledge demonstrated" },
      { key: "se_objection",    label: "Ability to handle objection or hesitation gracefully" },
      { key: "se_consistency",  label: "Consistency across multiple staff members" },
    ],
  },
  {
    key: "core_experience", label: "Core Experience", weight: 0.25,
    yesno: [
      { key: "ce_easy_find",       label: "Easy to find what you were looking for" },
      { key: "ce_upsell_attempted",label: "A natural upsell or cross-sell was attempted" },
      { key: "ce_upsell_helpful",  label: "Upsell felt helpful rather than pushy" },
      { key: "ce_matched_promise", label: "Experience matched what was advertised or promised" },
    ],
    rated: [
      { key: "ce_relevance",      label: "Relevance of recommendation to your actual need" },
      { key: "ce_personalization",label: "Degree of personalization in the interaction" },
      { key: "ce_valued",         label: "Overall feeling of being valued as a customer" },
    ],
  },
  {
    key: "purchase_process", label: "Purchase Process", weight: 0.15,
    yesno: [
      { key: "pp_efficient", label: "Checkout was efficient with no unnecessary wait" },
      { key: "pp_accurate",  label: "Transaction was handled accurately" },
      { key: "pp_loyalty",   label: "Loyalty program or email signup was mentioned" },
      { key: "pp_receipt",   label: "Receipt was offered and provided" },
      { key: "pp_packaging", label: "Packaging or presentation matched brand standards" },
    ],
    rated: [
      { key: "pp_checkout_staff", label: "Quality of checkout staff engagement" },
      { key: "pp_farewell",       label: "Quality of farewell interaction" },
    ],
  },
  {
    key: "digital_touchpoints", label: "Digital Touchpoints", weight: 0.10,
    yesno: [
      { key: "dt_findable",         label: "Business is easy to find online before visiting" },
      { key: "dt_website_accurate", label: "Website accurately represents the in-store experience" },
      { key: "dt_hours_match",      label: "Online hours match actual hours" },
      { key: "dt_contact_accurate", label: "Contact information is accurate and easy to find" },
      { key: "dt_reviews_responded",label: "Reviews are responded to on Google or Yelp" },
    ],
    rated: [
      { key: "dt_overall_digital", label: "Overall digital presence quality and professionalism" },
    ],
  },
  {
    key: "lasting_impression", label: "Lasting Impression", weight: 0.05,
    yesno: [
      { key: "li_would_return",    label: "Would you return based on this experience" },
      { key: "li_would_recommend", label: "Would you recommend to someone else" },
    ],
    rated: [
      { key: "li_gut_score", label: "Overall experience quality — gut feeling score" },
    ],
  },
];

// ── Score computation ──────────────────────────────────────────────────────────

/** Returns raw score 0-100 for a single dimension */
export function dimensionRawScore(
  dim: SSDimension,
  scorecard: Record<string, boolean | number>
): number {
  let total = 0, max = 0;
  for (const yn of dim.yesno) {
    max += 1;
    if (scorecard[yn.key] === true) total += 1;
  }
  for (const r of dim.rated) {
    max += 5;
    const v = scorecard[r.key];
    if (typeof v === "number") total += v;
  }
  return max === 0 ? 0 : Math.round((total / max) * 100);
}

/** Returns weighted total score 0-100 */
export function totalWeightedScore(scorecard: Record<string, boolean | number>): number {
  let score = 0;
  for (const dim of SS_DIMENSIONS) {
    score += (dimensionRawScore(dim, scorecard) / 100) * dim.weight * 100;
  }
  return Math.round(score);
}

export function ratingBand(score: number): { label: string; color: string } {
  if (score >= 90) return { label: "Exceptional",     color: "text-green-700 bg-green-100" };
  if (score >= 75) return { label: "Strong",          color: "text-blue-700 bg-blue-100" };
  if (score >= 60) return { label: "Average",         color: "text-yellow-700 bg-yellow-100" };
  if (score >= 45) return { label: "Below Average",   color: "text-orange-700 bg-orange-100" };
  return               { label: "Critical",          color: "text-red-700 bg-red-100" };
}

// ── Scorecard UI ───────────────────────────────────────────────────────────────

interface ScorecardProps {
  scorecard: Record<string, boolean | number>;
  onChange:  (updated: Record<string, boolean | number>) => void;
  readOnly?: boolean;
}

function StarRating({
  value, onChange, readOnly,
}: { value: number; onChange: (v: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange(n)}
          className={`w-7 h-7 rounded text-sm font-bold transition-colors ${
            n <= value
              ? "bg-seafoam text-navy"
              : "bg-gray-100 text-gray-400 hover:bg-seafoam/20"
          } disabled:cursor-default`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function YesNoToggle({
  value, onChange, readOnly,
}: { value: boolean | undefined; onChange: (v: boolean) => void; readOnly?: boolean }) {
  return (
    <div className="flex gap-1.5">
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(true)}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
          value === true
            ? "bg-green-500 text-white"
            : "bg-gray-100 text-gray-500 hover:bg-green-100"
        } disabled:cursor-default`}
      >
        Yes
      </button>
      <button
        type="button"
        disabled={readOnly}
        onClick={() => onChange(false)}
        className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
          value === false
            ? "bg-red-400 text-white"
            : "bg-gray-100 text-gray-500 hover:bg-red-100"
        } disabled:cursor-default`}
      >
        No
      </button>
    </div>
  );
}

export function SecretShoppingScorecard({ scorecard, onChange, readOnly }: ScorecardProps) {
  const total = totalWeightedScore(scorecard);
  const band  = ratingBand(total);

  function setVal(key: string, val: boolean | number) {
    onChange({ ...scorecard, [key]: val });
  }

  return (
    <div className="space-y-6">
      {/* Total score */}
      <div className="flex items-center gap-4 p-4 bg-navy/5 rounded-xl border border-navy/10">
        <div className="text-center">
          <div className="text-4xl font-bold text-navy" style={{ fontFamily: "Georgia, serif" }}>
            {total}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">out of 100</div>
        </div>
        <div>
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${band.color}`}>
            {band.label}
          </span>
          <p className="text-xs text-gray-400 mt-1.5">
            90-100 Exceptional · 75-89 Strong · 60-74 Average · 45-59 Below Average · Below 45 Critical
          </p>
        </div>
      </div>

      {/* Per-dimension sections */}
      {SS_DIMENSIONS.map(dim => {
        const raw = dimensionRawScore(dim, scorecard);
        return (
          <div key={dim.key} className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-seafoam" />
                <span className="font-semibold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  {dim.label}
                </span>
                <span className="text-xs text-gray-400">({Math.round(dim.weight * 100)}% weight)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500">{raw}/100</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ratingBand(raw).color}`}>
                  {ratingBand(raw).label}
                </span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {dim.yesno.map(yn => (
                <div key={yn.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-600 flex-1">{yn.label}</span>
                  <YesNoToggle
                    value={scorecard[yn.key] as boolean | undefined}
                    onChange={v => setVal(yn.key, v)}
                    readOnly={readOnly}
                  />
                </div>
              ))}
              {dim.rated.map(r => (
                <div key={r.key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-600 flex-1">{r.label}</span>
                  <StarRating
                    value={(scorecard[r.key] as number) ?? 0}
                    onChange={v => setVal(r.key, v)}
                    readOnly={readOnly}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
