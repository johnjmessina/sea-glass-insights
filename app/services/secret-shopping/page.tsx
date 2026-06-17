"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav          from "@/components/SiteNav";
import SiteFooter        from "@/components/SiteFooter";
import ServiceFormField  from "@/components/ServiceFormField";
import {
  AddressFields,
  CheckboxGroupWithOther,
  YesNoReveal,
  SS_INTERACTION_TYPES,
  SS_SCORECARD_DIMS,
} from "@/components/StructuredFormInputs";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

const CHECKLIST = [
  "In-person visit by a trained researcher",
  "Scored assessment across 7 dimensions",
  "Section-by-section narrative notes",
  "Analyst Observations",
  "Formatted deliverable report",
];
const HIW = [
  { num: "1", title: "Tell Us About Your Business", body: "Fill out the short form below with your business details, hours, and anything specific you want evaluated. The more context you give, the sharper the visit will be." },
  { num: "2", title: "A Trained Researcher Visits", body: "A real researcher visits your location as a genuine first-time customer, experiencing your business exactly as your customers do. No announcements, no pre-visit contact." },
  { num: "3", title: "Your Report Arrives", body: "A complete scored report with narrative notes across all seven dimensions lands in your inbox within 5-7 days. Specific observations and actionable recommendations included." },
];

