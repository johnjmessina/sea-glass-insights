"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

// ── Palette ───────────────────────────────────────────────────────────────────
const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const SAND  = "#F4EADA";
const WHITE = "#FFFFFF";
const GRAY  = "#6B7280";

// ── Service display names ─────────────────────────────────────────────────────
const SERVICE_LABELS: Record<string, string> = {
  "market-intelligence-report":  "Market Intelligence Report",
  "social-media-audit":          "Social Media Audit",
  "secret-shopping":             "Secret Shopping",
  "deep-dive-report":            "Deep Dive Report",
  "synthetic-survey-report":     "Synthetic Survey Report",
  "voice-of-customer":           "Voice of Customer Survey",
  "ai-starter-kit":              "AI Starter Kit",
  "starter-intelligence":        "Starter Intelligence Bundle",
  "the-field-report":            "The Field Report Bundle",
  "market-and-mind":             "Market & Mind Bundle",
  "the-deep-field":              "The Deep Field Bundle",
  "complete-shopper-experience": "Complete Shopper Experience Bundle",
};

// ── Turnaround timeframes ─────────────────────────────────────────────────────
const TIMEFRAMES: Record<string, string> = {
  "market-intelligence-report":  "3 business days",
  "social-media-audit":          "5 business days",
  "secret-shopping":             "varies by availability",
  "deep-dive-report":            "5 business days",
  "synthetic-survey-report":     "5 business days",
  "voice-of-customer":           "we'll be in touch shortly",
  "ai-starter-kit":              "48 hours",
  "starter-intelligence":        "5 business days",
  "the-field-report":            "5 business days",
  "market-and-mind":             "5 business days",
  "the-deep-field":              "5 business days",
  "complete-shopper-experience": "5 business days",
};

// ── Question definitions ──────────────────────────────────────────────────────
type FieldDef = {
  key: string;
  label: string;
  type: "input" | "textarea";
  optional?: boolean;
};

// MIR base questions (also used for bundles)
const MIR_QUESTIONS: FieldDef[] = [
  { key: "q1", label: "What do you sell or offer?",                                  type: "textarea" },
  { key: "q2", label: "Where are you located, and who is your target market?",        type: "textarea" },
  { key: "q3", label: "Describe your ideal customer.",                                type: "textarea" },
  { key: "q4", label: "Who are your top 1–3 competitors?",                            type: "textarea" },
  { key: "q5", label: "What makes you different from competitors?",                   type: "textarea" },
  { key: "q6", label: "What's your biggest business challenge right now?",            type: "textarea" },
  { key: "q7", label: "What are your top goals for the next 6–12 months?",            type: "textarea" },
  { key: "q8", label: "How do you currently market your business?",                   type: "textarea" },
  { key: "q9", label: "Is there anything specific you'd like this report to focus on?", type: "textarea", optional: true },
];

