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
  { title: "Everything in the Market Intelligence Report",  desc: "The full MIR foundation: Business Snapshot, Customer Profile (3 segments), Competitive Landscape, Market Positioning, Key Insights, and Recommendations." },
  { title: "Deeper Competitive Intelligence",               desc: "Each competitor examined with greater rigor — additional sources, positioning gaps identified, competitive threat level assessed, and specific analysis of where they are outpacing you." },
  { title: "Additional Customer Segments",                  desc: "Beyond the standard 3 segments, we go deeper into underserved or emerging segments that represent real growth opportunities for your business." },
  { title: "Expanded Market Context",                       desc: "A more thorough read of your broader market environment, including relevant trends, category dynamics, and external pressures affecting your competitive position." },
  { title: "Extended Recommendations",                      desc: "Four core recommendations with implementation guidance — specific next steps and considerations, not just directional guidance." },
  { title: "Priority Action Framework",                     desc: "A ranked action plan that separates what to do immediately from what to do in the next 90 days and beyond, based on impact and feasibility." },
  { title: "Decision-Specific Analysis",                    desc: "Deep Dive clients are often facing a major decision. The report includes a section specifically addressing the question or problem you named in the intake form." },
  { title: "Expanded Analyst Interpretation",               desc: "A more detailed analyst section — not just a closing note, but a fuller interpretation of what the findings mean for your specific situation right now." },
];

// ── Form ──────────────────────────────────────────────────────────────────────

type FormData = {
  customerName: string;
  email:        string;
  businessName: string;
  q1:  string; q2:  string; q3:  string; q4:  string;
  q5:  string; q6:  string; q7:  string; q8:  string;
  q9:  string; q10: string; q11: string; q12: string;
};

const EMPTY: FormData = {
  customerName: "", email: "", businessName: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
  q7: "", q8: "", q9: "", q10: "", q11: "", q12: "",
};

