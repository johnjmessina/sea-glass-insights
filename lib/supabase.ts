import { createClient } from "@supabase/supabase-js";
import type { ServiceType } from "@/lib/serviceConfig";
export type { ServiceType };

if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_ANON_KEY) throw new Error("Missing SUPABASE_ANON_KEY");

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending_payment" | "new" | "in_progress" | "delivered";

// ── Service data — stored in service_data jsonb column ────────────────────────
export interface SSVisitOverview {
  business_name:   string;
  location:        string;
  date_of_visit:   string;
  time_of_visit:   string;
  shopper_scenario:string;
  template_used:   string;
}

export interface SSAnalystObs {
  best_moment:              string;
  biggest_miss:             string;
  immediate_fix:            string;
  additional_observations:  string;
}

export interface ServiceData {
  // Secret Shopping
  ss_visit_overview?:  SSVisitOverview;
  ss_scorecard?:       Record<string, boolean | number>;
  ss_analyst_obs?:     SSAnalystObs;
  // Voice of Customer
  voc_phase?:          1 | 2;
  voc_responses?:      string;
  // Bundles — secondary service
  secondary_draft?:       Record<string, string>;
  secondary_commentary?:  Record<string, { notes: string; locked: boolean }>;
  // catch-all
  [key: string]: unknown;
}

// ── AIDraft sub-types (structured format) ─────────────────────────────────────

export interface CustomerSegment {
  name: string;        // 3-5 word segment label
  desc: string;        // one-sentence description
  motivation: string;  // primary purchase motivation
  key_need: string;    // single most important need
}

export interface Competitor {
  name: string;        // competitor name or descriptor
  strength: string;    // their main competitive advantage
  edge: string;        // client's edge over them
}

export interface Positioning {
  strengths:      string[];
  vulnerabilities: string[];
}

export interface Insight {
  title: string;  // 5-8 word insight title
  body:  string;  // 2-3 sentence explanation
}

export interface Recommendation {
  title: string;  // 5-8 word action title
  body:  string;  // 2-3 sentence explanation
}

// ── AIDraft ───────────────────────────────────────────────────────────────────

export interface AIDraft {
  snapshot:              string;
  customer_profile:      CustomerSegment[];
  competitive_landscape: Competitor[];
  positioning:           Positioning;
  insights:              Insight[];
  recommendations:       Recommendation[];
}

// ── SectionMeta — per-section analyst notes + lock state ─────────────────────

export interface SectionMeta {
  notes:  string;
  locked: boolean;
}

// ── AnalystCommentary — stored in analyst_commentary jsonb column ─────────────

export interface AnalystCommentary {
  snapshot?:              SectionMeta;
  customer_profile?:      SectionMeta;
  competitive_landscape?: SectionMeta;
  positioning?:           SectionMeta;
  insights?:              SectionMeta;
  recommendations?:       SectionMeta;
}

// ── Order ─────────────────────────────────────────────────────────────────────

export interface Order {
  id:                        string;
  created_at:                string;
  customer_name:             string;
  business_name:             string;
  email:                     string;
  status:                    OrderStatus;
  stripe_session_id:         string | null;
  stripe_payment_intent_id:  string | null;
  paid_at:                   string | null;
  q1:  string | null;
  q2:  string | null;
  q3:  string | null;
  q4:  string | null;
  q5:  string | null;
  q6:  string | null;
  q7:  string | null;
  q8:  string | null;
  q9:  string | null;
  q10: string | null;
  ai_draft:           AIDraft | Record<string, string> | null;
  analyst_commentary: AnalystCommentary | Record<string, { notes: string; locked: boolean }> | null;
  analyst_note:       string | null;
  executive_summary:  string | null;
  // Multi-service support
  service_type:       ServiceType | null;
  service_data:       ServiceData | null;
}
