"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import {
  SelectWithOther, AgeIncomeCheckboxes, CompetitorFields, CheckboxGroupWithOther,
  BUSINESS_TYPES, DURATION_OPTIONS, MARKETING_CHANNELS,
} from "@/components/StructuredFormInputs";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const SAND  = "#F4EADA";
const GRAY  = "#6B7280";
const LGRAY = "#9CA3AF";
const WHITE = "#FFFFFF";

const CHECKLIST = [
  "Executive Summary",
  "Business Snapshot",
  "Customer Profile (3 segments)",
  "Competitive Landscape (up to 3 competitors)",
  "Market Positioning analysis",
  "Key Insights",
  "Actionable Recommendations",
  "Analyst note",
];

const HIW = [
  { num: "1", title: "Tell Us About Your Business", body: "Answer a short intake form about your market, customers, and goals. Takes about 15 minutes. Please only share what you are comfortable sharing publicly — your responses will be used to generate your report with the assistance of AI." },
  { num: "2", title: "A Real Analyst Gets to Work", body: "I personally review every submission, combining professional research methodology with AI intelligence to provide something genuinely useful." },
  { num: "3", title: "Your Report Arrives", body: "A professionally written report lands in your inbox within the promised timeframe. Insights you can act on immediately." },
];

type FormData = {
  customerName: string; businessName: string; email: string;
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8: string; q9: string; q10: string;
};

const EMPTY: FormData = {
  customerName: "", businessName: "", email: "",
  q1: "", q2: "", q3: "", q4: "", q5: "",
  q6: "", q7: "", q8: "", q9: "", q10: "",
};

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk   = "border-gray-300 bg-white";
const inputErr  = "border-red-400 bg-red-50";

