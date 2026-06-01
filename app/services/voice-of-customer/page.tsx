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

const INCLUDES = [
  { title: "Custom Survey Design",          desc: "We design a survey of up to 10 questions tailored to your specific business goals, the decisions you're trying to make, and what you most want to learn from your customers." },
  { title: "Distribution-Optimized Format", desc: "Your survey is formatted and structured for email or SMS distribution — clear, mobile-friendly, and built to maximize response rates from real customers." },
  { title: "Contact List Upload",           desc: "After payment, you'll receive a secure link to upload your customer contact list. We handle distribution to your existing customers on your behalf." },
  { title: "Response Collection",           desc: "We collect and organize all responses, removing incomplete submissions and ensuring clean data before analysis begins." },
  { title: "Thematic Analysis",             desc: "Responses are analyzed for patterns, themes, and outliers. We look for what's consistent, what's surprising, and what's actionable." },
  { title: "Visual Report with Findings",   desc: "A professionally designed report with visual summaries of findings, key themes, and direct customer quotes delivered to your inbox." },
  { title: "Analyst Interpretation",        desc: "Not just charts and tables — a written interpretation of what the findings mean for your business and specific recommendations based on what your customers told us." },
];

type FormData = {
  customerName: string; email: string; businessName: string;
  q1: string; q2: string; q3: string; q4: string;
  q5: string; q6: string; q7: string;
};

const EMPTY: FormData = {
  customerName: "", email: "", businessName: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "", q7: "",
};

const REQUIRED: (keyof FormData)[] = [
  "customerName", "email", "businessName",
  "q1", "q2", "q3", "q4", "q5", "q7",
];

