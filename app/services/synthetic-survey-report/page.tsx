"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

const CHECKLIST = [
  "Custom Research Questions",
  "AI-Generated Customer Personas (3-5 types)",
  "Persona Response Simulation",
  "Thematic Analysis of patterns and contradictions",
  "Directional Recommendations",
  "Full Methodology Disclosure",
  "Honest Limitations Statement",
];
const HIW = [
  { num: "1", title: "Get Started in Seconds", body: "Enter your name, business, and email to get started. We'll send you a link to complete your order details after payment." },
  { num: "2", title: "Personas Are Built and Surveyed", body: "We design 3-5 customer personas based on your context and run your research questions through them — capturing reactions, objections, and preferences across each customer type." },
  { num: "3", title: "Your Report Arrives", body: "Your report brings your customer personas to life. Behavioral patterns, preferences, and recommendations you can act on. Delivered in 48-72 hours." },
];

type FormData = { customerName: string; email: string; businessName: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "businessName", "email"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white";

export default function SyntheticSurveyReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(f: keyof FormData, v: string) { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: undefined })); }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? "border-red-400 bg-red-50" : inputOk}`;
  function validate() {
    const e: Partial<Record<keyof FormData, string>> = {};
    REQUIRED.forEach(k => { if (!form[k].trim()) e[k] = "This field is required."; });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
    setErrors(e); return Object.keys(e).length === 0;
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSubmitted(true);
    if (!validate()) { document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "synthetic-survey-report", customerName: form.customerName, businessName: form.businessName, email: form.email }));
    router.push("/checkout");
  }

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 16px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Synthetic Customer Profiles</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Customer insight when you don&rsquo;t have a customer list.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$399</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: GRAY }}>48-72 hour delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: GRAY, maxWidth: "560px", margin: "0 auto 20px" }}>We use AI-generated customer personas to pressure-test your assumptions and surface directional insight. No existing customer list required.</p>
        <div style={{ display: "inline-block", border: "1px solid rgba(10,47,97,0.2)", borderRadius: "8px", padding: "10px 18px", backgroundColor: "rgba(10,47,97,0.05)", marginBottom: "24px" }}>
          <p style={{ fontFamily: MT, fontSize: "0.78rem", color: NAVY, margin: 0 }}>Results are presented as directional insight, not statistically validated data. Full methodology disclosure is included in every deliverable.</p>
        </div>
        <br />
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: "transparent", color: NAVY, border: "1.5px solid #0A2F61", fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started →</a>
      </section>
      <div style={{ backgroundColor: SAND, padding: "6px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>
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
            <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, lineHeight: 1.7, marginTop: "20px", borderTop: "1px solid #E5E7EB", paddingTop: "16px" }}>
              Every section includes an optional <strong style={{ color: NAVY }}>Analyst Perspective</strong> — your analyst&rsquo;s expert take on what the AI findings mean specifically for your business and your customers.
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
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "16px 24px 48px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your Synthetic Customer Profiles</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>The more specific your answers, the more targeted the personas and the more useful the findings. After submitting you&rsquo;ll be directed to a secure payment page.</p>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Get Your Synthetic Customer Profiles</h3>
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
            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment — $399</button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Report delivered within 48-72 hours.</p>
            </div>
          </form>
        </div>
      </section>
      <section style={{ backgroundColor: WHITE, padding: "24px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginBottom: "8px" }}>Want feedback from your actual customers instead?</p>
        <Link href="/services/voice-of-customer" style={{ fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>See the Voice of Customer Survey →</Link>
      </section>
      <SiteFooter />
    </div>
  );
}
