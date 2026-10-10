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
  { num: "1", title: "Get Started in Seconds", body: "Enter your name, business, and email to get started. We'll send you a link to complete your order details after payment." },
  { num: "2", title: "A Real Analyst Gets to Work", body: "I personally review every submission, combining professional research methodology with AI intelligence to provide something genuinely useful." },
  { num: "3", title: "Your Report Arrives", body: "A professionally written report lands in your inbox within the promised timeframe. Insights you can act on immediately." },
];

type FormData = { customerName: string; businessName: string; email: string; };

const EMPTY: FormData = { customerName: "", businessName: "", email: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "businessName", "email"];

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

  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    REQUIRED.forEach(k => { if (!form[k].trim()) newErrors[k] = "This field is required."; });
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "market-intelligence-report", customerName: form.customerName, businessName: form.businessName, email: form.email }));
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 16px" }}>
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
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "16px 16px 48px" }}>
        <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto space-y-8">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 style={{ fontFamily: CG, color: NAVY, fontSize: "1.4rem", fontWeight: 700, marginBottom: "24px" }}>Get Your Report</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontFamily: MT, fontSize: "0.8rem", fontWeight: 600, color: NAVY, marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Your Name *</label>
                <input value={form.customerName} onChange={e => set("customerName", e.target.value)} placeholder="Jane Smith" className={cls("customerName")} data-error={errors.customerName ? "" : undefined} />
                {errors.customerName && <p style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: "4px" }}>{errors.customerName}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontFamily: MT, fontSize: "0.8rem", fontWeight: 600, color: NAVY, marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Business Name *</label>
                <input value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="Coastal Brew Coffee" className={cls("businessName")} data-error={errors.businessName ? "" : undefined} />
                {errors.businessName && <p style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: "4px" }}>{errors.businessName}</p>}
              </div>
              <div>
                <label style={{ display: "block", fontFamily: MT, fontSize: "0.8rem", fontWeight: 600, color: NAVY, marginBottom: "6px", letterSpacing: "0.04em", textTransform: "uppercase" }}>Email Address *</label>
                <input type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@coastalbrew.com" className={cls("email")} data-error={errors.email ? "" : undefined} />
                {errors.email && <p style={{ color: "#DC2626", fontSize: "0.75rem", marginTop: "4px" }}>{errors.email}</p>}
              </div>
            </div>
          </div>

          {submitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700 text-sm" style={{ fontFamily: MT }}>
              Please fill in all required fields before proceeding.
            </div>
          )}

          <div className="text-center pb-4">
            <p className="text-gray-500 text-sm mb-4" style={{ fontFamily: MT }}>You will be taken to a secure checkout page to complete your $199 payment.</p>
            <button type="submit" style={{ display: "inline-block", backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "14px 40px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
              Proceed to Payment →
            </button>
          </div>
        </form>
      </section>

      <SiteFooter />
    </div>
  );
}
