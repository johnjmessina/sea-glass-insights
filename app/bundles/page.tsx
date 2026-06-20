"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav          from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";
import ServiceFormField from "@/components/ServiceFormField";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

// ── Shared helpers ────────────────────────────────────────────────────────────

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk   = "border-gray-300 bg-white";
const inputErr  = "border-red-400 bg-red-50";

function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

// Chevron icon for expand/collapse
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="20" height="20" viewBox="0 0 20 20" fill="none"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}
    >
      <path d="M5 7.5L10 12.5L15 7.5" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


// ── Page component ────────────────────────────────────────────────────────────

export default function BundlesPage() {
  const router = useRouter();
  // Which bundle section is expanded (only one at a time; null = all collapsed)
  const [expanded, setExpanded] = useState<string | null>(null);
  function toggle(id: string) {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next !== null) {
      // Wait for React to finish re-rendering the new layout (collapsing the old
      // section shifts content), then scroll the opened section into view.
      setTimeout(() => {
        const el = document.getElementById(next);
        if (!el) return;
        const headerOffset = 80; // approx. site header + bundle nav height
        const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }, 50);
    }
  }

  // ── Starter Intelligence state ──────────────────────────────────────────────
  const [si, setSi] = useState({ customerName:"",email:"",businessName:"",q1:"",q2:"",q3:"",q4:"",q5:"",q6:"",q7:"",q8:"",q9:"",q10:"",q11:"",q12:"",q13:"" });
  const [siErr, setSiErr] = useState<Record<string,string>>({});
  function setSiField(f: string, v: string) { setSi(p=>({...p,[f]:v})); setSiErr(p=>{const n={...p};delete n[f];return n;}); }
  function siSubmit(e: FormEvent) {
    e.preventDefault();
    const req=["customerName","email","businessName","q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q13"];
    const errs:Record<string,string>={};
    req.forEach(k=>{if(!si[k as keyof typeof si]?.trim()) errs[k]="Required.";});
    if(si.email && !validateEmail(si.email)) errs.email="Please enter a valid email.";
    setSiErr(errs); if(Object.keys(errs).length) { document.querySelector("[data-error]")?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({service:"starter-intelligence",...si}));
    router.push("/checkout");
  }

  // ── The Field Report state ──────────────────────────────────────────────────
  const [fr, setFr] = useState({ customerName:"",email:"",businessName:"",q1:"",q2:"",q3:"",q4:"",q5:"",q6:"",q7:"",q8:"",q9:"",q10:"",q11:"",q12:"",q13:"",q14:"",q15:"",q16:"" });
  const [frErr, setFrErr] = useState<Record<string,string>>({});
  function setFrField(f: string, v: string) { setFr(p=>({...p,[f]:v})); setFrErr(p=>{const n={...p};delete n[f];return n;}); }
  function frSubmit(e: FormEvent) {
    e.preventDefault();
    const req=["customerName","email","businessName","q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12","q13","q16"];
    const errs:Record<string,string>={};
    req.forEach(k=>{if(!fr[k as keyof typeof fr]?.trim()) errs[k]="Required.";});
    if(fr.email && !validateEmail(fr.email)) errs.email="Please enter a valid email.";
    setFrErr(errs); if(Object.keys(errs).length) { document.querySelector("[data-error]")?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({service:"the-field-report",...fr}));
    router.push("/checkout");
  }

  // ── Market & Mind state ─────────────────────────────────────────────────────
  const [mm, setMm] = useState({ customerName:"",email:"",businessName:"",q1:"",q2:"",q3:"",q4:"",q5:"",q6:"",q7:"",q8:"",q9:"",q10:"",q11:"",q12:"",q13:"",q14:"" });
  const [mmErr, setMmErr] = useState<Record<string,string>>({});
  function setMmField(f: string, v: string) { setMm(p=>({...p,[f]:v})); setMmErr(p=>{const n={...p};delete n[f];return n;}); }
  function mmSubmit(e: FormEvent) {
    e.preventDefault();
    const req=["customerName","email","businessName","q1","q2","q3","q4","q5","q6","q7","q8","q9","q10","q11","q12"];
    const errs:Record<string,string>={};
    req.forEach(k=>{if(!mm[k as keyof typeof mm]?.trim()) errs[k]="Required.";});
    if(mm.email && !validateEmail(mm.email)) errs.email="Please enter a valid email.";
    setMmErr(errs); if(Object.keys(errs).length) { document.querySelector("[data-error]")?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({service:"market-and-mind",...mm}));
    router.push("/checkout");
  }

  // ── Complete Shopper Experience state ───────────────────────────────────────
  const [cs, setCs] = useState({ customerName:"",email:"",businessName:"",q1:"",q2:"",q3:"",q4:"",q5:"",q6:"",q7:"",q8:"",q9:"",q10:"",q11:"",q12:"",q13:"" });
  const [csErr, setCsErr] = useState<Record<string,string>>({});
  function setCsField(f: string, v: string) { setCs(p=>({...p,[f]:v})); setCsErr(p=>{const n={...p};delete n[f];return n;}); }
  function csSubmit(e: FormEvent) {
    e.preventDefault();
    const req=["customerName","email","businessName","q1","q2","q3","q4","q5","q8","q9","q10","q11","q13"];
    const errs:Record<string,string>={};
    req.forEach(k=>{if(!cs[k as keyof typeof cs]?.trim()) errs[k]="Required.";});
    if(cs.email && !validateEmail(cs.email)) errs.email="Please enter a valid email.";
    setCsErr(errs); if(Object.keys(errs).length) { document.querySelector("[data-error]")?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({service:"complete-shopper-experience",...cs}));
    router.push("/checkout");
  }

  // ── The Deep Field state ────────────────────────────────────────────────────
  const [df, setDf] = useState({ customerName:"",email:"",businessName:"",q1:"",q2:"",q3:"",q4:"",q5:"",q6:"",q7:"",q8:"",q9:"",q10:"",q11:"",q12:"",q13:"",q14:"",q15:"",q16:"" });
  const [dfErr, setDfErr] = useState<Record<string,string>>({});
  function setDfField(f: string, v: string) { setDf(p=>({...p,[f]:v})); setDfErr(p=>{const n={...p};delete n[f];return n;}); }
  function dfSubmit(e: FormEvent) {
    e.preventDefault();
    const req=["customerName","email","businessName","q1","q2","q3","q4","q5","q6","q7","q8","q9","q11","q12","q13","q16"];
    const errs:Record<string,string>={};
    req.forEach(k=>{if(!df[k as keyof typeof df]?.trim()) errs[k]="Required.";});
    if(df.email && !validateEmail(df.email)) errs.email="Please enter a valid email.";
    setDfErr(errs); if(Object.keys(errs).length) { document.querySelector("[data-error]")?.scrollIntoView({behavior:"smooth",block:"center"}); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({service:"the-deep-field",...df}));
    router.push("/checkout");
  }

  // ── Shared field helpers (using ServiceFormField, no inner components) ──────
  function siField(id: keyof typeof si, label: string, placeholder: string, rows?: number, hint?: string, required=true) {
    return <ServiceFormField label={label} required={required} hint={hint} placeholder={placeholder} rows={rows} value={si[id]} error={siErr[id]} onChange={v=>setSiField(id,v)} />;
  }
  function frField(id: keyof typeof fr, label: string, placeholder: string, rows?: number, hint?: string, required=true) {
    return <ServiceFormField label={label} required={required} hint={hint} placeholder={placeholder} rows={rows} value={fr[id]} error={frErr[id]} onChange={v=>setFrField(id,v)} />;
  }
  function mmField(id: keyof typeof mm, label: string, placeholder: string, rows?: number, hint?: string, required=true) {
    return <ServiceFormField label={label} required={required} hint={hint} placeholder={placeholder} rows={rows} value={mm[id]} error={mmErr[id]} onChange={v=>setMmField(id,v)} />;
  }
  function csField(id: keyof typeof cs, label: string, placeholder: string, rows?: number, hint?: string, required=true) {
    return <ServiceFormField label={label} required={required} hint={hint} placeholder={placeholder} rows={rows} value={cs[id]} error={csErr[id]} onChange={v=>setCsField(id,v)} />;
  }

  function dfField(id: keyof typeof df, label: string, placeholder: string, rows?: number, hint?: string, required=true) {
    return <ServiceFormField label={label} required={required} hint={hint} placeholder={placeholder} rows={rows} value={df[id]} error={dfErr[id]} onChange={v=>setDfField(id,v)} />;
  }

  const card = { backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column" as const, gap: "20px" };

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 18px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo_transparent_FINAL.png"
          alt="Sea Glass Insights"
          style={{ maxWidth: "420px", width: "100%", height: "auto", display: "block", margin: "0 auto 24px" }}
        />
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.4rem, 5vw, 3.6rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 14px" }}>
          See Every Edge.
        </h1>
        <p style={{ fontFamily: MT, fontSize: "clamp(0.92rem, 2vw, 1rem)", color: GRAY, maxWidth: "600px", margin: "0 auto", lineHeight: 1.8 }}>
          Bundled research for a sharper edge.
        </p>
      </section>

      {/* TRUST LINE */}
      <div style={{ backgroundColor: SAND, padding: "14px 24px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>

      {/* BUNDLE NAV */}
      <div style={{ backgroundColor: SAND, padding: "12px 24px", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        {[["#starter-intelligence","Starter Intelligence"],["#the-field-report","The Field Report"],["#market-and-mind","Market & Mind"],["#the-deep-field","The Deep Field"],["#complete-shopper-experience","Complete Shopper Experience"]].map(([href,label])=>(
          <a key={href} href={href} style={{ fontFamily: MT, fontSize: "0.78rem", fontWeight: 500, color: NAVY, textDecoration: "none", padding: "6px 14px", borderRadius: "9999px", border: "1px solid #E5E7EB" }}>{label}</a>
        ))}
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 24px", display: "flex", flexDirection: "column", gap: "40px", width: "100%" }}>

        {/* ── STARTER INTELLIGENCE ─────────────────────────────────────────── */}
        <div id="starter-intelligence" style={{ scrollMarginTop: "120px" }}>
          {/* Collapsed header — always visible */}
          <div style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => toggle('starter-intelligence')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '28px 32px' }}
            aria-expanded={expanded === 'starter-intelligence'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: CG, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700, color: NAVY, marginBottom: '4px' }}>Starter Intelligence</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: MT, fontSize: '1.3rem', fontWeight: 700, color: NAVY }}>$349</span>
                  <span style={{ fontFamily: MT, fontSize: '0.8rem', fontWeight: 600, color: TEAL }}>save $49</span>
                </div>
                <p style={{ fontFamily: MT, fontSize: '0.78rem', color: GRAY, marginBottom: '10px' }}>Market Intelligence Report + Social Media Audit</p>
                <p style={{ fontFamily: MT, fontSize: '0.9rem', color: GRAY, lineHeight: 1.75 }}>Understand your market and see exactly how your social presence stacks up against it. The essential starting point for any small business ready to compete.</p>
              </div>
              <Chevron open={expanded === 'starter-intelligence'} />
            </div>
          </button>
          {/* Expanded content */}
          {expanded === 'starter-intelligence' && (
          <div style={{ padding: '0 32px 32px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: "flex", gap: "12px", margin: "24px 0", flexWrap: "wrap" }}>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Market Intelligence Report</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$199</span>
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Social Media Audit</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$199</span>
            </div>
          </div>
          <div id="si-form" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={siSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Your Contact Information</h3>
                {siField("customerName","Your Name","Jane Smith")}
                {siField("email","Email Address","jane@yourbusiness.com")}
                {siField("businessName","Business Name","Acme Coffee Co.")}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Market Intelligence Questions</h3>
                {siField("q1","1. What is your business name and what do you sell or offer?","e.g. Anchor Coffee Co. — specialty coffee shop and roastery in Bradley Beach, NJ.",3)}
                {siField("q2","2. How long have you been in business, and where are you located?","e.g. 4 years, Bradley Beach NJ.")}
                {siField("q3","3. Who is your ideal customer?","e.g. 28-45, dual income households, value quality over price.",3,"Age, income, lifestyle, and the problem they have.")}
                {siField("q4","4. Who are your top 2–3 competitors?","e.g. Starbucks on Main St, The Grind, the bagel shop that also sells coffee.",3,"Names, or describe them if you don't know exact names.")}
                {siField("q5","5. What makes you different from those competitors?","e.g. We roast in-house, our staff knows the product deeply.",3)}
                {siField("q6","6. What is the biggest challenge you are facing right now?","e.g. A new shop opened nearby and is pulling our afternoon regulars.",3)}
                {siField("q7","7. What does success look like for you in the next 12 months?","e.g. Stabilize our customer base, grow revenue by 20%.",3)}
                {siField("q8","8. What marketing are you currently doing, if any?","e.g. Instagram 3x per week, no paid ads, email list of ~400.",3)}
                {siField("q9","9. What do you wish you knew about your market or customers?","e.g. Why our lunch traffic is weaker than morning traffic.",3)}
                {siField("q10","10. Is there anything else you want the report to focus on?","e.g. We're thinking about a second location.",3,undefined,false)}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Social Media Audit Questions</h3>
                {siField("q11","11. What social platforms are you active on?","e.g. Instagram @anchorcoffeeco, Facebook: facebook.com/anchorcoffeeco, TikTok: @anchorcoffee",3,"Include all handles you want audited.")}
                {siField("q12","12. Top 1-2 competitor social handles if known?","e.g. @thegrindnj, @belmar_bagels",undefined,undefined,false)}
                {siField("q13","13. What is your biggest social media challenge right now?","e.g. We post regularly but get almost no engagement. We don't know what content resonates.",4)}
              </div>
              <div style={{ textAlign: "center" }}>
                <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $349
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Both deliverables included. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
               style={{ fontFamily: MT, fontSize: '0.78rem', color: LGRAY, textDecoration: 'none', cursor: 'pointer' }}>
              ↑ Back to top
            </a>
          </div>
          </div>
          )}
          </div>
        </div>

        {/* ── THE FIELD REPORT ──────────────────────────────────────────────── */}
        <div id="the-field-report" style={{ scrollMarginTop: "120px" }}>
          {/* Collapsed header — always visible */}
          <div style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => toggle('the-field-report')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '28px 32px' }}
            aria-expanded={expanded === 'the-field-report'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: CG, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700, color: NAVY, marginBottom: '4px' }}>The Field Report</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: MT, fontSize: '1.3rem', fontWeight: 700, color: NAVY }}>$449</span>
                  <span style={{ fontFamily: MT, fontSize: '0.8rem', fontWeight: 600, color: TEAL }}>save $49</span>
                </div>
                <p style={{ fontFamily: MT, fontSize: '0.78rem', color: GRAY, marginBottom: '10px' }}>Market Intelligence Report + Secret Shopping</p>
                <p style={{ fontFamily: MT, fontSize: '0.9rem', color: GRAY, lineHeight: 1.75 }}>Know your market from the outside and your customer experience from the inside. Market intelligence meets boots-on-the-ground research.</p>
              </div>
              <Chevron open={expanded === 'the-field-report'} />
            </div>
          </button>
          {/* Expanded content */}
          {expanded === 'the-field-report' && (
          <div style={{ padding: '0 32px 32px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: "flex", gap: "12px", margin: "24px 0", flexWrap: "wrap" }}>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Market Intelligence Report</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$199</span>
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Secret Shopping</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$299</span>
            </div>
          </div>
          <div id="fr-form" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={frSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Your Contact Information</h3>
                {frField("customerName","Your Name","Jane Smith")}
                {frField("email","Email Address","jane@yourbusiness.com")}
                {frField("businessName","Business Name","Acme Coffee Co.")}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Market Intelligence Questions</h3>
                {frField("q1","1. What is your business name and what do you sell or offer?","e.g. Anchor Coffee Co. — specialty coffee shop and roastery.",3)}
                {frField("q2","2. How long have you been in business, and where are you located?","e.g. 4 years, Bradley Beach NJ.")}
                {frField("q3","3. Who is your ideal customer?","e.g. 28-45, dual income households, value quality over price.",3,"Age, income, lifestyle, and the problem they have.")}
                {frField("q4","4. Who are your top 2–3 competitors?","e.g. Starbucks on Main St, The Grind.",3,"Names, or describe them if you don't know exact names.")}
                {frField("q5","5. What makes you different from those competitors?","e.g. We roast in-house, our staff knows the product deeply.",3)}
                {frField("q6","6. What is the biggest challenge you are facing right now?","e.g. A new shop nearby is pulling our afternoon regulars.",3)}
                {frField("q7","7. What does success look like for you in the next 12 months?","e.g. Stabilize our customer base, grow revenue by 20%.",3)}
                {frField("q8","8. What marketing are you currently doing, if any?","e.g. Instagram 3x per week, no paid ads.",3)}
                {frField("q9","9. What do you wish you knew about your market or customers?","e.g. Why our lunch traffic is weaker than morning traffic.",3)}
                {frField("q10","10. Is there anything else you want the report to focus on?","e.g. We're thinking about a second location.",3,undefined,false)}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Secret Shopping Questions</h3>
                {frField("q11","11. What is your business address?","e.g. 123 Main St, Bradley Beach, NJ 07720")}
                {frField("q12","12. What are your hours of operation?","e.g. Mon-Fri 7am-6pm, Sat-Sun 8am-4pm")}
                {frField("q13","13. What does a typical customer interaction look like?","e.g. Customer walks in, browses, orders at the counter, waits for their drink.",4,"Walk us through what happens from arrival to departure.")}
                {frField("q14","14. Are there specific experience dimensions you want evaluated?","e.g. Greeting, wait time, product knowledge, cleanliness.",3,"e.g. greeting, wait time, product knowledge, cleanliness",false)}
                {frField("q15","15. Would you like a competitor location shopped as well?","e.g. Yes — The Grind, 456 Ocean Ave, Belmar NJ",undefined,"An additional fee applies. We'll follow up to confirm details and pricing.",false)}
                {frField("q16","16. Anything specific you're concerned about or want us to focus on?","e.g. We've had Google reviews mentioning slow service during lunch.",4)}
              </div>
              <div style={{ textAlign: "center" }}>
                <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $449
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Available in the Monmouth County and Jersey Shore area. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
               style={{ fontFamily: MT, fontSize: '0.78rem', color: LGRAY, textDecoration: 'none', cursor: 'pointer' }}>
              ↑ Back to top
            </a>
          </div>
          </div>
          )}
          </div>
        </div>

        {/* ── MARKET & MIND ────────────────────────────────────────────────── */}
        <div id="market-and-mind" style={{ scrollMarginTop: "120px" }}>
          {/* Collapsed header — always visible */}
          <div style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => toggle('market-and-mind')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '28px 32px' }}
            aria-expanded={expanded === 'market-and-mind'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: CG, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700, color: NAVY, marginBottom: '4px' }}>Market & Mind</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: MT, fontSize: '1.3rem', fontWeight: 700, color: NAVY }}>$499</span>
                  <span style={{ fontFamily: MT, fontSize: '0.8rem', fontWeight: 600, color: TEAL }}>save $99</span>
                </div>
                <p style={{ fontFamily: MT, fontSize: '0.78rem', color: GRAY, marginBottom: '10px' }}>Market Intelligence Report + Synthetic Survey Report</p>
                <p style={{ fontFamily: MT, fontSize: '0.9rem', color: GRAY, lineHeight: 1.75 }}>Understand your market and your customer without needing an existing contact list. Two research streams working together to give you the full picture.</p>
              </div>
              <Chevron open={expanded === 'market-and-mind'} />
            </div>
          </button>
          {/* Expanded content */}
          {expanded === 'market-and-mind' && (
          <div style={{ padding: '0 32px 32px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: "flex", gap: "12px", margin: "24px 0", flexWrap: "wrap" }}>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Market Intelligence Report</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$199</span>
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Synthetic Survey Report</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$399</span>
            </div>
          </div>
          <div id="mm-form" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={mmSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Your Contact Information</h3>
                {mmField("customerName","Your Name","Jane Smith")}
                {mmField("email","Email Address","jane@yourbusiness.com")}
                {mmField("businessName","Business Name","Acme Coffee Co.")}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Market Intelligence Questions</h3>
                {mmField("q1","1. What is your business name and what do you sell or offer?","e.g. Anchor Coffee Co. — specialty coffee shop and roastery.",3)}
                {mmField("q2","2. How long have you been in business, and where are you located?","e.g. 4 years, Bradley Beach NJ.")}
                {mmField("q3","3. Who is your ideal customer?","e.g. 28-45, value quality and local authenticity.",3,"Age, income, lifestyle, and the problem they have.")}
                {mmField("q4","4. Who are your top 2–3 competitors?","e.g. Starbucks on Main St, The Grind.",3,"Names, or describe them if you don't know exact names.")}
                {mmField("q5","5. What makes you different from those competitors?","e.g. We roast in-house, our staff knows the product deeply.",3)}
                {mmField("q6","6. What is the biggest challenge you are facing right now?","e.g. A new shop nearby is pulling our afternoon regulars.",3)}
                {mmField("q7","7. What does success look like for you in the next 12 months?","e.g. Stabilize our customer base, grow revenue by 20%.",3)}
                {mmField("q8","8. What marketing are you currently doing, if any?","e.g. Instagram 3x per week, no paid ads.",3)}
                {mmField("q9","9. What do you wish you knew about your market or customers?","e.g. Why our lunch traffic is weaker than morning traffic.",3)}
                {mmField("q10","10. Is there anything else you want the report to focus on?","e.g. We're thinking about a second location.",3,undefined,false)}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Synthetic Survey Questions</h3>
                <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY }}>Questions 11 and 12 are the most important — the more specific, the sharper the persona responses.</p>
                {mmField("q11","11. What assumptions about your customers do you want to test?","e.g. We assume customers primarily value atmosphere over price. We assume retail bag buyers are different from cafe customers.",4,"What do you believe to be true that you haven't confirmed?")}
                {mmField("q12","12. What are the 3-5 most important questions you want answered?","e.g. Would customers pay $18 for a retail single-origin bag? What would make them choose us over the new shop?",4,"Be as specific as possible — these drive the persona research.")}
                {mmField("q13","13. What does your current pricing look like and how do customers typically find you?","e.g. Drip $3.50, espresso $5-7, retail bags $14-16. Most find us via word of mouth or walking by.",3)}
                {mmField("q14","14. Is there a specific product, service, or decision you want customer reactions to?","e.g. We're considering a monthly coffee subscription at $35/month.",3,undefined,false)}
              </div>
              <div style={{ textAlign: "center" }}>
                <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $499
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Synthetic Survey results presented as directional insight, not statistically validated data. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
               style={{ fontFamily: MT, fontSize: '0.78rem', color: LGRAY, textDecoration: 'none', cursor: 'pointer' }}>
              ↑ Back to top
            </a>
          </div>
          </div>
          )}
          </div>
        </div>

        {/* ── THE DEEP FIELD ───────────────────────────────────────────────── */}
        <div id="the-deep-field" style={{ scrollMarginTop: "120px" }}>
          <div style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => toggle('the-deep-field')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '28px 32px' }}
            aria-expanded={expanded === 'the-deep-field'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: CG, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700, color: NAVY, marginBottom: '4px' }}>The Deep Field</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: MT, fontSize: '1.3rem', fontWeight: 700, color: NAVY }}>$599</span>
                  <span style={{ fontFamily: MT, fontSize: '0.8rem', fontWeight: 600, color: TEAL }}>save $99</span>
                </div>
                <p style={{ fontFamily: MT, fontSize: '0.78rem', color: GRAY, marginBottom: '10px' }}>Deep Dive Report + Secret Shopping</p>
                <p style={{ fontFamily: MT, fontSize: '0.9rem', color: GRAY, lineHeight: 1.75 }}>Know your competitive landscape in depth and your customer experience from the inside. The most complete picture of your market position available.</p>
              </div>
              <Chevron open={expanded === 'the-deep-field'} />
            </div>
          </button>
          {expanded === 'the-deep-field' && (
          <div style={{ padding: '0 32px 32px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: "flex", gap: "12px", margin: "24px 0", flexWrap: "wrap" }}>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Deep Dive Report</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$399</span>
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Secret Shopping</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$299</span>
            </div>
          </div>
          <div id="df-form" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={dfSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Your Contact Information</h3>
                {dfField("customerName","Your Name","Jane Smith")}
                {dfField("email","Email Address","jane@yourbusiness.com")}
                {dfField("businessName","Business Name","Acme Coffee Co.")}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Deep Dive Report Questions</h3>
                {dfField("q1","1. What is your business name and what do you sell or offer?","e.g. Anchor Coffee Co. — specialty coffee shop and roastery.",3)}
                {dfField("q2","2. How long have you been in business, and where are you located?","e.g. 4 years, Bradley Beach NJ.")}
                {dfField("q3","3. Who is your ideal customer?","e.g. 28-45, dual income households, value quality over price.",3,"Age, income, lifestyle, and the problem they have.")}
                {dfField("q4","4. Who are your top 2–3 competitors?","e.g. Starbucks on Main St, The Grind.",3,"Names, or describe them if you don't know exact names.")}
                {dfField("q5","5. What makes you different from those competitors?","e.g. We roast in-house, our staff knows the product deeply.",3)}
                {dfField("q6","6. What is the biggest challenge you are facing right now?","e.g. A new shop nearby is pulling our afternoon regulars.",3)}
                {dfField("q7","7. What does success look like for you in the next 12 months?","e.g. Stabilize our customer base, grow revenue by 20%.",3)}
                {dfField("q8","8. What marketing are you currently doing, if any?","e.g. Instagram 3x per week, no paid ads.",3)}
                {dfField("q9","9. What do you wish you knew about your market or customers?","e.g. Why our lunch traffic is weaker than morning traffic.",3)}
                {dfField("q10","10. Is there anything else you want the report to focus on?","e.g. We're considering a second location or new product line.",3,undefined,false)}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Secret Shopping Questions</h3>
                {dfField("q11","11. What is your business address?","e.g. 123 Main St, Bradley Beach, NJ 07720")}
                {dfField("q12","12. What are your hours of operation?","e.g. Mon-Fri 7am-6pm, Sat-Sun 8am-4pm")}
                {dfField("q13","13. What does a typical customer interaction look like?","e.g. Customer walks in, browses, orders at the counter, waits for their drink.",4,"Walk us through what happens from arrival to departure.")}
                {dfField("q14","14. Are there specific experience dimensions you want evaluated?","e.g. Greeting, wait time, product knowledge, cleanliness.",3,"e.g. greeting, wait time, product knowledge, cleanliness",false)}
                {dfField("q15","15. Would you like a competitor location shopped as well?","e.g. Yes — The Grind, 456 Ocean Ave, Belmar NJ",undefined,"An additional fee applies. We'll follow up to confirm details and pricing.",false)}
                {dfField("q16","16. Anything specific you're concerned about or want us to focus on?","e.g. We've had Google reviews mentioning slow service during lunch.",4)}
              </div>
              <div style={{ textAlign: "center" }}>
                <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $599
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Secret Shopping available in Monmouth County and Jersey Shore area. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
               style={{ fontFamily: MT, fontSize: '0.78rem', color: LGRAY, textDecoration: 'none', cursor: 'pointer' }}>
              ↑ Back to top
            </a>
          </div>
          </div>
          )}
          </div>
        </div>

        {/* ── COMPLETE SHOPPER EXPERIENCE ───────────────────────────────────── */}
        <div id="complete-shopper-experience" style={{ scrollMarginTop: "120px" }}>
          {/* Collapsed header — always visible */}
          <div style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: '16px', overflow: 'hidden' }}>
          <button
            onClick={() => toggle('complete-shopper-experience')}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '28px 32px' }}
            aria-expanded={expanded === 'complete-shopper-experience'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
              <div>
                <h2 style={{ fontFamily: CG, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 700, color: NAVY, marginBottom: '4px' }}>Complete Shopper Experience</h2>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                  <span style={{ fontFamily: MT, fontSize: '1.3rem', fontWeight: 700, color: NAVY }}>$699</span>
                  <span style={{ fontFamily: MT, fontSize: '0.8rem', fontWeight: 600, color: TEAL }}>save $99</span>
                </div>
                <p style={{ fontFamily: MT, fontSize: '0.78rem', color: GRAY, marginBottom: '10px' }}>Secret Shopping + Voice of Customer Survey</p>
                <p style={{ fontFamily: MT, fontSize: '0.9rem', color: GRAY, lineHeight: 1.75 }}>See what your customers experience walking through your door, then hear what they actually think. The most complete view of your customer experience available.</p>
              </div>
              <Chevron open={expanded === 'complete-shopper-experience'} />
            </div>
          </button>
          {/* Expanded content */}
          {expanded === 'complete-shopper-experience' && (
          <div style={{ padding: '0 32px 32px', borderTop: '1px solid #E5E7EB' }}>
          <div style={{ display: "flex", gap: "12px", margin: "24px 0", flexWrap: "wrap" }}>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Secret Shopping</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$299</span>
            </div>
            <div style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
              <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>Voice of Customer Survey</span>
              <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>$499</span>
            </div>
          </div>
          <div id="cs-form" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <form onSubmit={csSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Your Contact Information</h3>
                {csField("customerName","Your Name","Jane Smith")}
                {csField("email","Email Address","jane@yourbusiness.com")}
                {csField("businessName","Business Name","Acme Coffee Co.")}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Secret Shopping Questions</h3>
                {csField("q1","1. What is your business name and what do you sell or offer?","e.g. Anchor Coffee Co. — specialty coffee shop.",2)}
                {csField("q2","2. How long have you been in business, and where are you located?","e.g. 4 years, Bradley Beach NJ.")}
                {csField("q3","3. What is your business address?","e.g. 123 Main St, Bradley Beach, NJ 07720")}
                {csField("q4","4. What are your hours of operation?","e.g. Mon-Fri 7am-6pm, Sat-Sun 8am-4pm")}
                {csField("q5","5. What does a typical customer interaction look like?","e.g. Customer walks in, browses, orders at counter, waits for drink.",4,"Walk us through what happens from arrival to departure.")}
                {csField("q6","6. Are there specific experience dimensions you want evaluated?","e.g. Greeting warmth, wait time, product knowledge, cleanliness.",3,"e.g. greeting, wait time, product knowledge, cleanliness",false)}
                {csField("q7","7. Would you like a competitor location shopped as well?","e.g. Yes — The Grind, 456 Ocean Ave, Belmar NJ",undefined,"An additional fee applies. We'll follow up to confirm details and pricing.",false)}
                {csField("q8","8. Anything specific you're concerned about or want us to focus on?","e.g. We've had Google reviews mentioning slow service during lunch.",4)}
              </div>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Voice of Customer Survey Questions</h3>
                <div style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D", borderRadius: "10px", padding: "12px 16px" }}>
                  <p style={{ fontFamily: MT, fontSize: "0.8rem", color: "#92400E" }}>After payment, you&rsquo;ll receive a secure link to upload your customer contact list (CSV, XLS, or XLSX). Sea Glass Insights does not provide contact lists.</p>
                </div>
                {csField("q9","9. Approximately how many customer contacts do you have?","e.g. Around 400 email addresses from our loyalty program.",undefined,"An estimate is fine.")}
                {csField("q10","10. How were these contacts collected?","e.g. Square loyalty program, email signup on our website.",2,"Past purchases, signups, loyalty program, etc.")}
                {csField("q11","11. What do you most want to learn from your customers?","e.g. Why they choose us, what would make them come more often, whether they'd value a subscription.",4,"Be as specific as possible — this drives the survey design.")}
                {csField("q12","12. Have you surveyed your customers before? If so, what did you find?","e.g. Short Google Form 2 years ago. ~30 responses — customers loved the atmosphere but wanted faster service.",3,undefined,false)}
                {csField("q13","13. What decision will this research inform?","e.g. Whether to expand our hours, add a subscription, or open a second location.",3)}
              </div>
              <div style={{ textAlign: "center" }}>
                <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $699
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Secret Shopping available in Monmouth County and Jersey Shore area. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '12px' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
               style={{ fontFamily: MT, fontSize: '0.78rem', color: LGRAY, textDecoration: 'none', cursor: 'pointer' }}>
              ↑ Back to top
            </a>
          </div>
          </div>
          )}
          </div>
        </div>

      </div>

      <SiteFooter />
    </div>
  );
}
