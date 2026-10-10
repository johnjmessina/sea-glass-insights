"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import SiteNav    from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";

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
  { num: "1", title: "Get Started in Seconds", body: "Enter your name, business, and email to get started. We'll send you a link to complete your order details after payment." },
  { num: "2", title: "A Real Analyst Gets to Work", body: "We research your market, your competitors, and your positioning with greater rigor than the standard report allows. More sources, more time, more context for your specific situation." },
  { num: "3", title: "Your Report Arrives", body: "A deeply researched report with a decision-specific analysis section lands in your inbox within 5-7 days. Comprehensive findings and a prioritized action framework included." },
];

type FormData = { customerName: string; email: string; businessName: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "businessName", "email"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function DeepDiveReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(f: keyof FormData, v: string) { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: undefined })); }

  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    REQUIRED.forEach(k => { if (!form[k].trim()) e[k] = "This field is required."; });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) { document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "deep-dive-report", customerName: form.customerName, businessName: form.businessName, email: form.email }));
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
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "36px", lineHeight: 1.7 }}>Enter your details below. After payment you&rsquo;ll receive a link to complete your order information.</p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Get Your Deep Dive Report</h3>
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

            <div style={{ textAlign: "right" }}>
              <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                Proceed to Payment &mdash; $399
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "12px" }}>Flat fee. No subscriptions. Report delivered within 5-7 days.</p>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
