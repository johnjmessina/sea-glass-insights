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

// ── What's Included ───────────────────────────────────────────────────────────

const INCLUDES = [
  { title: "First Impression & Exterior",       desc: "The customer experience begins before anyone walks in. We evaluate signage, curb appeal, parking, and the initial approach to your location." },
  { title: "Greeting and Welcome",              desc: "How staff engage in the critical first moments — acknowledgment, warmth, and whether the customer felt noticed and welcomed." },
  { title: "Product Knowledge and Helpfulness", desc: "Can staff answer questions accurately and confidently? Do they guide the customer toward the right decision without pressure?" },
  { title: "Wait Time and Efficiency",          desc: "How long does the experience take, and how does that wait feel? This includes queuing, service pace, and checkout." },
  { title: "Cleanliness and Environment",       desc: "Physical condition of the space throughout the visit — floors, surfaces, restrooms, and presentation of products or menu." },
  { title: "Problem Handling",                  desc: "What happens when something goes wrong or a need isn't immediately met? We test how your team handles friction." },
  { title: "Overall Experience Score",          desc: "A composite rating across all six dimensions, with narrative context explaining what drove each score." },
  { title: "Analyst Observations + Report",     desc: "A complete formatted report with section-by-section narrative notes, scored ratings, and specific recommendations." },
];

// ── Form ──────────────────────────────────────────────────────────────────────

type FormData = {
  customerName:       string;
  email:              string;
  businessName:       string;
  businessAddress:    string;
  industry:           string;
  hours:              string;
  typicalInteraction: string;
  dimensions:         string;
  competitorShop:     string;
  focus:              string;
};

const EMPTY: FormData = {
  customerName: "", email: "", businessName: "", businessAddress: "",
  industry: "", hours: "", typicalInteraction: "",
  dimensions: "", competitorShop: "", focus: "",
};

const REQUIRED: (keyof FormData)[] = [
  "customerName", "email", "businessName", "businessAddress",
  "industry", "hours", "typicalInteraction", "focus",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SecretShoppingPage() {
  const router = useRouter();
  const [form, setForm]           = useState<FormData>(EMPTY);
  const [errors, setErrors]       = useState<Partial<Record<keyof FormData, string>>>({});
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "secret-shopping", ...form }));
    router.push("/checkout");
  }

  const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
  const inputOk   = "border-gray-300 bg-white";
  const inputErr  = "border-red-400 bg-red-50";
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 72px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
          Secret Shopping
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          See your business the way a first-time customer does.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$299</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>5-7 day delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "520px", margin: "0 auto 16px" }}>
          A professional in-person visit to your business, scored across seven dimensions of the customer experience. Delivered as a complete formatted report with narrative notes and specific recommendations.
        </p>
        <p style={{ fontFamily: MT, fontSize: "0.78rem", color: "rgba(147,197,253,0.65)" }}>
          Available for businesses in the Monmouth County and Jersey Shore area.
          Travel surcharge may apply for locations outside this area.
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
            Add a Market Intelligence Report and save $49.
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: "#93C5FD", marginBottom: "20px" }}>
            Get the Secret Shopping visit + Market Intelligence Report together for <strong style={{ color: WHITE }}>$449</strong>.
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
                body: "Fill out the short form below with your business details, hours, and anything specific you want evaluated. The more context you give, the sharper the visit will be.",
              },
              {
                num: "2",
                title: "A Trained Researcher Visits",
                body: "A real researcher visits your location as a genuine first-time customer, experiencing your business exactly as your customers do. No announcements, no pre-visit contact.",
              },
              {
                num: "3",
                title: "Your Report Arrives",
                body: "A complete scored report with narrative notes across all seven dimensions lands in your inbox within 5-7 days. Specific observations and actionable recommendations included.",
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
            Request a Secret Shop
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            Fill out the form below. After submitting you&rsquo;ll be directed to a secure payment page. Your report will be delivered within 5-7 days of the visit.
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

            {/* ── Business details ── */}
            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                Your Business
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

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

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Business Address <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="123 Main St, Bradley Beach, NJ 07720"
                    value={form.businessAddress} onChange={e => set("businessAddress", e.target.value)}
                    className={cls("businessAddress")} style={{ fontFamily: MT }}
                  />
                  {errors.businessAddress && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.businessAddress}</p>}
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Industry / Business Type <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="e.g. Coffee Shop, Retail Boutique, Restaurant, Fitness Studio"
                    value={form.industry} onChange={e => set("industry", e.target.value)}
                    className={cls("industry")} style={{ fontFamily: MT }}
                  />
                  {errors.industry && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.industry}</p>}
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Hours of Operation <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text" placeholder="e.g. Mon-Fri 7am-6pm, Sat-Sun 8am-4pm"
                    value={form.hours} onChange={e => set("hours", e.target.value)}
                    className={cls("hours")} style={{ fontFamily: MT }}
                  />
                  {errors.hours && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.hours}</p>}
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    What does a typical customer interaction look like? <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>
                    Walk us through what happens from the moment a customer arrives to the moment they leave.
                  </p>
                  <textarea
                    rows={4}
                    placeholder="e.g. Customer walks in, browses for a few minutes, orders at the counter, waits for their drink, finds a seat. Staff occasionally check in. Checkout happens at the counter before leaving."
                    value={form.typicalInteraction} onChange={e => set("typicalInteraction", e.target.value)}
                    className={`${cls("typicalInteraction")} resize-y`} style={{ fontFamily: MT }}
                    data-error={errors.typicalInteraction ? true : undefined}
                  />
                  {errors.typicalInteraction && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.typicalInteraction}</p>}
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Specific experience dimensions you want evaluated?{" "}
                    <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}>(optional)</span>
                  </label>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>
                    e.g. greeting, wait time, product knowledge, cleanliness, upsell behavior, problem resolution
                  </p>
                  <textarea
                    rows={3}
                    placeholder="e.g. We want to focus on whether staff proactively engage customers and whether the restroom is being maintained during peak hours."
                    value={form.dimensions} onChange={e => set("dimensions", e.target.value)}
                    className={`${inputBase} ${inputOk} resize-y`} style={{ fontFamily: MT }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Would you like a competitor location shopped as well?{" "}
                    <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}>(optional)</span>
                  </label>
                  <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>
                    An additional fee applies for competitor shops. If yes, we&rsquo;ll follow up to confirm details and pricing before scheduling.
                  </p>
                  <input
                    type="text" placeholder="e.g. Yes — The Java House, 456 Ocean Ave, Belmar, NJ"
                    value={form.competitorShop} onChange={e => set("competitorShop", e.target.value)}
                    className={`${inputBase} ${inputOk}`} style={{ fontFamily: MT }}
                  />
                </div>

                <div>
                  <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: "6px" }}>
                    Anything specific you&rsquo;re concerned about or want us to focus on? <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="e.g. We've had a few Google reviews mentioning slow service during lunch. We want to know if it's a staffing issue or a process issue, and how it compares to how we treat customers at other times."
                    value={form.focus} onChange={e => set("focus", e.target.value)}
                    className={`${cls("focus")} resize-y`} style={{ fontFamily: MT }}
                  />
                  {errors.focus && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors.focus}</p>}
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
                Proceed to Payment — $299
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>
                Flat fee. No subscriptions. Report delivered within 5-7 days of the visit.
              </p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>
                Please only share what you are comfortable sharing. Your responses are used solely to conduct your secret shop.
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
