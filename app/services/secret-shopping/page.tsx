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

  // Local state for competitor reveal inputs
  const [competitorName,    setCompetitorName]    = useState("");
  const [competitorAddress, setCompetitorAddress] = useState("");

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
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Secret Shopping</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>See your business the way a first-time customer does.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$299</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>5-7 day delivery</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto 16px" }}>A professional in-person visit to your business, scored across seven dimensions of the customer experience. Delivered as a complete formatted report with narrative notes and specific recommendations.</p>
        <p style={{ fontFamily: MT, fontSize: "0.78rem", color: "rgba(147,197,253,0.65)", marginBottom: "24px" }}>Available for businesses in the Monmouth County and Jersey Shore area. Travel surcharge may apply for locations outside this area.</p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started &rarr;</a>
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
                  <span style={{ color: TEAL, fontWeight: 700, fontSize: "1rem", flexShrink: 0, marginTop: "1px" }}>&#10003;</span>
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
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Request a Secret Shop</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>Fill out the form below. After submitting you&rsquo;ll be directed to a secure payment page. Your report will be delivered within 5-7 days of the visit.</p>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Contact Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <ServiceFormField label="Your Name" required placeholder="Jane Smith" value={form.customerName} error={errors.customerName} onChange={v => set("customerName", v)} />
                <ServiceFormField label="Email Address" required placeholder="jane@yourbusiness.com" value={form.email} error={errors.email} onChange={v => set("email", v)} />
              </div>
            </div>
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
            {/* BUNDLE CALLOUT */}
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
            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment &mdash; $299</button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. No subscriptions. Report delivered within 5-7 days of the visit.</p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>Please only share what you are comfortable sharing. Your responses are used solely to conduct your secret shop.</p>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
