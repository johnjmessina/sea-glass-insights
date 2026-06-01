"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";
import ServiceFormField from "@/components/ServiceFormField";

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
  { num: "2", title: "A Real Analyst Gets to Work", body: "I personally research your market, your competitors, and your positioning with greater rigor than the standard report allows. More sources, more time, more context for your specific situation." },
  { num: "3", title: "Your Report Arrives", body: "A deeply researched report with a decision-specific analysis section lands in your inbox within 5-7 days. Comprehensive findings and a prioritized action framework included." },
];

type FormData = { customerName: string; email: string; businessName: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q10: string; q11: string; q12: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "", q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q10: "", q11: "", q12: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "email", "businessName", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q11"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function DeepDiveReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(f: keyof FormData, v: string) { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: undefined })); }
  function validate() {
    const e: Partial<Record<keyof FormData, string>> = {};
    REQUIRED.forEach(k => { if (!form[k].trim()) e[k] = "This field is required."; });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
    setErrors(e); return Object.keys(e).length === 0;
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSubmitted(true);
    if (!validate()) { document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "deep-dive-report", ...form })); router.push("/checkout");
  }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;


  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Deep Dive Report</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Deeper intelligence for businesses facing a major decision.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$399</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>5-7 day delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "560px", margin: "0 auto 28px" }}>Everything in the Market Intelligence Report, but deeper. The same competitor set examined with greater rigor, more sources, more context, and more analyst time spent on what each finding actually means for your business. Built for businesses facing a major decision or responding to a significant competitive threat.</p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started →</a>
      </section>
      <div style={{ backgroundColor: WHITE, padding: "14px 24px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>
      <section style={{ backgroundColor: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "48px", alignItems: "start" }}>
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
                  <div><h4 style={{ fontFamily: CG, fontSize: "1.05rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{title}</h4><p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, lineHeight: 1.7 }}>{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "64px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your Deep Dive Report</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>The more context you provide, the more targeted the analysis will be. After submitting you&rsquo;ll be directed to a secure payment page.</p>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Contact Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <ServiceFormField label="Your Name" required placeholder="Jane Smith"  value={form.customerName} error={errors.customerName} onChange={v => set("customerName", v)} />
                <ServiceFormField label="Email Address" required placeholder="jane@yourbusiness.com"  value={form.email} error={errors.email} onChange={v => set("email", v)} />
                <ServiceFormField label="Business Name" required placeholder="Acme Coffee Co."  value={form.businessName} error={errors.businessName} onChange={v => set("businessName", v)} />
              </div>
            </div>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>Business Context</h3>
              <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>These questions give us the foundation for the research. More detail here means sharper insights in your report.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <ServiceFormField label="1. What is your business name and what do you sell or offer?" required placeholder="e.g. Anchor Coffee Co. We run a specialty coffee shop and retail roastery in Bradley Beach, NJ." rows={3}  value={form.q1} error={errors.q1} onChange={v => set("q1", v)} />
                <ServiceFormField label="2. How long have you been in business, and where are you located?" required placeholder="e.g. 4 years, Bradley Beach NJ. Seasonal location with year-round operations."  value={form.q2} error={errors.q2} onChange={v => set("q2", v)} />
                <ServiceFormField label="3. Who is your ideal customer?" required hint="Age, income, lifestyle, and what they need from a business like yours." placeholder="e.g. 28-45, dual income households, value quality over price, want a third-place that feels local not corporate." rows={3}  value={form.q3} error={errors.q3} onChange={v => set("q3", v)} />
                <ServiceFormField label="4. Who are your top 2–3 competitors?" required hint="Names, or describe them if you don't know exact names." placeholder="e.g. Starbucks on Main St, a newer indie shop called The Grind that opened last year, and the bagel shop that also sells coffee." rows={3}  value={form.q4} error={errors.q4} onChange={v => set("q4", v)} />
                <ServiceFormField label="5. What makes you different from those competitors?" required placeholder="e.g. We roast in-house, our staff knows the product deeply, and we have a loyalty base that treats us like a community hub." rows={3}  value={form.q5} error={errors.q5} onChange={v => set("q5", v)} />
                <ServiceFormField label="6. What is the biggest challenge you are facing right now?" required placeholder="e.g. The new shop that opened across town is pulling our afternoon regulars and we don't know why." rows={3}  value={form.q6} error={errors.q6} onChange={v => set("q6", v)} />
                <ServiceFormField label="7. What does success look like for you in the next 12 months?" required placeholder="e.g. Stabilize our customer base, grow revenue by 20%, and have a clear strategy for the off-season." rows={3}  value={form.q7} error={errors.q7} onChange={v => set("q7", v)} />
                <ServiceFormField label="8. What marketing are you currently doing, if any?" required placeholder="e.g. Instagram 3x per week, occasional Facebook posts, no paid ads. Email list of about 400 people we rarely use." rows={3}  value={form.q8} error={errors.q8} onChange={v => set("q8", v)} />
                <ServiceFormField label="9. What do you wish you knew about your market or customers that you don't know today?" required placeholder="e.g. Why our lunch traffic is weaker than our morning traffic, and whether there's an untapped customer segment we're missing." rows={3}  value={form.q9} error={errors.q9} onChange={v => set("q9", v)} />
                <ServiceFormField label="10. Is there anything else you want the report to focus on or address?" placeholder="e.g. We're thinking about adding a second location. Anything relevant to that decision would be useful." rows={3}  value={form.q10} error={errors.q10} onChange={v => set("q10", v)} />
              </div>
            </div>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>Deep Dive Specifics</h3>
              <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>These questions are what separate the Deep Dive from a standard report. Take your time here — your answers directly shape the decision-specific section of the analysis.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <ServiceFormField label="11. What specific decision are you trying to make or problem are you trying to solve with this report?" required hint="Be as specific as possible. The more clearly you define the question, the more targeted the analysis." placeholder="e.g. We are deciding whether to sign a lease on a second location in Asbury Park by the end of Q3. I need to understand whether the market can support it and whether our current brand positioning translates to that area." rows={4}  value={form.q11} error={errors.q11} onChange={v => set("q11", v)} />
                <ServiceFormField label="12. Have you done any market research before? If so, what did you learn?" hint="If no prior research, just say so — that's useful context too." placeholder="e.g. We ran a customer survey two years ago. Key finding was that people come for the atmosphere as much as the coffee. We haven't done anything formal since." rows={3}  value={form.q12} error={errors.q12} onChange={v => set("q12", v)} />
              </div>
            </div>
            {/* BUNDLE CALLOUT */}
            <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
              <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Bundle and save</p>
              <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Social Media Audit and save $49.</p>
              <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY }}>Get both for <strong style={{ color: NAVY }}>$549</strong>. <Link href="/contact" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>Contact us to bundle →</Link></p>
            </div>
            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment — $399</button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. No subscriptions. Report delivered within 5-7 days.</p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>Please only share what you are comfortable sharing. Your responses are used solely to produce your report.</p>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