const QUESTIONS: Record<string, FieldDef[]> = {
  "market-intelligence-report": MIR_QUESTIONS,

  "social-media-audit": [
    { key: "location",      label: "What city/region are you in?",                               type: "input" },
    { key: "industry",      label: "What industry or business type?",                             type: "input" },
    { key: "facebook",      label: "Facebook page URL or handle",                                 type: "input", optional: true },
    { key: "instagram",     label: "Instagram handle",                                            type: "input", optional: true },
    { key: "otherPlatforms",label: "Any other social platforms you use?",                         type: "input", optional: true },
    { key: "competitors",   label: "Top 1–2 competitors' social handles (if known)",              type: "input", optional: true },
    { key: "challenge",     label: "What's your biggest social media challenge?",                 type: "textarea" },
  ],

  "secret-shopping": [
    { key: "businessAddress",   label: "What is your business address?",                          type: "input" },
    { key: "industry",          label: "What industry or business type?",                         type: "input" },
    { key: "hours",             label: "What are your business hours?",                           type: "input" },
    { key: "typicalInteraction",label: "Describe a typical customer interaction",                 type: "textarea" },
    { key: "dimensions",        label: "What dimensions matter most? (e.g. staff friendliness, speed, cleanliness)", type: "textarea" },
    { key: "competitorShop",    label: "Would you like us to also shop a competitor? If yes, which one?", type: "input", optional: true },
    { key: "focus",             label: "Any specific focus areas for this visit?",                type: "textarea", optional: true },
  ],

  "deep-dive-report": [
    ...MIR_QUESTIONS,
    { key: "q10", label: "What specific decision or problem are you trying to solve?",            type: "textarea" },
    { key: "q11", label: "Have you done any prior research on this? If so, what did you find?",  type: "textarea", optional: true },
  ],

  "synthetic-survey-report": [
    { key: "q1", label: "What do you sell or offer?",                                  type: "textarea" },
    { key: "q2", label: "Where are you located, and who is your target market?",        type: "textarea" },
    { key: "q3", label: "Describe your ideal customer.",                                type: "textarea" },
    { key: "q4", label: "Who are your top 1–3 competitors?",                            type: "textarea" },
    { key: "q5", label: "What makes you different from competitors?",                   type: "textarea" },
    { key: "q6", label: "What specific questions do you want the synthetic survey to explore?", type: "textarea" },
  ],

  "voice-of-customer": [
    { key: "q1", label: "What do you sell or offer?",                                  type: "textarea" },
    { key: "q2", label: "Where are you located, and who is your target market?",        type: "textarea" },
    { key: "q3", label: "Describe your ideal customer.",                                type: "textarea" },
    { key: "q4", label: "What customer feedback or pain points prompted this survey?",  type: "textarea" },
    { key: "q5", label: "What do you most want to learn from your customers?",          type: "textarea" },
    { key: "q6", label: "How many customer contacts do you have to survey?",            type: "input" },
    { key: "q7", label: "How were these contacts collected?",                           type: "input", optional: true },
  ],

  "ai-starter-kit": [
    { key: "q1", label: "What type of business do you run?",                            type: "input" },
    { key: "q2", label: "Describe your brand voice and tone",                           type: "textarea" },
    { key: "q3", label: "Which AI tool do you use or plan to use? (ChatGPT, Claude, etc.)", type: "input" },
    { key: "q4", label: "What tasks do you most want AI help with?",                    type: "textarea" },
    { key: "q5", label: "Who is your typical customer?",                                type: "textarea" },
    { key: "q6", label: "Anything else we should know about your business?",            type: "textarea", optional: true },
  ],
};

// Bundles use MIR questions as a base
const BUNDLE_SERVICES = ["starter-intelligence", "the-field-report", "market-and-mind", "the-deep-field", "complete-shopper-experience"];

function getQuestions(service: string): FieldDef[] {
  if (BUNDLE_SERVICES.includes(service)) return MIR_QUESTIONS;
  return QUESTIONS[service] ?? MIR_QUESTIONS;
}

// ── Shared input styles ───────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Montserrat', sans-serif",
  fontSize: "0.7rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: NAVY,
  marginBottom: "6px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  border: `1.5px solid #D1D5DB`,
  borderRadius: "8px",
  padding: "10px 14px",
  fontFamily: "'Montserrat', sans-serif",
  fontSize: "0.9rem",
  color: NAVY,
  outline: "none",
  background: WHITE,
  transition: "border-color 0.15s",
};

