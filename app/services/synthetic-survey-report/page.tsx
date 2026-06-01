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
  "Custom Research Questions",
  "AI-Generated Customer Personas (3-5 types)",
  "Persona Response Simulation",
  "Thematic Analysis of patterns and contradictions",
  "Directional Recommendations",
  "Full Methodology Disclosure",
  "Honest Limitations Statement",
];
const HIW = [
  { num: "1", title: "Tell Us What You Want to Know", body: "Fill out the form below with your business context, your assumptions, and the specific questions you want answered. The clearer you are about what you're testing, the more targeted the personas will be." },
  { num: "2", title: "Personas Are Built and Surveyed", body: "I design 3-5 customer personas based on your context and run your research questions through them — capturing reactions, objections, and preferences across each customer type." },
  { num: "3", title: "Your Report Arrives", body: "A thematic analysis report with findings, directional recommendations, and full methodology disclosure lands in your inbox within 48-72 hours." },
];

type FormData = { customerName: string; email: string; businessName: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; q8: string; q9: string; q10: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "", q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "", q8: "", q9: "", q10: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "email", "businessName", "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function SyntheticSurveyReportPage() {
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "synthetic-survey-report", ...form })); router.push("/checkout");
  }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;


  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Synthetic Survey Report</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Customer insight when you don&rsquo;t have a customer list.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$399</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>48-72 hour delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "560px", margin: "0 auto 20px" }}>We use AI-generated customer personas to pressure-test your assumptions and surface directional insight — with full transparency about the methodology. No existing customer list required.</p>
        <div style={{ display: "inline-block", border: "1px solid rgba(147,197,253,0.35)", borderRadius: "8px", padding: "10px 18px", backgroundColor: "rgba(255,255,255,0.05)", marginBottom: "24px" }}>
          <p style={{ fontFamily: MT, fontSize: "0.78rem", color: "#93C5FD", margin: 0 }}>Results are presented as directional insight, not statistically validated data. Full methodology disclosure is included in every deliverable.</p>
        </div>
        <br />
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
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your Synthetic Survey Report</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>The more specific your answers, the more targeted the personas and the more useful the findings. After submitting you&rsquo;ll be directed to a secure payment page.</p>
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
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>Your Business and Research Goals</h3>
              <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>Questions 5 and 6 are the most important. The more precise your assumptions and research questions, the sharper the persona responses will be.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <ServiceFormField label="1. What is your business name and what do you sell or offer?" required placeholder="e.g. Anchor Coffee Co. We run a specialty coffee shop and retail roastery in Bradley Beach, NJ." rows={3}  value={form.q1} error={errors.q1} onChange={v => set("q1", v)} />
                <ServiceFormField label="2. How long have you been in business, and where are you located?" required placeholder="e.g. 2 years, launching a second location in Asbury Park this spring."  value={form.q2} error={errors.q2} onChange={v => set("q2", v)} />
                <ServiceFormField label="3. Who is your ideal customer?" required hint="Age, income, lifestyle, and what they need from a business like yours." placeholder="e.g. 28-45, value quality and local authenticity, willing to pay a premium, want a community-feel coffee shop rather than a chain." rows={3}  value={form.q3} error={errors.q3} onChange={v => set("q3", v)} />
                <ServiceFormField label="4. Who are your top 2–3 competitors?" required hint="Names, or describe them if you don't know exact names." placeholder="e.g. Starbucks on Main St, a newer indie shop called The Grind, and the bagel shop that also sells coffee." rows={2}  value={form.q4} error={errors.q4} onChange={v => set("q4", v)} />
                <ServiceFormField label="5. What assumptions about your customers do you want to test?" required hint="What do you believe to be true about your customers that you haven't confirmed?" placeholder="e.g. We assume our customers primarily value atmosphere over price. We assume people who buy our retail beans are different from our cafe customers." rows={4}  value={form.q5} error={errors.q5} onChange={v => set("q5", v)} />
                <ServiceFormField label="6. What are the 3-5 most important questions you want answered about your customers?" required hint="Be as specific as possible — these drive the persona research questions." placeholder="e.g. Would our customers pay $18 for a retail bag of single-origin coffee? What would make them choose us over the new shop that just opened?" rows={4}  value={form.q6} error={errors.q6} onChange={v => set("q6", v)} />
                <ServiceFormField label="7. What does your current pricing look like and how do customers typically find you?" required placeholder="e.g. Drip coffee $3.50, espresso drinks $5-7, retail bags $14-16. Most customers find us via word of mouth or walking by." rows={3}  value={form.q7} error={errors.q7} onChange={v => set("q7", v)} />
                <ServiceFormField label="8. What marketing are you currently doing, if any?" required placeholder="e.g. Instagram 3x per week, no paid ads, occasional email to a list of about 400. Google Business profile is active." rows={3}  value={form.q8} error={errors.q8} onChange={v => set("q8", v)} />
                <ServiceFormField label="9. Is there a specific product, service, or decision you want customer reactions to?" placeholder="e.g. We're considering launching a monthly coffee subscription at $35/month and want to know if our core customer type would value it." rows={3}  value={form.q9} error={errors.q9} onChange={v => set("q9", v)} />
                <ServiceFormField label="10. Is there anything else you want the personas to focus on or address?" placeholder="e.g. We'd like the personas to react to our brand name and logo description if possible." rows={3}  value={form.q10} error={errors.q10} onChange={v => set("q10", v)} />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment — $399</button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Report delivered within 48-72 hours.</p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>Please only share what you are comfortable sharing. Your responses are used solely to produce your report. Results will be clearly labeled as directional insight from AI-generated personas.</p>
            </div>
          </form>
        </div>
      </section>
      <section style={{ backgroundColor: WHITE, padding: "32px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginBottom: "8px" }}>Want feedback from your actual customers instead?</p>
        <Link href="/services/voice-of-customer" style={{ fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>See the Voice of Customer Survey →</Link>
      </section>
      <SiteFooter />
    </div>
  );
}
