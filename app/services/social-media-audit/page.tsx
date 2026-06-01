"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  "Profile and Setup review",
  "Content Quality scoring",
  "Posting Consistency analysis",
  "Engagement assessment",
  "Brand Consistency evaluation",
  "Platform Utilization review",
  "Competitive Social Comparison (up to 2 competitors)",
  "Overall Presence Score with written recommendations",
];

const HIW = [
  { num: "1", title: "Tell Us About Your Business", body: "Fill out the short form below with your business info and social handles. It takes about 5 minutes. The more context you share, the sharper the audit will be." },
  { num: "2", title: "A Real Analyst Reviews Your Presence", body: "I personally visit your profiles, evaluate them across all seven dimensions, and compare them against up to two competitors you name." },
  { num: "3", title: "Your Audit Arrives", body: "A professionally written scored report lands in your inbox within 48-72 hours. Specific findings and actionable recommendations you can implement immediately." },
];

type FormData = {
  customerName: string; email: string; businessName: string;
  location: string; industry: string; facebook: string;
  instagram: string; otherPlatforms: string; competitors: string; challenge: string;
};
const EMPTY: FormData = { customerName: "", email: "", businessName: "", location: "", industry: "", facebook: "", instagram: "", otherPlatforms: "", competitors: "", challenge: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "email", "businessName", "location", "industry", "challenge"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk   = "border-gray-300 bg-white";
const inputErr  = "border-red-400 bg-red-50";

export default function SocialMediaAuditPage() {
  const router = useRouter();
  const [form, setForm]           = useState<FormData>(EMPTY);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData, value: string) { setForm(p => ({ ...p, [field]: value })); if (errors[field]) setErrors(p => ({ ...p, [field]: undefined })); }
  function validate(): boolean {
    const e: Partial<Record<keyof FormData, string>> = {};
    REQUIRED.forEach(k => { if (!form[k].trim()) e[k] = "This field is required."; });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Please enter a valid email address.";
    if (!form.facebook.trim() && !form.instagram.trim() && !form.otherPlatforms.trim()) e.facebook = "Please enter at least one social media platform or handle.";
    setErrors(e); return Object.keys(e).length === 0;
  }
  function handleSubmit(e: FormEvent) {
    e.preventDefault(); setSubmitted(true);
    if (!validate()) { document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "social-media-audit", ...form }));
    router.push("/checkout");
  }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 56px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>Social Media Audit</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          See your social presence the way your customers do.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$199</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>48-72 hour delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto 28px" }}>
          A scored assessment of your social media presence across seven dimensions, from profile setup and content quality to engagement, brand consistency, and how you stack up against competitors.
        </p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started →</a>
      </section>

      {/* TRUST LINE */}
      <div style={{ backgroundColor: WHITE, padding: "14px 24px", textAlign: "center", borderBottom: "1px solid #F3F4F6" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>

      {/* TWO-COLUMN */}
      <section style={{ backgroundColor: WHITE, padding: "56px 24px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "48px" }}>
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

      {/* INTAKE FORM */}
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "64px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your Social Media Audit</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            Fill out the form below. After submitting you&rsquo;ll be directed to a secure payment page. Your audit will be delivered within 48-72 hours.
          </p>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Contact Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>Your Name <span style={{ color: "#EF4444" }}>*</span></label>
                  <input type="text" placeholder="Jane Smith" value={form.customerName} onChange={e => set("customerName", e.target.value)} className={cls("customerName")} style={{ fontFamily: MT }} data-error={errors.customerName ? true : undefined} />
                  {errors.customerName && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.customerName}</p>}
                </div>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>Email Address <span style={{ color: "#EF4444" }}>*</span></label>
                  <input type="email" placeholder="jane@yourbusiness.com" value={form.email} onChange={e => set("email", e.target.value)} className={cls("email")} style={{ fontFamily: MT }} />
                  {errors.email && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.email}</p>}
                </div>
              </div>
            </div>

            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Business and Social Presence</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>Business Name <span style={{ color: "#EF4444" }}>*</span></label>
                  <input type="text" placeholder="Acme Coffee Co." value={form.businessName} onChange={e => set("businessName", e.target.value)} className={cls("businessName")} style={{ fontFamily: MT }} />
                  {errors.businessName && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.businessName}</p>}
                </div>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>Business Location <span style={{ color: "#EF4444" }}>*</span></label>
                  <input type="text" placeholder="Bradley Beach, NJ" value={form.location} onChange={e => set("location", e.target.value)} className={cls("location")} style={{ fontFamily: MT }} />
                  {errors.location && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.location}</p>}
                </div>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>Industry / Business Type <span style={{ color: "#EF4444" }}>*</span></label>
                  <input type="text" placeholder="e.g. Coffee Shop, Retail Clothing, Fitness Studio, Restaurant" value={form.industry} onChange={e => set("industry", e.target.value)} className={cls("industry")} style={{ fontFamily: MT }} />
                  {errors.industry && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.industry}</p>}
                </div>
                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "20px" }}>
                  <p style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, marginBottom: "4px" }}>Your Social Media Platforms <span style={{ color: "#EF4444" }}>*</span></p>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "14px" }}>Please enter at least one platform. Leave blank any that don&rsquo;t apply.</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 500, color: GRAY, display: "block", marginBottom: "5px" }}>Facebook Page URL</label>
                      <input type="text" placeholder="facebook.com/yourbusiness" value={form.facebook} onChange={e => set("facebook", e.target.value)} className={cls("facebook")} style={{ fontFamily: MT }} data-error={errors.facebook ? true : undefined} />
                    </div>
                    <div>
                      <label style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 500, color: GRAY, display: "block", marginBottom: "5px" }}>Instagram Handle</label>
                      <input type="text" placeholder="@yourbusiness" value={form.instagram} onChange={e => set("instagram", e.target.value)} className={cls("instagram")} style={{ fontFamily: MT }} />
                    </div>
                    <div>
                      <label style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 500, color: GRAY, display: "block", marginBottom: "5px" }}>Other Active Platforms and Handles</label>
                      <textarea rows={2} placeholder="e.g. TikTok: @yourbusiness, LinkedIn: linkedin.com/company/yourbiz, Pinterest: @yourbusiness" value={form.otherPlatforms} onChange={e => set("otherPlatforms", e.target.value)} className={`${inputBase} ${inputOk} resize-y`} style={{ fontFamily: MT }} />
                    </div>
                    {errors.facebook && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "-6px" }}>{errors.facebook}</p>}
                  </div>
                </div>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "4px" }}>Top 1-2 Competitors You&rsquo;re Aware Of <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}>(optional)</span></label>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>Names or social handles. We&rsquo;ll compare your presence to theirs.</p>
                  <input type="text" placeholder="e.g. The Java House, @coastalcoffeenj" value={form.competitors} onChange={e => set("competitors", e.target.value)} className={`${inputBase} ${inputOk}`} style={{ fontFamily: MT }} />
                </div>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>Biggest Social Media Challenge Right Now <span style={{ color: "#EF4444" }}>*</span></label>
                  <textarea rows={4} placeholder="e.g. We post regularly but get almost no engagement. We don't know what content actually resonates with our audience or how to grow our following." value={form.challenge} onChange={e => set("challenge", e.target.value)} className={`${cls("challenge")} resize-y`} style={{ fontFamily: MT }} />
                  {errors.challenge && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.challenge}</p>}
                </div>
              </div>
            </div>

            {/* BUNDLE CALLOUT */}
            <div style={{ border: `1.5px solid ${TEAL}`, borderRadius: "12px", padding: "16px 20px", textAlign: "center", backgroundColor: WHITE }}>
              <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "6px" }}>Bundle and save</p>
              <p style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>Add a Deep Dive Report and save $49.</p>
              <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY }}>Get both for <strong style={{ color: NAVY }}>$549</strong>. <Link href="/contact" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline" }}>Contact us to bundle →</Link></p>
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                Proceed to Payment — $199
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. No subscriptions. Your audit will be delivered within 48-72 hours.</p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>Please only share what you are comfortable sharing. Your responses are used solely to produce your audit.</p>
            </div>
          </form>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