// ── Main page ─────────────────────────────────────────────────────────────────
export default function IntakePage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [service, setService] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [businessName, setBusinessName] = useState("");

  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Load order info on mount ──────────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    fetch(`/api/intake/lookup?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setService(data.service ?? "market-intelligence-report");
        setCustomerName(data.customerName ?? "");
        setBusinessName(data.businessName ?? "");
        if (data.alreadySubmitted) setAlreadySubmitted(true);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token]);

  // ── Form handlers ─────────────────────────────────────────────────────────
  function handleChange(key: string, val: string) {
    setValues(prev => ({ ...prev, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Unknown error");
      if (data.alreadySubmitted) { setAlreadySubmitted(true); return; }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────
  const serviceLabel = SERVICE_LABELS[service] ?? service;
  const timeframe    = TIMEFRAMES[service] ?? "5 business days";
  const questions    = getQuestions(service);

  const pageStyle: React.CSSProperties = {
    minHeight: "100vh",
    backgroundColor: SAND,
    display: "flex",
    flexDirection: "column",
  };

  const cardStyle: React.CSSProperties = {
    background: WHITE,
    borderRadius: "16px",
    boxShadow: "0 2px 24px rgba(10,47,97,0.08)",
    padding: "48px 40px",
    maxWidth: "640px",
    width: "100%",
    margin: "0 auto",
  };

  function StateCard({ children }: { children: React.ReactNode }) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 16px" }}>
        <div style={cardStyle}>{children}</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <SiteNav />
        <StateCard>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: GRAY, textAlign: "center" }}>Loading your intake form…</p>
        </StateCard>
        <SiteFooter />
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={pageStyle}>
        <SiteNav />
        <StateCard>
          <h1 style={{ fontFamily: "Georgia, serif", color: NAVY, fontSize: "1.5rem", marginBottom: "12px" }}>
            Intake link not found
          </h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", color: GRAY, fontSize: "0.9rem", lineHeight: 1.6 }}>
            This intake link is invalid or has expired. Please check your email for the correct link, or contact us if you need help.
          </p>
        </StateCard>
        <SiteFooter />
      </div>
    );
  }

  if (alreadySubmitted) {
    return (
      <div style={pageStyle}>
        <SiteNav />
        <StateCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", color: NAVY, fontSize: "1.5rem", marginBottom: "12px" }}>
              Already received!
            </h1>
            <p style={{ fontFamily: "'Montserrat', sans-serif", color: GRAY, fontSize: "0.9rem", lineHeight: 1.7 }}>
              We already have your intake — we'll be in touch soon.
            </p>
          </div>
        </StateCard>
        <SiteFooter />
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={pageStyle}>
        <SiteNav />
        <StateCard>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke={WHITE} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: "Georgia, serif", color: NAVY, fontSize: "1.6rem", marginBottom: "16px" }}>
              You're all set!
            </h1>
            <p style={{ fontFamily: "'Montserrat', sans-serif", color: GRAY, fontSize: "0.95rem", lineHeight: 1.7 }}>
              We'll get to work on your <strong style={{ color: NAVY }}>{serviceLabel}</strong> and be in touch within <strong style={{ color: NAVY }}>{timeframe}</strong>.
            </p>
          </div>
        </StateCard>
        <SiteFooter />
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      <SiteNav />

      <main style={{ flex: 1, padding: "48px 16px 64px" }}>
        <div style={{ ...cardStyle }}>
          {/* Header */}
          <div style={{ marginBottom: "36px" }}>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: TEAL, marginBottom: "8px" }}>
              {serviceLabel}
            </p>
            <h1 style={{ fontFamily: "Georgia, serif", color: NAVY, fontSize: "1.75rem", fontWeight: 400, marginBottom: "10px", lineHeight: 1.25 }}>
              {businessName ? `${businessName}` : "Complete your intake"}
            </h1>
            <p style={{ fontFamily: "'Montserrat', sans-serif", color: GRAY, fontSize: "0.875rem", lineHeight: 1.6 }}>
              Complete your intake to get started{customerName ? `, ${customerName}` : ""}.
            </p>
            <div style={{ marginTop: "16px", height: "2px", width: "48px", background: TEAL, borderRadius: "2px" }} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {questions.map((field) => (
                <div key={field.key}>
                  <label htmlFor={field.key} style={labelStyle}>
                    {field.label}
                    {field.optional && (
                      <span style={{ fontWeight: 400, color: GRAY, textTransform: "none", letterSpacing: 0, marginLeft: "6px", fontSize: "0.7rem" }}>
                        (optional)
                      </span>
                    )}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.key}
                      rows={4}
                      required={!field.optional}
                      value={values[field.key] ?? ""}
                      onChange={e => handleChange(field.key, e.target.value)}
                      style={{ ...inputStyle, resize: "vertical", minHeight: "100px" }}
                    />
                  ) : (
                    <input
                      id={field.key}
                      type="text"
                      required={!field.optional}
                      value={values[field.key] ?? ""}
                      onChange={e => handleChange(field.key, e.target.value)}
                      style={inputStyle}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && (
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem", color: "#DC2626", marginTop: "20px" }}>
                {error}
              </p>
            )}

            <div style={{ marginTop: "36px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: "inline-block",
                  backgroundColor: submitting ? GRAY : NAVY,
                  color: WHITE,
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.9rem",
                  letterSpacing: "0.04em",
                  padding: "14px 40px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background-color 0.15s",
                }}
              >
                {submitting ? "Submitting…" : "Submit Intake"}
              </button>
            </div>
          </form>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