type FormData = { customerName: string; email: string; businessName: string; businessAddress: string; industry: string; hours: string; typicalInteraction: string; dimensions: string; competitorShop: string; focus: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "", businessAddress: "", industry: "", hours: "", typicalInteraction: "", dimensions: "", competitorShop: "", focus: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "email", "businessName", "businessAddress", "industry", "hours", "typicalInteraction", "focus"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function SecretShoppingPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [formStep, setFormStep] = useState<1|2|3>(1);

  // Local state for competitor reveal inputs
  const [competitorName,    setCompetitorName]    = useState("");
  const [competitorAddress, setCompetitorAddress] = useState("");

  function set(f: keyof FormData, v: string) { setForm(p => ({ ...p, [f]: v })); if (errors[f]) setErrors(p => ({ ...p, [f]: undefined })); }
  function validateStep(step: 1|2|3): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    if (step === 1) {
      if (!form.customerName.trim()) e.customerName = "This field is required.";
      if (!form.email.trim()) e.email = "This field is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
    } else if (step === 2) {
      if (!form.businessName.trim()) e.businessName = "This field is required.";
      if (!form.businessAddress.trim()) e.businessAddress = "This field is required.";
      if (!form.industry.trim()) e.industry = "This field is required.";
      if (!form.hours.trim()) e.hours = "This field is required.";
    } else {
      if (!form.typicalInteraction.trim()) e.typicalInteraction = "This field is required.";
      if (!form.focus.trim()) e.focus = "This field is required.";
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "secret-shopping", ...form })); router.push("/checkout");
  }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  // Derive form.competitorShop from Yes/No toggle + name/address fields
  function handleCompetitorToggle(yes: boolean) {
    if (!yes) {
      set("competitorShop", "No");
    } else {
      const name = competitorName.trim();
      const addr = competitorAddress.trim();
      if (name && addr) {
        set("competitorShop", `Yes — ${name}, ${addr}`);
      } else {
        set("competitorShop", "Yes");
      }
    }
  }

  function handleCompetitorName(val: string) {
    setCompetitorName(val);
    // Only update form if Yes is already selected (competitorShop starts with "Yes")
    if (form.competitorShop.startsWith("Yes")) {
      const addr = competitorAddress.trim();
      const name = val.trim();
      if (name && addr) {
        set("competitorShop", `Yes — ${name}, ${addr}`);
      } else {
        set("competitorShop", "Yes");
      }
    }
  }

  function handleCompetitorAddress(val: string) {
    setCompetitorAddress(val);
    // Only update form if Yes is already selected
    if (form.competitorShop.startsWith("Yes")) {
      const name = competitorName.trim();
      const addr = val.trim();
      if (name && addr) {
        set("competitorShop", `Yes — ${name}, ${addr}`);
      } else {
        set("competitorShop", "Yes");
      }
    }
  }

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Secret Shopping</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>See your business the way a first-time customer does.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$299</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: GRAY }}>5-7 day delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: GRAY, maxWidth: "520px", margin: "0 auto 16px" }}>A professional in-person visit to your business, scored across seven dimensions of the customer experience. Delivered as a complete formatted report with narrative notes and specific recommendations.</p>
        <p style={{ fontFamily: MT, fontSize: "0.78rem", color: GRAY, marginBottom: "24px" }}>Available for businesses in the Monmouth County and Jersey Shore area. Travel surcharge may apply for locations outside this area.</p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started &rarr;</a>
      </section>
      <div style={{ backgroundColor: SAND, padding: "6px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>
      <section style={{ backgroundColor: SAND, padding: "56px 24px 16px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "48px", alignItems: "stretch" }}>
          <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(10,47,97,0.08)" }}>
            <h2 style={{ fontFamily: CG, fontSize: "1.5rem", fontWeight: 700, color: NAVY, marginBottom: "24px" }}>What&rsquo;s Included</h2>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
              {CHECKLIST.map(item => (
                <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                  <span style={{ color: TEAL, fontWeight: 700, fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>&#10003;</span>
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
                  <div><h4 style={{ fontFamily: CG, fontSize: "1.05rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{title}</h4><p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, lineHeight: 1.7 }}>{body}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "64px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Request a Secret Shop</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "36px", lineHeight: 1.7 }}>Fill out the form below. After submitting you&rsquo;ll be directed to a secure payment page. Your report will be delivered within 5-7 days of the visit.</p>

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

            {/* ── Step 1: Contact Information (always mounted, hidden when inactive) ── */}
            <div style={{ display: formStep === 1 ? "block" : "none" }}>
              <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Contact Information</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <ServiceFormField label="Your Name" required placeholder="Jane Smith" value={form.customerName} error={errors.customerName} onChange={v => set("customerName", v)} />
                  <ServiceFormField label="Email Address" required placeholder="jane@yourbusiness.com" value={form.email} error={errors.email} onChange={v => set("email", v)} />
                </div>
              </div>
            </div>

            {/* ── Step 2: Business Details (always mounted, hidden when inactive) ── */}
            <div style={{ display: formStep === 2 ? "block" : "none" }}>
              <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Business</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <ServiceFormField label="Business Name" required placeholder="Acme Coffee Co." value={form.businessName} error={errors.businessName} onChange={v => set("businessName", v)} />
                  <AddressFields
                    label="Business Address"
                    required
                    error={errors.businessAddress}
                    onChange={v => set("businessAddress", v)}
                  />
                  <ServiceFormField label="Industry / Business Type" required placeholder="e.g. Coffee Shop, Retail Boutique, Restaurant, Fitness Studio" value={form.industry} error={errors.industry} onChange={v => set("industry", v)} />
                  <ServiceFormField label="Hours of Operation" required placeholder="e.g. Mon-Fri 7am-6pm, Sat-Sun 8am-4pm" value={form.hours} error={errors.hours} onChange={v => set("hours", v)} />
                </div>
              </div>
            </div>

            {/* ── Step 3: Visit Details (always mounted, hidden when inactive) ── */}
            <div style={{ display: formStep === 3 ? "flex" : "none", flexDirection: "column", gap: "20px" }}>
              <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Visit</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  <CheckboxGroupWithOther
                    label="What does a typical customer interaction look like?"
                    hint="Walk us through what happens from the moment a customer arrives to the moment they leave."
                    options={SS_INTERACTION_TYPES}
                    required
                    error={errors.typicalInteraction}
                    onChange={v => set("typicalInteraction", v)}
                  />
                  <CheckboxGroupWithOther
                    label="Specific experience dimensions you want evaluated"
                    options={SS_SCORECARD_DIMS}
                    error={errors.dimensions}
                    onChange={v => set("dimensions", v)}
                  />
                  <YesNoReveal
                    label="Would you like a competitor location shopped as well?"
                    hint="An additional fee applies for competitor shops. If yes, we'll follow up on details and pricing before scheduling."
                    onToggle={handleCompetitorToggle}
                    error={errors.competitorShop}
                  >
                    <input
                      type="text"
                      value={competitorName}
                      onChange={e => handleCompetitorName(e.target.value)}
                      placeholder="Business name"
                      className={`${inputBase} ${inputOk}`}
                      style={{ fontFamily: MT }}
                    />
                    <input
                      type="text"
                      value={competitorAddress}
                      onChange={e => handleCompetitorAddress(e.target.value)}
                      placeholder="Address, City, State"
                      className={`${inputBase} ${inputOk}`}
                      style={{ fontFamily: MT }}
                    />
                  </YesNoReveal>
                  <ServiceFormField label="Anything specific you're concerned about or want us to focus on?" required placeholder="e.g. We've had a few Google reviews mentioning slow service during lunch. We want to know if it's a staffing issue or a process issue." rows={4} value={form.focus} error={errors.focus} onChange={v => set("focus", v)} />
                </div>
              </div>
              {/* BUNDLE CALLOUTS */}
              <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
                <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>The Field Report &mdash; Bundle and save</p>
                <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Market Intelligence Report and save $49.</p>
                <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY }}>Get both for <strong style={{ color: NAVY }}>$449</strong>. <Link href="/bundles#the-field-report" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>See bundle &rarr;</Link></p>
              </div>
              <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
                <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Complete Shopper Experience &mdash; Bundle and save</p>
                <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Voice of Customer Survey and save $99.</p>
                <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY }}>Get both for <strong style={{ color: NAVY }}>$699</strong>. <Link href="/bundles#complete-shopper-experience" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>See bundle &rarr;</Link></p>
              </div>
            </div>

            {/* ── Navigation buttons ── */}
            {formStep === 1 && (
              <div style={{ textAlign: "right" }}>
                <button type="button" onClick={handleContinue} style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Continue &rarr;
                </button>
              </div>
            )}
            {formStep === 2 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button type="button" onClick={handleBack} style={{ fontFamily: MT, fontSize: "0.9rem", fontWeight: 500, color: GRAY, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  &larr; Back
                </button>
                <button type="button" onClick={handleContinue} style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
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
                  <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment &mdash; $299</button>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. No subscriptions. Report delivered within 5-7 days of the visit.</p>
                  <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>Please only share what you are comfortable sharing. Your responses are used solely to conduct your secret shop.</p>
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
