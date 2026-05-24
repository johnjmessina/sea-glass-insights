import { createClient } from "@supabase/supabase-js";

if (!process.env.SUPABASE_URL) throw new Error("Missing SUPABASE_URL");
if (!process.env.SUPABASE_ANON_KEY) throw new Error("Missing SUPABASE_ANON_KEY");

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ── Types ────────────────────────────────────────────────────────────────────

export type OrderStatus = "pending_payment" | "new" | "in_progress" | "delivered";

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

// ── AnalystCommentary (kept for DB backwards-compat) ──────────────────────────

export interface AnalystCommentary {
  snapshot?:              string;
  customer_profile?:      string;
  competitive_landscape?: string;
  positioning?:           string;
  insights?:              string;
  recommendations?:       string;
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
  ai_draft:           AIDraft | null;
  analyst_commentary: AnalystCommentary | null;
  analyst_note:       string | null;
}
