"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

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

const QUESTIONS = [
  { id: "q1",  label: "1. What is your business name and what do you sell or offer?" },
  { id: "q2",  label: "2. How long have you been in business, and where are you located?" },
  { id: "q3",  label: "3. Who is your ideal customer? (age, income, lifestyle, problem they have)" },
  { id: "q4",  label: "4. Who are your top 2–3 competitors? (names, or describe them)" },
  { id: "q5",  label: "5. What makes you different from those competitors?" },
  { id: "q6",  label: "6. What is the biggest challenge you are facing right now?" },
  { id: "q7",  label: "7. What does success look like for you in the next 12 months?" },
  { id: "q8",  label: "8. What marketing are you currently doing, if any?" },
  { id: "q9",  label: "9. What do you wish you knew about your market or customers that you don't know today?" },
  { id: "q10", label: "10. Is there anything else you want the report to focus on or address?" },
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

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    (Object.keys(EMPTY) as (keyof FormData)[]).forEach(key => {
      if (!form[key].trim()) newErrors[key] = "This field is required.";
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Please enter a valid email address.";
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
    sessionStorage.setItem("sgi_intake", JSON.stringify(form));
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
          Most Popular Service
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Market Intelligence Report
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$199</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>48-72 hour delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto 28px" }}>
          Your market, your customers, your competitors in one professionally written report. AI generates the research foundation. A real analyst reviews, refines, and makes sure every insight is relevant to your business.
        </p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>
          Get Started →
        </a>
      </section>

      {/* ── TRUST LINE ── */}
      <div style={{ backgroundColor: WHITE, padding: "14px 24px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>
          Analyst-reviewed. Flat fee. No surprises.
        </p>
      </div>

      {/* ── TWO-COLUMN: WHAT'S INCLUDED | HOW IT WORKS ── */}
      <section style={{ backgroundColor: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px", alignItems: "start" }}>
          <div>
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
          <div>
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
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "64px 16px" }}>
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto space-y-8">

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

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <h2 style={{ fontFamily: CG, color: NAVY, fontSize: "1.4rem", fontWeight: 700 }}>Share what you know. We&rsquo;ll find what matters.</h2>
            {QUESTIONS.map(({ id, label }) => {
              const key = id as keyof FormData;
              const hasError = !!errors[key];
              return (
                <div key={id} data-error={hasError ? true : undefined}>
                  <label className="block text-sm text-gray-700 mb-1" style={{ fontFamily: MT, fontWeight: 600 }}>{label} <span className="text-red-500">*</span></label>
                  <textarea rows={4} placeholder="Write as much detail as you like…" value={form[key]} onChange={e => set(key, e.target.value)}
                    className={`${inputBase} resize-y ${hasError ? inputErr : inputOk}`} style={{ fontFamily: MT }} />
                  {hasError && <p className="text-red-500 text-xs mt-1" style={{ fontFamily: MT }}>{errors[key]}</p>}
                </div>
              );
            })}
          </div>

          {submitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700 text-sm" style={{ fontFamily: MT }}>
              Please fill in all required fields before proceeding.
            </div>
          )}

          <div className="text-center pb-4">
            <p className="text-gray-500 text-sm mb-4" style={{ fontFamily: MT }}>You will be taken to a secure checkout page to complete your $149 payment.</p>
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
