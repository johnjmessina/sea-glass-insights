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

function BundleHero({ id, name, price, savings, service1, price1, service2, price2, desc, formId }: {
  id: string; name: string; price: string; savings: string;
  service1: string; price1: string; service2: string; price2: string;
  desc: string; formId: string;
}) {
  return (
    <div id={id} style={{ borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: "16px", padding: "36px 40px", marginBottom: "0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "16px" }}>
        <div>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,3vw,2.4rem)", fontWeight: 700, color: NAVY, marginBottom: "6px" }}>{name}</h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
            <span style={{ fontFamily: MT, fontSize: "1.6rem", fontWeight: 700, color: NAVY }}>{price}</span>
            <span style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: TEAL }}>{savings}</span>
          </div>
        </div>
        <a href={`#${formId}`} style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", padding: "11px 28px", borderRadius: "9999px", textDecoration: "none", flexShrink: 0 }}>
          Get Started →
        </a>
      </div>
      <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
        {[[service1, price1], [service2, price2]].map(([svc, p]) => (
          <div key={svc} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>{svc}</span>
            <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>{p}</span>
          </div>
        ))}
      </div>
      <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, lineHeight: 1.75 }}>{desc}</p>
    </div>
  );
}

// ── Page component ────────────────────────────────────────────────────────────

export default function BundlesPage() {
  const router = useRouter();

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

  const card = { backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column" as const, gap: "20px" };

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Sea Glass Insights</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Research bundles built for the full picture.</h1>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto" }}>Pair services and save. Every bundle is analyst-reviewed, flat fee, and delivered on time.</p>
      </section>

      {/* TRUST LINE */}
      <div style={{ backgroundColor: WHITE, padding: "14px 24px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>

      {/* BUNDLE NAV */}
      <div style={{ backgroundColor: WHITE, padding: "12px 24px", borderBottom: "1px solid #F3F4F6", display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap" }}>
        {[["#starter-intelligence","Starter Intelligence"],["#the-field-report","The Field Report"],["#market-and-mind","Market & Mind"],["#complete-shopper-experience","Complete Shopper Experience"]].map(([href,label])=>(
          <a key={href} href={href} style={{ fontFamily: MT, fontSize: "0.78rem", fontWeight: 500, color: NAVY, textDecoration: "none", padding: "6px 14px", borderRadius: "9999px", border: "1px solid #E5E7EB" }}>{label}</a>
        ))}
      </div>

      <div style={{ maxWidth: "860px", margin: "0 auto", padding: "56px 24px", display: "flex", flexDirection: "column", gap: "80px", width: "100%" }}>

        {/* ── STARTER INTELLIGENCE ─────────────────────────────────────────── */}
        <div>
          <BundleHero id="starter-intelligence" name="Starter Intelligence" price="$349" savings="save $49"
            service1="Market Intelligence Report" price1="$199" service2="Social Media Audit" price2="$199"
            desc="Understand your market and see exactly how your social presence stacks up against it. The essential starting point for any small business ready to compete."
            formId="si-form" />
          <div id="si-form" style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $349
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Both deliverables included. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
        </div>

        {/* ── THE FIELD REPORT ──────────────────────────────────────────────── */}
        <div>
          <BundleHero id="the-field-report" name="The Field Report" price="$449" savings="save $49"
            service1="Market Intelligence Report" price1="$199" service2="Secret Shopping" price2="$299"
            desc="Know your market from the outside and your customer experience from the inside. Market intelligence meets boots-on-the-ground research."
            formId="fr-form" />
          <div id="fr-form" style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $449
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Available in the Monmouth County and Jersey Shore area. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
        </div>

        {/* ── MARKET & MIND ────────────────────────────────────────────────── */}
        <div>
          <BundleHero id="market-and-mind" name="Market & Mind" price="$549" savings="save $49"
            service1="Market Intelligence Report" price1="$199" service2="Synthetic Survey Report" price2="$399"
            desc="Understand your market and your customer without needing an existing contact list. Two research streams working together to give you the full picture."
            formId="mm-form" />
          <div id="mm-form" style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $549
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Synthetic Survey results presented as directional insight, not statistically validated data. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
        </div>

        {/* ── COMPLETE SHOPPER EXPERIENCE ───────────────────────────────────── */}
        <div>
          <BundleHero id="complete-shopper-experience" name="Complete Shopper Experience" price="$699" savings="save $99"
            service1="Secret Shopping" price1="$299" service2="Voice of Customer Survey" price2="$499"
            desc="See what your customers experience walking through your door, then hear what they actually think. The most complete view of your customer experience available."
            formId="cs-form" />
          <div id="cs-form" style={{ marginTop: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
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
                <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                  Proceed to Payment — $699
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Secret Shopping available in Monmouth County and Jersey Shore area. Please only share what you are comfortable sharing.</p>
              </div>
            </form>
          </div>
        </div>

      </div>

      <SiteFooter />
    </div>
  );
}