export default function VoiceOfCustomerPage() {
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "voice-of-customer", ...form }));
    router.push("/checkout");
  }

  const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
  const inputOk   = "border-gray-300 bg-white";
  const inputErr  = "border-red-400 bg-red-50";
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;

  function Field({ id, label, required, hint, placeholder, rows }: {
    id: keyof FormData; label: string; required?: boolean;
    hint?: string; placeholder: string; rows?: number;
  }) {
    return (
      <div>
        <label style={{ fontFamily: MT, fontSize: "0.82rem", fontWeight: 600, color: NAVY, display: "block", marginBottom: hint ? "3px" : "6px" }}>
          {label}
          {required && <span style={{ color: "#EF4444" }}> *</span>}
          {!required && <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}> (optional)</span>}
        </label>
        {hint && <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>{hint}</p>}
        {rows ? (
          <textarea rows={rows} placeholder={placeholder} value={form[id]} onChange={e => set(id, e.target.value)}
            className={`${cls(id)} resize-y`} style={{ fontFamily: MT }}
            data-error={errors[id] ? true : undefined} />
        ) : (
          <input type="text" placeholder={placeholder} value={form[id]} onChange={e => set(id, e.target.value)}
            className={cls(id)} style={{ fontFamily: MT }}
            data-error={errors[id] ? true : undefined} />
        )}
        {errors[id] && <p style={{ fontFamily: MT, color: "#EF4444", fontSize: "0.78rem", marginTop: "4px" }}>{errors[id]}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />

      {/* ── HERO ── */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 72px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>
          Voice of Customer Survey
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Real feedback from your real customers.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$499</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>1-2 week delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "580px", margin: "0 auto 20px" }}>
          We design a custom survey around your business goals, send it to your existing customers, and deliver a visual report with findings, themes, and actionable recommendations. You&rsquo;ll need an existing customer contact list to participate.
        </p>
        <div style={{ display: "inline-block", border: "1px solid rgba(147,197,253,0.35)", borderRadius: "8px", padding: "10px 18px", backgroundColor: "rgba(255,255,255,0.05)" }}>
          <p style={{ fontFamily: MT, fontSize: "0.78rem", color: "#93C5FD", margin: 0 }}>
            After payment, you&rsquo;ll receive a secure link to upload your contact data. Sea Glass Insights does not provide contact lists.
          </p>
        </div>
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

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: SAND, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "56px" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "32px" }}>
            {[
              { num: "1", title: "Tell Us Your Goals", body: "Fill out the short intake form below with your business context and what you most want to learn from your customers." },
              { num: "2", title: "Pay and Upload Your List", body: "After payment, you'll receive a secure upload link. Send us your customer contact list as a CSV, XLS, or XLSX file." },
              { num: "3", title: "We Design and Send the Survey", body: "We design a custom survey based on your goals and distribute it to your customers on your behalf." },
              { num: "4", title: "Your Report Arrives", body: "A visual findings report with themes, highlights, and analyst interpretation lands in your inbox within 1-2 weeks." },
            ].map(({ num, title, body }) => (
              <div key={num} style={{ textAlign: "center" }}>
                <div style={{ width: "52px", height: "52px", borderRadius: "50%", backgroundColor: NAVY, color: WHITE, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: CG, fontSize: "1.4rem", fontWeight: 700, margin: "0 auto 16px" }}>
                  {num}
                </div>
                <h3 style={{ fontFamily: CG, fontSize: "1.2rem", fontWeight: 600, color: NAVY, marginBottom: "10px" }}>{title}</h3>
                <p style={{ fontFamily: MT, color: GRAY, fontSize: "0.86rem", lineHeight: 1.75 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTAKE FORM ── */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>
            Get Your Voice of Customer Report
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            Tell us about your goals below. After payment you&rsquo;ll receive a secure link to upload your customer contact list.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                Your Contact Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Field id="customerName" label="Your Name"     required placeholder="Jane Smith" />
                <Field id="email"        label="Email Address" required placeholder="jane@yourbusiness.com" />
                <Field id="businessName" label="Business Name" required placeholder="Acme Coffee Co." />
              </div>
            </div>

            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                About Your Business and Customers
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <Field id="q1" label="1. Business name and location" required
                  placeholder="e.g. Anchor Coffee Co., Bradley Beach NJ — specialty coffee shop and roastery." />
                <Field id="q2" label="2. Industry / business type" required
                  placeholder="e.g. Food & Beverage — independent coffee shop, retail and cafe." />
                <Field id="q3" label="3. Approximately how many customer contacts do you have?" required
                  hint="An estimate is fine. This helps us understand response rate expectations."
                  placeholder="e.g. Around 400 email addresses collected through our loyalty program and online orders." />
                <Field id="q4" label="4. How were these contacts collected?" required
                  hint="Past purchases, loyalty program, website signups, in-store collection, etc."
                  placeholder="e.g. Mostly through our Square loyalty program. About 80 from an email signup form on our website." rows={2} />
                <Field id="q5" label="5. What do you most want to learn from your customers?" required
                  hint="Be as specific as possible — this drives the survey question design."
                  placeholder="e.g. Why they choose us over competitors, what would make them come more often, and whether they'd value a monthly coffee subscription." rows={4} />
                <Field id="q6" label="6. Have you surveyed your customers before? If so, what did you find?"
                  placeholder="e.g. We ran a short Google Form survey 2 years ago. About 30 responses — customers loved the atmosphere but mentioned wanting faster service during morning rush." rows={3} />
                <Field id="q7" label="7. What decision will this research inform?" required
                  placeholder="e.g. Whether to expand our hours, add a subscription model, or open a second location. We want to understand our customers before committing." rows={3} />
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                Proceed to Payment — $499
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>
                Flat fee. No subscriptions. After payment you&rsquo;ll receive a secure link to upload your contact list.
              </p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>
                Sea Glass Insights does not provide contact lists. You must have an existing list to participate.
              </p>
            </div>

          </form>
        </div>
      </section>

      <section style={{ backgroundColor: SAND, padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginBottom: "10px" }}>
          Don&rsquo;t have a contact list yet?
        </p>
        <Link href="/services/synthetic-survey-report" style={{ fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          See the Synthetic Survey Report instead →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
