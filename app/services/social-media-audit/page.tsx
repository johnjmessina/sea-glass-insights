"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

// Fonts are loaded globally via globals.css @import — use names directly
const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";

const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const SAND  = "#F4EADA";
const GRAY  = "#6B7280";
const LGRAY = "#9CA3AF";
const WHITE = "#FFFFFF";

// ── What's Included ───────────────────────────────────────────────────────────

const INCLUDES = [
  { title: "Profile and Setup Review",          desc: "A full assessment of your profile completeness, bio, links, and first-impression presentation across all active platforms." },
  { title: "Content Quality Scoring",           desc: "An honest evaluation of your post quality, visual consistency, caption effectiveness, and use of platform features." },
  { title: "Posting Consistency Analysis",      desc: "Frequency, timing patterns, and how consistency (or inconsistency) is affecting your organic reach." },
  { title: "Engagement Assessment",             desc: "Likes, comments, shares, and saves examined relative to your follower count and industry benchmarks." },
  { title: "Brand Consistency Evaluation",      desc: "How coherent your voice, visuals, and messaging are across every platform you're active on." },
  { title: "Platform Utilization Review",       desc: "Whether you're using the right platforms for your audience and making effective use of each platform's native tools." },
  { title: "Competitive Social Comparison",     desc: "A side-by-side look at up to 2 competitors — what they're doing well and where you have an advantage." },
  { title: "Overall Presence Score + Report",   desc: "A written report with a scored assessment, key findings, and specific recommendations you can act on immediately." },
];

// ── Form types ────────────────────────────────────────────────────────────────

type FormData = {
  customerName:   string;
  email:          string;
  businessName:   string;
  location:       string;
  industry:       string;
  facebook:       string;
  instagram:      string;
  otherPlatforms: string;
  competitors:    string;
  challenge:      string;
};

const EMPTY: FormData = {
  customerName: "", email: "", businessName: "", location: "",
  industry: "", facebook: "", instagram: "", otherPlatforms: "",
  competitors: "", challenge: "",
};