export default function GetReportPage() {
  const router = useRouter();
  const [form, setForm]           = useState<FormData>(EMPTY);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  // ── Structured-input state ─────────────────────────────────────────────────
  // These are separate from form.q_n and get merged at submit time.
  const [bizType,  setBizType]  = useState(""); // supplemental to q1
  const [duration, setDuration] = useState(""); // supplemental to q2 (location stays in form.q2)

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    // Contact
    if (!form.customerName.trim()) newErrors.customerName = "This field is required.";
    if (!form.businessName.trim()) newErrors.businessName = "This field is required.";
    if (!form.email.trim()) newErrors.email = "This field is required.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Please enter a valid email address.";
    // Q1 — text description required; bizType optional
    if (!form.q1.trim()) newErrors.q1 = "This field is required.";
    // Q2 — location text required
    if (!form.q2.trim() && !duration) newErrors.q2 = "This field is required.";
    // Q3 — structured (AgeIncomeCheckboxes writes directly into form.q3)
    if (!form.q3.trim()) newErrors.q3 = "Please describe your ideal customer.";
    // Q4 — structured (CompetitorFields writes into form.q4)
    if (!form.q4.trim()) newErrors.q4 = "Please enter at least one competitor.";
    // Q5-Q7, Q9-Q10 — plain text, all required
    if (!form.q5.trim()) newErrors.q5 = "This field is required.";
    if (!form.q6.trim()) newErrors.q6 = "This field is required.";
    if (!form.q7.trim()) newErrors.q7 = "This field is required.";
    if (!form.q8.trim()) newErrors.q8 = "Please select at least one option.";
    if (!form.q9.trim()) newErrors.q9 = "This field is required.";
    if (!form.q10.trim()) newErrors.q10 = "This field is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) {
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Merge supplemental structured values
    const q1val = [form.q1.trim(), bizType ? `Business type: ${bizType}` : ""].filter(Boolean).join("\n\n");
    const q2val = [duration, form.q2.trim()].filter(Boolean).join(". ");
    sessionStorage.setItem("sgi_intake", JSON.stringify({ ...form, q1: q1val, q2: q2val }));
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "64px 24px 16px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
          Most Popular Service
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Market Intelligence Report
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$199</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: GRAY }}>48-72 hour delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: GRAY, maxWidth: "520px", margin: "0 auto 28px" }}>
          Your market, your customers, your competitors in one professionally written report. AI generates the research foundation. A real analyst reviews, refines, and makes sure every insight is relevant to your business.
        </p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: "transparent", color: NAVY, border: "1.5px solid #0A2F61", fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>
          Get Started →
        </a>
      </section>

      {/* ── TRUST LINE ── */}
      <div style={{ backgroundColor: SAND, padding: "6px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>
          Analyst-reviewed. Flat fee. No surprises.
        </p>
      </div>

      {/* ── TWO-COLUMN ── */}
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
          </div>
          <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(10,47,97,0.08)" }}>
            <h2 style={{ fontFamily: CG, fontSize: "1.5rem", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>How It Works</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {HIW.map(({ num, title, body }) => (
                <div key={num} style={{ display: "flex", gap: "14px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: NAVY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CG, fontSize: "0.95rem", fontWeight: 700, flexShrink: 0 }}>{num}</div>
                  <div>
                    <h4 style={{ fontFamily: CG, fontSize: "1.05rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{title}</h4>
                    <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, lineHeight: 1.7 }}>{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── INTAKE FORM ── */}
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "16px 16px 64px" }}>
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto space-y-8">

          {/* Contact */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2 style={{ fontFamily: CG, color: NAVY, fontSize: "1.4rem", fontWeight: 700 }}>Your Contact Information</h2>
            <div>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>Your Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Jane Smith" value={form.customerName} onChange={e => set("customerName", e.target.value)}
                className={`${inputBase} ${errors.customerName ? inputErr : inputOk}`} style={{ fontFamily: MT }} data-error={errors.customerName ? true : undefined} />
              {errors.customerName && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.customerName}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>Business Name <span className="text-red-500">*</span></label>
              <input type="text" placeholder="Acme Coffee Co." value={form.businessName} onChange={e => set("businessName", e.target.value)}
                className={`${inputBase} ${errors.businessName ? inputErr : inputOk}`} style={{ fontFamily: MT }} data-error={errors.businessName ? true : undefined} />
              {errors.businessName && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.businessName}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>Email Address <span className="text-red-500">*</span></label>
              <input type="email" placeholder="jane@acmecoffee.com" value={form.email} onChange={e => set("email", e.target.value)}
                className={`${inputBase} ${errors.email ? inputErr : inputOk}`} style={{ fontFamily: MT }} data-error={errors.email ? true : undefined} />
              {errors.email && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.email}</p>}
              <p className="text-gray-400 text-xs mt-1" style={{ fontFamily: MT }}>Your report will be delivered to this address.</p>
            </div>
          </div>

          {/* Intake */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <h2 style={{ fontFamily: CG, color: NAVY, fontSize: "1.4rem", fontWeight: 700 }}>Share what you know. We&rsquo;ll find what matters.</h2>

            {/* Q1 — text + business type dropdown */}
            <div data-error={errors.q1 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                1. What is your business name and what do you sell or offer? <span className="text-red-500">*</span>
              </label>
              <textarea rows={3} placeholder="e.g. Anchor Coffee Co. — specialty coffee shop and retail roastery in Bradley Beach, NJ."
                value={form.q1} onChange={e => set("q1", e.target.value)}
                className={`${inputBase} resize-y ${errors.q1 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
              {errors.q1 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q1}</p>}
              <div className="mt-3">
                <SelectWithOther
                  label="Business type"
                  options={BUSINESS_TYPES}
                  placeholder="Select your business type…"
                  onChange={setBizType}
                />
              </div>
            </div>

            {/* Q2 — duration + location */}
            <div data-error={errors.q2 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                2. How long have you been in business, and where are you located? <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                <SelectWithOther
                  label="Time in business"
                  options={DURATION_OPTIONS}
                  placeholder="Select how long you've been open…"
                  onChange={setDuration}
                />
                <div className="mt-2">
                  <label className="block text-xs text-gray-500 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>Location</label>
                  <input type="text" placeholder="e.g. Bradley Beach, NJ" value={form.q2} onChange={e => set("q2", e.target.value)}
                    className={`${inputBase} ${errors.q2 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
                </div>
              </div>
              {errors.q2 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q2}</p>}
            </div>

            {/* Q3 — age/income checkboxes */}
            <div data-error={errors.q3 ? true : undefined}>
              <AgeIncomeCheckboxes
                label="3. Who is your ideal customer? (age, income, lifestyle, problem they have)"
                onChange={v => { set("q3", v); }}
                error={errors.q3}
                required
              />
            </div>

            {/* Q4 — three competitor fields */}
            <div data-error={errors.q4 ? true : undefined}>
              <CompetitorFields
                label="4. Who are your top competitors?"
                hint="Competitor 1 is required. 2 and 3 are optional but recommended."
                onChange={v => set("q4", v)}
                error={errors.q4}
              />
            </div>

            {/* Q5 — plain text */}
            <div data-error={errors.q5 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                5. What makes you different from those competitors? <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} placeholder="Write as much detail as you like…" value={form.q5} onChange={e => set("q5", e.target.value)}
                className={`${inputBase} resize-y ${errors.q5 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
              {errors.q5 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q5}</p>}
            </div>

            {/* Q6 — plain text */}
            <div data-error={errors.q6 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                6. What is the biggest challenge you are facing right now? <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} placeholder="Write as much detail as you like…" value={form.q6} onChange={e => set("q6", e.target.value)}
                className={`${inputBase} resize-y ${errors.q6 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
              {errors.q6 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q6}</p>}
            </div>

            {/* Q7 — plain text */}
            <div data-error={errors.q7 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                7. What does success look like for you in the next 12 months? <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} placeholder="Write as much detail as you like…" value={form.q7} onChange={e => set("q7", e.target.value)}
                className={`${inputBase} resize-y ${errors.q7 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
              {errors.q7 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q7}</p>}
            </div>

            {/* Q8 — marketing checkboxes */}
            <div data-error={errors.q8 ? true : undefined}>
              <CheckboxGroupWithOther
                label="8. What marketing are you currently doing, if any?"
                hint="Select all that apply."
                options={MARKETING_CHANNELS}
                onChange={v => set("q8", v)}
                error={errors.q8}
                required
                otherPlaceholder="Describe other marketing channels…"
              />
            </div>

            {/* Q9 — plain text */}
            <div data-error={errors.q9 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                9. What do you wish you knew about your market or customers that you don&rsquo;t know today? <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} placeholder="Write as much detail as you like…" value={form.q9} onChange={e => set("q9", e.target.value)}
                className={`${inputBase} resize-y ${errors.q9 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
              {errors.q9 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q9}</p>}
            </div>

            {/* Q10 — plain text */}
            <div data-error={errors.q10 ? true : undefined}>
              <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>
                10. Is there anything else you want the report to focus on or address? <span className="text-red-500">*</span>
              </label>
              <textarea rows={4} placeholder="Write as much detail as you like…" value={form.q10} onChange={e => set("q10", e.target.value)}
                className={`${inputBase} resize-y ${errors.q10 ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
              {errors.q10 && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors.q10}</p>}
            </div>
          </div>

          {submitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700 text-sm" style={{ fontFamily: MT }}>
              Please fill in all required fields before proceeding.
            </div>
          )}

          {/* BUNDLE CALLOUTS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
              <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Starter Intelligence — Bundle and save</p>
              <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Social Media Audit and save $49.</p>
              <p style={{ fontFamily: MT, fontSize: "0.85rem", color: "#6B7280" }}>Get both for <strong style={{ color: NAVY }}>$349</strong>. <a href="/bundles#starter-intelligence" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>See bundle →</a></p>
            </div>
            <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
              <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>The Field Report — Bundle and save</p>
              <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Secret Shopping visit and save $49.</p>
              <p style={{ fontFamily: MT, fontSize: "0.85rem", color: "#6B7280" }}>Get both for <strong style={{ color: NAVY }}>$449</strong>. <a href="/bundles#the-field-report" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>See bundle →</a></p>
            </div>
            <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
              <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Market &amp; Mind — Bundle and save</p>
              <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Synthetic Survey Report and save $49.</p>
              <p style={{ fontFamily: MT, fontSize: "0.85rem", color: "#6B7280" }}>Get both for <strong style={{ color: NAVY }}>$549</strong>. <a href="/bundles#market-and-mind" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>See bundle →</a></p>
            </div>
          </div>

          <div className="text-center pb-4">
            <p className="text-gray-500 text-sm mb-4" style={{ fontFamily: MT }}>You will be taken to a secure checkout page to complete your $199 payment.</p>
            <button type="submit" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "14px 40px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
              Proceed to Payment →
            </button>
          </div>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}
