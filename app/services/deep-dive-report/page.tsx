"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";
import ServiceFormField from "@/components/ServiceFormField";
import {
  SelectWithOther,
  AgeIncomeCheckboxes,
  CompetitorFields,
  PillGroupWithOther,
  YesNoReveal,
  BUSINESS_TYPES,
  DURATION_OPTIONS,
  MARKETING_CHANNELS,
  DECISION_TYPES,
} from "@/components/StructuredFormInputs";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

const CHECKLIST = [
  "Everything in the Market Intelligence Report",
  "Deeper Competitive Intelligence per competitor",
  "Additional Customer Segments",
  "Expanded Market Context and trend analysis",
  "Extended Recommendations with implementation guidance",
  "Priority Action Framework",
  "Decision-Specific Analysis section",
  "Expanded Analyst Interpretation",
];
const HIW = [
  { num: "1", title: "Tell Us About Your Business", body: "Fill out the form below with your business context, competitive landscape, and — critically — the specific decision or problem you're trying to solve. The more detail you share, the sharper the report will be." },
  { num: "2", title: "A Real Analyst Gets to Work", body: "We research your market, your competitors, and your positioning with greater rigor than the standard report allows. More sources, more time, more context for your specific situation." },
  { num: "3", title: "Your Report Arrives", body: "A deeply researched report with a decision-specific analysis section lands in your inbox within 5-7 days. Comprehensive findings and a prioritized action framework included." },
];