const REQUIRED: (keyof FormData)[] = [
  "customerName", "email", "businessName", "location", "industry", "challenge",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SocialMediaAuditPage() {
  const router = useRouter();
  const [form, setForm]         = useState<FormData>(EMPTY);
  const [errors, setErrors]     = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    REQUIRED.forEach(key => {
      if (!form[key].trim()) newErrors[key] = "This field is required.";
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Please enter a valid email address.";
    // Require at least one social platform
    if (!form.facebook.trim() && !form.instagram.trim() && !form.otherPlatforms.trim())
      newErrors.facebook = "Please enter at least one social media platform or handle.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) {
      document.querySelector("[data-error]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "social-media-audit", ...form }));
    router.push("/checkout");
  }

  const inputBase = `w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition`;
  const inputOk  = "border-gray-300 bg-white";
  const inputErr = "border-red-400 bg-red-50";
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 72px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
          Social Media Audit
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          See your social presence the way your customers do.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$199</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>48-72 hour delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto" }}>
          A scored assessment of your social media presence across seven dimensions, from profile setup and content quality to engagement, brand consistency, and how you stack up against competitors.
        </p>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "48px" }}>
            What&rsquo;s Included
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px" }}>
            {INCLUDES.map(({ title, desc }) => (
              <div key={title} style={{ border: "1px solid #E5E7EB", borderRadius: "12px", padding: "28px 24px" }}>
                <div style={{ width: "4px", height: "24px", backgroundColor: TEAL, borderRadius: "2px", marginBottom: "14px" }} />
                <h3 style={{ fontFamily: CG, fontSize: "1.15rem", fontWeight: 600, color: NAVY, marginBottom: "8px" }}>{title}</h3>
                <p style={{ fontFamily: MT, color: GRAY, fontSize: "0.86rem", lineHeight: 1.7 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BUNDLE CALLOUT ── */}
      <section style={{ backgroundColor: NAVY, padding: "48px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontFamily: MT, fontSize: "0.7rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "10px" }}>
            Bundle and save
          </p>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 700, color: WHITE, marginBottom: "10px", lineHeight: 1.3 }}>
            Add a Deep Dive Report and save $49.
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: "#93C5FD", marginBottom: "20px" }}>
            Get the Social Media Audit + Deep Dive Report together for <strong style={{ color: WHITE }}>$549</strong>.
          </p>
          <Link href="/contact" style={{ display: "inline-block", border: `1.5px solid ${TEAL}`, color: TEAL, fontFamily: MT, fontWeight: 600, fontSize: "0.88rem", padding: "10px 28px", borderRadius: "9999px", textDecoration: "none" }}>
            Contact us to bundle →
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: SAND, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "56px" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {[
              {
                num: "1",
                title: "Tell Us About Your Business",
                body: "Fill out the short form below with your business info and social handles. It takes about 5 minutes. The more context you share, the sharper the audit will be.",
              },
              {
                num: "2",
                title: "A Real Analyst Reviews Your Presence",
                body: "I personally visit your profiles, evaluate them across all seven dimensions, and compare them against up to two competitors you name.",
              },
              {
                num: "3",
                title: "Your Audit Arrives",
                body: "A professionally written scored report lands in your inbox within 48-72 hours. Specific findings and actionable recommendations you can implement immediately.",
              },
            ].map(({ num, title, body }) => (
              <div key={num} style={{ textAlign: "center" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: NAVY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CG, fontSize: "1.4rem", fontWeight: 700, margin: "0 auto 20px" }}>
                  {num}
                </div>
                <h3 style={{ fontFamily: CG, fontSize: "1.3rem", fontWeight: 600, color: NAVY, marginBottom: "12px" }}>{title}</h3>
                <p style={{ fontFamily: MT, color: GRAY, fontSize: "0.88rem", lineHeight: 1.8 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTAKE FORM ── */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>
            Get Your Social Media Audit
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            Fill out the form below. After submitting you&rsquo;ll be directed to a secure payment page. Your audit will be delivered within 48-72 hours.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* ── Contact info ── */}
            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                Your Contact Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Your Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="Jane Smith"
                    value={form.customerName} onChange={e => set("customerName", e.target.value)}
                    className={cls("customerName")} style={{ fontFamily: MT }}
                    data-error={errors.customerName ? true : undefined}
                  />
                  {errors.customerName && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.customerName}</p>}
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Email Address <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="email" placeholder="jane@yourbusiness.com"
                    value={form.email} onChange={e => set("email", e.target.value)}
                    className={cls("email")} style={{ fontFamily: MT }}
                  />
                  {errors.email && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* ── Business and social info ── */}
            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                Your Business and Social Presence
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

                {/* Business name */}
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Business Name <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="Acme Coffee Co."
                    value={form.businessName} onChange={e => set("businessName", e.target.value)}
                    className={cls("businessName")} style={{ fontFamily: MT }}
                  />
                  {errors.businessName && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.businessName}</p>}
                </div>

                {/* Location */}
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Business Location <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="Bradley Beach, NJ"
                    value={form.location} onChange={e => set("location", e.target.value)}
                    className={cls("location")} style={{ fontFamily: MT }}
                  />
                  {errors.location && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.location}</p>}
                </div>

                {/* Industry */}
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Industry / Business Type <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="e.g. Coffee Shop, Retail Clothing, Fitness Studio, Restaurant"
                    value={form.industry} onChange={e => set("industry", e.target.value)}
                    className={cls("industry")} style={{ fontFamily: MT }}
                  />
                  {errors.industry && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.industry}</p>}
                </div>

                {/* Social platforms */}
                <div style={{ borderTop: "1px solid #E5E7EB", paddingTop: "20px" }}>
                  <p style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, marginBottom: "4px" }}>
                    Your Social Media Platforms <span style={{ color: "#EF4444" }}>*</span>
                  </p>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "14px" }}>
                    Please enter at least one platform. Leave blank any that don&rsquo;t apply.
                  </p>

                  <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                      <label style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 500, color: GRAY, display: "block", marginBottom: "5px" }}>
                        Facebook Page URL
                      </label>
                      <input
                        type="text" placeholder="facebook.com/yourbusiness"
                        value={form.facebook} onChange={e => set("facebook", e.target.value)}
                        className={cls("facebook")} style={{ fontFamily: MT }}
                        data-error={errors.facebook ? true : undefined}
                      />
                    </div>
                    <div>
                      <label style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 500, color: GRAY, display: "block", marginBottom: "5px" }}>
                        Instagram Handle
                      </label>
                      <input
                        type="text" placeholder="@yourbusiness"
                        value={form.instagram} onChange={e => set("instagram", e.target.value)}
                        className={cls("instagram")} style={{ fontFamily: MT }}
                      />
                    </div>
                    <div>
                      <label style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 500, color: GRAY, display: "block", marginBottom: "5px" }}>
                        Other Active Platforms and Handles
                      </label>
                      <textarea
                        rows={2}
                        placeholder="e.g. TikTok: @yourbusiness, LinkedIn: linkedin.com/company/yourbiz, Pinterest: @yourbusiness"
                        value={form.otherPlatforms} onChange={e => set("otherPlatforms", e.target.value)}
                        className={`${inputBase} ${inputOk} resize-y`} style={{ fontFamily: MT }}
                      />
                    </div>
                    {errors.facebook && (
                      <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "-6px" }}>{errors.facebook}</p>
                    )}
                  </div>
                </div>

                {/* Competitors */}
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "4px" }}>
                    Top 1-2 Competitors You&rsquo;re Aware Of{" "}
                    <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}>(optional)</span>
                  </label>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>
                    Names or social handles. We&rsquo;ll compare your presence to theirs.
                  </p>
                  <input
                    type="text" placeholder="e.g. The Java House, @coastalcoffeenj"
                    value={form.competitors} onChange={e => set("competitors", e.target.value)}
                    className={`${inputBase} ${inputOk}`} style={{ fontFamily: MT }}
                  />
                </div>

                {/* Challenge */}
                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Biggest Social Media Challenge Right Now <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. We post regularly but get almost no engagement. We don't know what content actually resonates with our audience or how to grow our following."
                    value={form.challenge} onChange={e => set("challenge", e.target.value)}
                    className={`${cls("challenge")} resize-y`} style={{ fontFamily: MT }}
                  />
                  {errors.challenge && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.challenge}</p>}
                </div>

              </div>
            </div>

            {/* ── Submit ── */}
            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                style={{
                  backgroundColor: TEAL, color: NAVY,
                  fontFamily: MT, fontWeight: 700, fontSize: "1rem",
                  padding: "14px 48px", borderRadius: "9999px",
                  border: "none", cursor: "pointer", letterSpacing: "0.02em",
                }}
              >
                Proceed to Payment — $199
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>
                Flat fee. No subscriptions. Your audit will be delivered within 48-72 hours.
              </p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>
                Please only share what you are comfortable sharing. Your responses are used solely to produce your audit.
              </p>
            </div>

          </form>
        </div>
      </section>

      {/* ── EXPLORE MORE ── */}
      <section style={{ backgroundColor: SAND, padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginBottom: "10px" }}>
          Looking for a different service?
        </p>
        <Link href="/services" style={{ fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          View all services →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
