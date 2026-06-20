"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";
import ServiceFormField from "@/components/ServiceFormField";
import {
  SelectWithOther,
  CheckboxGroupWithOther,
  YesNoReveal,
  BUSINESS_TYPES,
  VOC_COLLECTION_METHODS,
} from "@/components/StructuredFormInputs";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

const CHECKLIST = [
  "Custom Survey Design (up to 10 questions)",
  "Distribution-Optimized Format",
  "Secure Contact List Upload (after payment)",
  "Response Collection and analysis",
  "Thematic Analysis of patterns and findings",
  "Visual Report with findings and themes",
  "Analyst Interpretation and recommendations",
];
const HIW = [
  { num: "1", title: "Tell Us Your Goals", body: "Fill out the short intake form below with your business context and what you most want to learn from your customers." },
  { num: "2", title: "Pay and Upload Your List", body: "After payment, you'll receive a secure upload link. Send us your customer contact list as a CSV, XLS, or XLSX file." },
  { num: "3", title: "We Design and Send the Survey", body: "We design a custom survey based on your goals and distribute it to your customers on your behalf." },
  { num: "4", title: "Your Report Arrives", body: "A visual findings report with themes, highlights, and analyst interpretation lands in your inbox within 1-2 weeks." },
];

const CONTACT_SIZES = ["Under 50", "50–100", "100–250", "250–500", "500–1,000", "1,000+"];

type FormData = { customerName: string; email: string; businessName: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; q7: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "", q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "email", "businessName", "q1", "q2", "q3", "q4", "q5", "q7"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function VoiceOfCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [yesQ6, setYesQ6] = useState<boolean | null>(null);

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
    const q6combined =
      yesQ6 === false
        ? "No"
        : form.q6.trim()
        ? "Yes — " + form.q6.trim()
        : yesQ6 === true
        ? "Yes"
        : "";
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "voice-of-customer", ...form, q6: q6combined }));
    router.push("/checkout");
  }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;


  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 16px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Voice of Customer Survey</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Real feedback from your real customers.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$499</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: GRAY }}>1-2 week delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: GRAY, maxWidth: "580px", margin: "0 auto 20px" }}>We design a custom survey around your business goals, send it to your existing customers, and deliver a visual report with findings, themes, and actionable recommendations. You&rsquo;ll need an existing customer contact list to participate.</p>
        <div style={{ display: "inline-block", border: "1px solid rgba(10,47,97,0.2)", borderRadius: "8px", padding: "10px 18px", backgroundColor: "rgba(10,47,97,0.05)", marginBottom: "24px" }}>
          <p style={{ fontFamily: MT, fontSize: "0.78rem", color: NAVY, margin: 0 }}>After payment, you&rsquo;ll receive a secure link to upload your contact data. Sea Glass Insights does not provide contact lists.</p>
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
              Every section includes an optional <strong style={{ color: NAVY }}>Analyst Perspective</strong> — your analyst&rsquo;s expert interpretation of what your customers are actually telling you and what it means for your business.
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
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your Voice of Customer Report</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>Tell us about your goals below. After payment you&rsquo;ll receive a secure link to upload your customer contact list.</p>
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
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>About Your Business and Customers</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <ServiceFormField label="1. Business name and location" required placeholder="e.g. Anchor Coffee Co., Bradley Beach NJ — specialty coffee shop and roastery."  value={form.q1} error={errors.q1} onChange={v => set("q1", v)} />
                <SelectWithOther
                  label="2. Industry / business type"
                  options={BUSINESS_TYPES}
                  onChange={v => set("q2", v)}
                  error={errors.q2}
                  required
                />
                <SelectWithOther
                  label="3. Approximately how many customer contacts do you have?"
                  hint="An estimate is fine. This helps us understand response rate expectations."
                  options={CONTACT_SIZES}
                  onChange={v => set("q3", v)}
                  error={errors.q3}
                  required
                />
                <CheckboxGroupWithOther
                  label="4. How were these contacts collected?"
                  options={VOC_COLLECTION_METHODS}
                  onChange={v => set("q4", v)}
                  error={errors.q4}
                  required
                />
                <ServiceFormField label="5. What do you most want to learn from your customers?" required hint="Be as specific as possible — this drives the survey question design." placeholder="e.g. Why they choose us over competitors, what would make them come more often, and whether they'd value a monthly coffee subscription." rows={4}  value={form.q5} error={errors.q5} onChange={v => set("q5", v)} />
                <YesNoReveal
                  label="6. Have you surveyed your customers before?"
                  onToggle={yes => {
                    setYesQ6(yes);
                    if (!yes) {
                      set("q6", "No");
                    } else {
                      set("q6", "");
                    }
                  }}
                  error={errors.q6}
                >
                  <textarea
                    rows={3}
                    placeholder="e.g. We ran a short Google Form 2 years ago. Customers loved the atmosphere but mentioned wanting faster service during morning rush."
                    value={form.q6}
                    onChange={e => set("q6", e.target.value)}
                    className={`${inputBase} ${inputOk} resize-y w-full`}
                    style={{ fontFamily: MT }}
                  />
                </YesNoReveal>
                <ServiceFormField label="7. What decision will this research inform?" required placeholder="e.g. Whether to expand our hours, add a subscription model, or open a second location. We want to understand our customers before committing." rows={3}  value={form.q7} error={errors.q7} onChange={v => set("q7", v)} />
              </div>
            </div>
            {/* BUNDLE CALLOUT */}
            <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
              <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Complete Shopper Experience — Bundle and save</p>
              <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Secret Shopping visit and save $99.</p>
              <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY }}>Get both for <strong style={{ color: NAVY }}>$699</strong>. <Link href="/bundles#complete-shopper-experience" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>See bundle →</Link></p>
            </div>
            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment — $499</button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. No subscriptions. After payment you&rsquo;ll receive a secure link to upload your contact list.</p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>Sea Glass Insights does not provide contact lists. You must have an existing list to participate.</p>
            </div>
          </form>
        </div>
      </section>
      <section style={{ backgroundColor: WHITE, padding: "24px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginBottom: "8px" }}>Don&rsquo;t have a contact list yet?</p>
        <Link href="/services/synthetic-survey-report" style={{ fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>See the Synthetic Survey Report instead →</Link>
      </section>
      <SiteFooter />
    </div>
  );
}