const REQUIRED: (keyof FormData)[] = [
  "customerName", "email", "businessName",
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8", "q9", "q11",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DeepDiveReportPage() {
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "deep-dive-report", ...form }));
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
          {label}{required && <span style={{ color: "#EF4444" }}> *</span>}
          {!required && <span style={{ fontFamily: MT, fontSize: "0.75rem", fontWeight: 400, color: LGRAY }}> (optional)</span>}
        </label>
        {hint && <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginBottom: "6px" }}>{hint}</p>}
        {rows ? (
          <textarea
            rows={rows}
            placeholder={placeholder}
            value={form[id]}
            onChange={e => set(id, e.target.value)}
            className={`${cls(id)} resize-y`}
            style={{ fontFamily: MT }}
            data-error={errors[id] ? true : undefined}
          />
        ) : (
          <input
            type="text"
            placeholder={placeholder}
            value={form[id]}
            onChange={e => set(id, e.target.value)}
            className={cls(id)}
            style={{ fontFamily: MT }}
            data-error={errors[id] ? true : undefined}
          />
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
          Deep Dive Report
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Deeper intelligence for businesses facing a major decision.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$399</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>5-7 day delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "560px", margin: "0 auto" }}>
          Everything in the Market Intelligence Report, but deeper. The same competitor set examined with greater rigor, more sources, more context, and more analyst time spent on what each finding actually means for your business. Built for businesses facing a major decision or responding to a significant competitive threat.
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
            Add a Social Media Audit and save $49.
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: "#93C5FD", marginBottom: "20px" }}>
            Get the Deep Dive Report + Social Media Audit together for <strong style={{ color: WHITE }}>$549</strong>.
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
                body: "Fill out the form below with your business context, competitive landscape, and — critically — the specific decision or problem you're trying to solve. The more detail you share, the sharper the report will be.",
              },
              {
                num: "2",
                title: "A Real Analyst Gets to Work",
                body: "I personally research your market, your competitors, and your positioning with greater rigor than the standard report allows. More sources, more time, more context for your specific situation.",
              },
              {
                num: "3",
                title: "Your Report Arrives",
                body: "A deeply researched report with a decision-specific analysis section lands in your inbox within 5-7 days. Comprehensive findings and a prioritized action framework included.",
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
            Get Your Deep Dive Report
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            Fill out the form below. The more context you provide, the more targeted the analysis will be. After submitting you&rsquo;ll be directed to a secure payment page.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* ── Contact info ── */}
            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                Your Contact Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Field id="customerName" label="Your Name"      required placeholder="Jane Smith" />
                <Field id="email"        label="Email Address"  required placeholder="jane@yourbusiness.com" />
                <Field id="businessName" label="Business Name"  required placeholder="Acme Coffee Co." />
              </div>
            </div>

            {/* ── Standard intake questions ── */}
            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
                Business Context
              </h3>
              <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>
                These questions give us the foundation for the research. More detail here means sharper insights in your report.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <Field id="q1" label="1. What is your business name and what do you sell or offer?" required
                  placeholder="e.g. Anchor Coffee Co. We run a specialty coffee shop and retail roastery in Bradley Beach, NJ." rows={3} />
                <Field id="q2" label="2. How long have you been in business, and where are you located?" required
                  placeholder="e.g. 4 years, Bradley Beach NJ. Seasonal location with year-round operations." />
                <Field id="q3" label="3. Who is your ideal customer?" required
                  hint="Age, income, lifestyle, and the problem or desire that brings them to you."
                  placeholder="e.g. 28-45, dual income households, value quality over price, want a third-place that feels local not corporate." rows={3} />
                <Field id="q4" label="4. Who are your top 2–3 competitors?" required
                  hint="Names, or describe them if you don't know exact names."
                  placeholder="e.g. Starbucks on Main St, a newer indie shop called The Grind that opened last year, and the bagel shop that also sells coffee." rows={3} />
                <Field id="q5" label="5. What makes you different from those competitors?" required
                  placeholder="e.g. We roast in-house, our staff knows the product deeply, and we have a loyalty base that treats us like a community hub." rows={3} />
                <Field id="q6" label="6. What is the biggest challenge you are facing right now?" required
                  placeholder="e.g. The new shop that opened across town is pulling our afternoon regulars and we don't know why." rows={3} />
                <Field id="q7" label="7. What does success look like for you in the next 12 months?" required
                  placeholder="e.g. Stabilize our customer base, grow revenue by 20%, and have a clear strategy for the off-season." rows={3} />
                <Field id="q8" label="8. What marketing are you currently doing, if any?" required
                  placeholder="e.g. Instagram 3x per week, occasional Facebook posts, no paid ads. Email list of about 400 people we rarely use." rows={3} />
                <Field id="q9" label="9. What do you wish you knew about your market or customers that you don't know today?" required
                  placeholder="e.g. Why our lunch traffic is weaker than our morning traffic, and whether there's an untapped customer segment we're missing." rows={3} />
                <Field id="q10" label="10. Is there anything else you want the report to focus on or address?"
                  placeholder="e.g. We're thinking about adding a second location. Anything relevant to that decision would be useful." rows={3} />
              </div>
            </div>

            {/* ── Deep Dive specific questions ── */}
            <div style={{ backgroundColor: SAND, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
                Deep Dive Specifics
              </h3>
              <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>
                These questions are what separate the Deep Dive from a standard report. Take your time here — your answers directly shape the decision-specific section of the analysis.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <Field id="q11" label="11. What specific decision are you trying to make or problem are you trying to solve with this report?" required
                  hint="Be as specific as possible. The more clearly you define the question, the more targeted the analysis."
                  placeholder="e.g. We are deciding whether to sign a lease on a second location in Asbury Park by the end of Q3. I need to understand whether the market can support it and whether our current brand positioning translates to that area." rows={4} />
                <Field id="q12" label="12. Have you done any market research before? If so, what did you learn?"
                  hint="If no prior research, just say so — that's useful context too."
                  placeholder="e.g. We ran a customer survey two years ago. Key finding was that people come for the atmosphere as much as the coffee. We haven't done anything formal since." rows={3} />
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
                Proceed to Payment — $399
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>
                Flat fee. No subscriptions. Report delivered within 5-7 days.
              </p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>
                Please only share what you are comfortable sharing. Your responses are used solely to produce your report.
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