type FormData = { customerName: string; email: string; businessName: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q11: string; q12: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "", q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q11: "", q12: "" };

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function DeepDiveReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formStep, setFormStep] = useState<1|2|3>(1);

  const [bizType,      setBizType]      = useState("");
  const [duration,     setDuration]     = useState("");
  const [decisionType, setDecisionType] = useState("");
  const [yesQ12,       setYesQ12]       = useState<boolean | null>(null);

  function set(f: keyof FormData, v: string) { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: undefined })); }

  function validateStep(step: 1|2|3): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 1) {
      if (!form.customerName.trim()) e.customerName = "This field is required.";
      if (!form.email.trim()) e.email = "This field is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
      if (!form.businessName.trim()) e.businessName = "This field is required.";
    } else if (step === 2) {
      if (!form.q1.trim()) e.q1 = "This field is required.";
      if (!form.q2.trim()) e.q2 = "This field is required.";
      if (!form.q3.trim()) e.q3 = "This field is required.";
      if (!form.q4.trim()) e.q4 = "This field is required.";
      if (!form.q5.trim()) e.q5 = "This field is required.";
      if (!form.q6.trim()) e.q6 = "This field is required.";
      if (!form.q7.trim()) e.q7 = "This field is required.";
      if (!form.q8.trim()) e.q8 = "This field is required.";
      if (!form.q9.trim()) e.q9 = "This field is required.";
    } else {
      if (!decisionType.trim()) e.q11 = "This field is required.";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleContinue() {
    if (!validateStep(formStep)) return;
    setFormStep(s => (s + 1) as 1|2|3);
    setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function handleBack() {
    setFormStep(s => (s - 1) as 1|2|3);
    setErrors({});
    setTimeout(() => document.getElementById("intake-form")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (formStep !== 3) { handleContinue(); return; }
    setSubmitted(true);
    if (!validateStep(3)) { document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    const q1combined  = form.q1 + (bizType ? "\n\nBusiness type: " + bizType : "");
    const q2combined  = [duration, form.q2.trim()].filter(Boolean).join(". ");
    const q11combined = [decisionType, form.q11.trim()].filter(Boolean).join(". ");
    const q12combined = yesQ12 === false ? "No" : yesQ12 === true ? ("Yes" + (form.q12.trim() ? ` — ${form.q12.trim()}` : "")) : "";

    sessionStorage.setItem("sgi_intake", JSON.stringify({
      service: "deep-dive-report",
      ...form,
      q1:  q1combined,
      q2:  q2combined,
      q11: q11combined,
      q12: q12combined,
    }));
    router.push("/checkout");
  }

  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 16px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Deep Dive Report</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Deeper intelligence. Clearer direction.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$399</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: GRAY }}>5-7 day delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: GRAY, maxWidth: "560px", margin: "0 auto 28px" }}>Everything in the Market Intelligence Report, but deeper. The same competitor set examined with greater rigor, more sources, more context, and more analyst time spent on what each finding actually means for your business. Built for businesses facing a major decision or responding to a significant competitive threat.</p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: "transparent", color: NAVY, border: "1.5px solid #0A2F61", fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started →</a>
      </section>

      {/* TRUST LINE */}
      <div style={{ backgroundColor: SAND, padding: "6px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>

      {/* TWO-COLUMN */}
      <section style={{ backgroundColor: SAND, padding: "16px 24px 16px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "48px", alignItems: "stretch" }}>
          <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(10,47,97,0.08)" }}>
            <h2 style={{ fontFamily: CG, fontSize: "1.5rem", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>What&rsquo;s Included</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {CHECKLIST.map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ color: TEAL, fontWeight: 700, fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>✓</span>
                  <span style={{ fontFamily: MT, fontSize: "0.9rem", color: NAVY, lineHeight: 1.5 }}>{item}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginTop: "20px", lineHeight: 1.7, fontStyle: "italic" }}>
              Every section includes an optional Analyst Perspective &mdash; your analyst&rsquo;s expert take on what the findings mean specifically for your business, your market, and your next move.
            </p>
          </div>
          <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(10,47,97,0.08)" }}>
            <h2 style={{ fontFamily: CG, fontSize: "1.5rem", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>How It Works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {HIW.map(({ num, title, body }) => (
                <div key={num} style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: NAVY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CG, fontSize: "0.95rem", fontWeight: 700, flexShrink: 0 }}>{num}</div>
                  <div><h4 style={{ fontFamily: CG, fontSize: "1.05rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{title}</h4><p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, lineHeight: 1.7 }}>{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* INTAKE FORM */}
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "16px 24px 48px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your Deep Dive Report</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "36px", lineHeight: 1.7 }}>The more context you provide, the more targeted the analysis will be. After submitting you&rsquo;ll be directed to a secure payment page.</p>

          {/* Step progress indicator */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {([1, 2, 3] as const).map(n => (
                <div key={n} style={{ width: "28px", height: "4px", borderRadius: "2px", backgroundColor: n <= formStep ? TEAL : "#E5E7EB", transition: "background-color 0.3s" }} />
              ))}
            </div>
            <span style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: GRAY, letterSpacing: "0.08em" }}>
              STEP {formStep} OF 3
            </span>
          </div>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

            {/* ── Step 1: Contact Information ── */}
            <div style={{ display: formStep === 1 ? "block" : "none" }}>
              <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Contact Information</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <ServiceFormField label="Your Name" required placeholder="Jane Smith" value={form.customerName} error={errors.customerName} onChange={v => set("customerName", v)} />
                  <ServiceFormField label="Email Address" required placeholder="jane@yourbusiness.com" value={form.email} error={errors.email} onChange={v => set("email", v)} />
                  <ServiceFormField label="Business Name" required placeholder="Acme Coffee Co." value={form.businessName} error={errors.businessName} onChange={v => set("businessName", v)} />
                </div>
              </div>
            </div>

            {/* ── Step 2: Business Context ── */}
            <div style={{ display: formStep === 2 ? "block" : "none" }}>
              <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>Business Context</h3>
                <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>These questions give us the foundation for the research. More detail here means sharper insights in your report.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* Q1 */}
                  <div>
                    <ServiceFormField label="1. What do you sell or offer?" required placeholder="e.g. Specialty coffee shop and retail roastery in Bradley Beach, NJ. We serve single-origin pour-overs and sell retail bags roasted in-house." rows={3} value={form.q1} error={errors.q1} onChange={v => set("q1", v)} />
                    <div style={{ marginTop: "12px" }}>
                      <SelectWithOther label="Business type" options={BUSINESS_TYPES} onChange={v => setBizType(v)} />
                    </div>
                  </div>

                  {/* Q2 */}
                  <div>
                    <label style={{ display: "block", fontFamily: MT, fontSize: "0.875rem", fontWeight: 600, color: "#374151", marginBottom: "8px" }}>
                      2. How long have you been in business, and where are you located?<span style={{ color: "#EF4444", marginLeft: "4px" }}>*</span>
                    </label>
                    <SelectWithOther label="How long in business" options={DURATION_OPTIONS} onChange={v => setDuration(v)} error={errors.q2} />
                    <input
                      type="text"
                      value={form.q2}
                      onChange={e => set("q2", e.target.value)}
                      placeholder="Location (e.g. Bradley Beach, NJ)"
                      className={cls("q2")}
                      style={{ fontFamily: MT, marginTop: "8px" }}
                    />
                    {errors.q2 && <p style={{ color: "#EF4444", fontSize: "0.75rem", marginTop: "4px" }}>{errors.q2}</p>}
                  </div>

                  {/* Q3 */}
                  <AgeIncomeCheckboxes
                    label="3. Who is your ideal customer?"
                    hint="Age, income, lifestyle, and what they need from a business like yours."
                    required
                    onChange={v => set("q3", v)}
                    error={errors.q3}
                  />

                  {/* Q4 */}
                  <CompetitorFields
                    label="4. Who are your top 2–3 competitors?"
                    hint="Names, or describe them if you don't know exact names."
                    withDescription={true}
                    withLocation={true}
                    onChange={v => set("q4", v)}
                    error={errors.q4}
                  />

                  <ServiceFormField label="5. What makes you different from those competitors?" required placeholder="e.g. We roast in-house, our staff knows the product deeply, and we have a loyalty base that treats us like a community hub." rows={3} value={form.q5} error={errors.q5} onChange={v => set("q5", v)} />
                  <ServiceFormField label="6. What is the biggest challenge you are facing right now?" required placeholder="e.g. The new shop that opened across town is pulling our afternoon regulars and we don't know why." rows={3} value={form.q6} error={errors.q6} onChange={v => set("q6", v)} />
                  <ServiceFormField label="7. What does success look like for you in the next 12 months?" required placeholder="e.g. Stabilize our customer base, grow revenue by 20%, and have a clear strategy for the off-season." rows={3} value={form.q7} error={errors.q7} onChange={v => set("q7", v)} />

                  {/* Q8: marketing channels — pill toggles */}
                  <PillGroupWithOther
                    label="8. What marketing are you currently doing, if any?"
                    options={MARKETING_CHANNELS}
                    required
                    onChange={v => set("q8", v)}
                    error={errors.q8}
                  />

                  {/* Q9: combined open-ended question */}
                  <ServiceFormField
                    label="9. Is there anything specific you want the report to focus on or address? What do you wish you knew about your market, your customers, or your competition that you don't know today? Use this space to share anything else that feels relevant."
                    required
                    placeholder="e.g. Why our lunch traffic is weaker than our morning traffic, and whether there's an untapped customer segment we're missing."
                    rows={5}
                    value={form.q9}
                    error={errors.q9}
                    onChange={v => set("q9", v)}
                  />
                </div>
              </div>
            </div>

            {/* ── Step 3: Deep Dive Specifics ── */}
            <div style={{ display: formStep === 3 ? "flex" : "none", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>Deep Dive Specifics</h3>
                <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>These questions are what separate the Deep Dive from a standard report. Take your time here — your answers directly shape the decision-specific section of the analysis.</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                  {/* Q10 display (q11 in FormData) */}
                  <div>
                    <SelectWithOther
                      label="10. What specific decision are you trying to make or problem are you trying to solve with this report?"
                      hint="Be as specific as possible. The more clearly you define the question, the more targeted the analysis."
                      options={DECISION_TYPES}
                      required
                      onChange={v => { setDecisionType(v); if (errors.q11) setErrors(p => ({ ...p, q11: undefined })); }}
                      error={errors.q11}
                    />
                    <textarea
                      rows={4}
                      value={form.q11}
                      onChange={e => set("q11", e.target.value)}
                      placeholder="e.g. We are deciding whether to sign a lease on a second location in Asbury Park by the end of Q3. I need to understand whether the market can support it and whether our current brand positioning translates to that area."
                      className={`${inputBase} ${inputOk}`}
                      style={{ fontFamily: MT, marginTop: "8px", resize: "vertical" }}
                    />
                  </div>

                  {/* Q11 display (q12 in FormData) */}
                  <YesNoReveal
                    label="11. Have you done any market research before?"
                    onToggle={yes => { setYesQ12(yes); if (!yes) set("q12", ""); }}
                  >
                    <textarea
                      rows={3}
                      value={form.q12}
                      onChange={e => set("q12", e.target.value)}
                      placeholder="e.g. We ran a customer survey two years ago. Key finding was that people come for the atmosphere as much as the coffee. We haven't done anything formal since."
                      className={`${inputBase} ${inputOk}`}
                      style={{ fontFamily: MT, resize: "vertical", width: "100%" }}
                    />
                  </YesNoReveal>
                </div>
              </div>
            </div>

            {/* ── Navigation buttons ── */}
            {formStep === 1 && (
              <div style={{ textAlign: "right" }}>
                <button type="button" onClick={handleContinue} style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Continue &rarr;
                </button>
              </div>
            )}
            {formStep === 2 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" onClick={handleBack} style={{ fontFamily: MT, fontSize: "0.9rem", fontWeight: 500, color: GRAY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  &larr; Back
                </button>
                <button type="button" onClick={handleContinue} style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Continue &rarr;
                </button>
              </div>
            )}
            {formStep === 3 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <button type="button" onClick={handleBack} style={{ fontFamily: MT, fontSize: "0.9rem", fontWeight: 500, color: GRAY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline", paddingTop: "6px" }}>
                  &larr; Back
                </button>
                <div style={{ textAlign: "right" }}>
                  <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                    Proceed to Payment &mdash; $399
                  </button>
                  <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "12px" }}>Please only share what you are comfortable sharing publicly. Your responses are used solely to produce your report.</p>
                </div>
              </div>
            )}

          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
