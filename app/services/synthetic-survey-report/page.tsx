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
  { title: "Custom Research Questions",    desc: "We design the research questions based on your specific business goals, the assumptions you want to test, and the decisions you're trying to make." },
  { title: "AI-Generated Customer Personas", desc: "3-5 detailed personas are constructed, each representing a distinct customer type relevant to your business, market, and competitive context." },
  { title: "Persona Response Simulation",  desc: "Each persona responds to your research questions as that customer type would — surfacing reactions, objections, and preferences across multiple perspectives at once." },
  { title: "Thematic Analysis",            desc: "We analyze responses across all personas to identify consistent patterns, meaningful contradictions, and directional insights that would be hard to see from a single viewpoint." },
  { title: "Directional Recommendations",  desc: "Based on the analysis, you receive specific, actionable recommendations tailored to what the personas revealed about your business situation." },
  { title: "Full Methodology Disclosure",  desc: "Every deliverable includes a clear explanation of how the personas were constructed, what assumptions were made, and exactly what the results do and don't mean." },
  { title: "Honest Limitations Statement", desc: "We tell you precisely where synthetic data is useful for decision-making and where it should be validated with real customer feedback before committing." },
];

// ── Form ──────────────────────────────────────────────────────────────────────

type FormData = {
  customerName: string; email: string; businessName: string;
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8: string; q9: string; q10: string;
};

const EMPTY: FormData = {
  customerName: "", email: "", businessName: "",
  q1: "", q2: "", q3: "", q4: "", q5: "",
  q6: "", q7: "", q8: "", q9: "", q10: "",
};

const REQUIRED: (keyof FormData)[] = [
  "customerName", "email", "businessName",
  "q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8",
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SyntheticSurveyReportPage() {
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "synthetic-survey-report", ...form }));
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
          Synthetic Survey Report
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Customer insight when you don&rsquo;t have a customer list.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$399</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>48-72 hour delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee, no subscriptions</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "560px", margin: "0 auto 20px" }}>
          We use AI-generated customer personas to pressure-test your assumptions and surface directional insight — with full transparency about the methodology. No existing customer list required.
        </p>
        <div style={{ display: "inline-block", border: "1px solid rgba(147,197,253,0.35)", borderRadius: "8px", padding: "10px 18px", backgroundColor: "rgba(255,255,255,0.05)" }}>
          <p style={{ fontFamily: MT, fontSize: "0.78rem", color: "#93C5FD", margin: 0 }}>
            Results are presented as directional insight, not statistically validated data. Full methodology disclosure is included in every deliverable.
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

      {/* ── WHEN IT MAKES SENSE ── */}
      <section style={{ backgroundColor: SAND, padding: "72px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "40px" }}>
            When a Synthetic Survey Makes Sense
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px" }}>
            {[
              { label: "Early-stage businesses", body: "You don't have a large customer base yet but need to validate assumptions before investing in product or marketing." },
              { label: "Before committing to research", body: "You want to explore the right research questions before running a full Voice of Customer study with real respondents." },
              { label: "Testing a new idea", body: "You're launching something new — a product, a price point, a message — and want realistic reactions before going to market." },
              { label: "Supplementing real data", body: "You have some customer feedback but want to explore additional perspectives or stress-test what you've heard." },
            ].map(({ label, body }) => (
              <div key={label} style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "12px", padding: "24px" }}>
                <div style={{ width: "4px", height: "20px", backgroundColor: TEAL, borderRadius: "2px", marginBottom: "12px" }} />
                <h3 style={{ fontFamily: CG, fontSize: "1.1rem", fontWeight: 600, color: NAVY, marginBottom: "8px" }}>{label}</h3>
                <p style={{ fontFamily: MT, color: GRAY, fontSize: "0.84rem", lineHeight: 1.7 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ backgroundColor: WHITE, padding: "80px 24px" }}>
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "56px" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "40px" }}>
            {[
              { num: "1", title: "Tell Us What You Want to Know", body: "Fill out the form below with your business context, your assumptions, and the specific questions you want answered. The clearer you are about what you're testing, the more targeted the personas will be." },
              { num: "2", title: "Personas Are Built and Surveyed", body: "I design 3-5 customer personas based on your context and run your research questions through them — capturing reactions, objections, and preferences across each customer type." },
              { num: "3", title: "Your Report Arrives", body: "A thematic analysis report with findings, directional recommendations, and full methodology disclosure lands in your inbox within 48-72 hours." },
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
      <section style={{ backgroundColor: SAND, padding: "80px 24px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>
            Get Your Synthetic Survey Report
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            The more specific your answers, the more targeted the personas and the more useful the findings. After submitting you&rsquo;ll be directed to a secure payment page.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* ── Contact info ── */}
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                Your Contact Information
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <Field id="customerName" label="Your Name"     required placeholder="Jane Smith" />
                <Field id="email"        label="Email Address" required placeholder="jane@yourbusiness.com" />
                <Field id="businessName" label="Business Name" required placeholder="Acme Coffee Co." />
              </div>
            </div>

            {/* ── Business and research questions ── */}
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "8px" }}>
                Your Business and Research Goals
              </h3>
              <p style={{ fontFamily: MT, fontSize: "0.82rem", color: LGRAY, marginBottom: "24px" }}>
                Questions 5 and 6 are the most important. The more precise your assumptions and research questions, the sharper the persona responses will be.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <Field id="q1" label="1. What is your business name and what do you sell or offer?" required
                  placeholder="e.g. Anchor Coffee Co. We run a specialty coffee shop and retail roastery in Bradley Beach, NJ." rows={3} />
                <Field id="q2" label="2. How long have you been in business, and where are you located?" required
                  placeholder="e.g. 2 years, launching a second location in Asbury Park this spring." />
                <Field id="q3" label="3. Who is your ideal customer?" required
                  hint="Age, income, lifestyle, and what they need from a business like yours."
                  placeholder="e.g. 28-45, value quality and local authenticity, willing to pay a premium, want a community-feel coffee shop rather than a chain." rows={3} />
                <Field id="q4" label="4. Who are your top 2–3 competitors?" required
                  hint="Names, or describe them if you don't know exact names."
                  placeholder="e.g. Starbucks on Main St, a newer indie shop called The Grind, and the bagel shop that also sells coffee." rows={2} />
                <Field id="q5" label="5. What assumptions about your customers do you want to test?" required
                  hint="What do you believe to be true about your customers that you haven't confirmed?"
                  placeholder="e.g. We assume our customers primarily value atmosphere over price. We assume people who buy our retail beans are different from our cafe customers. We assume our new Asbury Park location will attract a younger demographic." rows={4} />
                <Field id="q6" label="6. What are the 3-5 most important questions you want answered about your customers?" required
                  hint="Be as specific as possible — these drive the persona research questions."
                  placeholder="e.g. Would our customers pay $18 for a retail bag of single-origin coffee? What would make them choose us over the new shop that just opened? What would make a casual visitor become a loyal regular?" rows={4} />
                <Field id="q7" label="7. What does your current pricing look like and how do customers typically find you?" required
                  placeholder="e.g. Drip coffee $3.50, espresso drinks $5-7, retail bags $14-16. Most customers find us via word of mouth or walking by. Minimal online presence." rows={3} />
                <Field id="q8" label="8. What marketing are you currently doing, if any?" required
                  placeholder="e.g. Instagram 3x per week, no paid ads, occasional email to a list of about 400. Google Business profile is active." rows={3} />
                <Field id="q9" label="9. Is there a specific product, service, or decision you want customer reactions to?"
                  placeholder="e.g. We're considering launching a monthly coffee subscription at $35/month and want to know if our core customer type would value it." rows={3} />
                <Field id="q10" label="10. Is there anything else you want the personas to focus on or address?"
                  placeholder="e.g. We'd like the personas to react to our brand name and logo description if possible. We're also curious whether our hours of operation feel limiting." rows={3} />
              </div>
            </div>

            {/* ── Submit ── */}
            <div style={{ textAlign: "center" }}>
              <button
                type="submit"
                style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}
              >
                Proceed to Payment — $399
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>
                Flat fee. No subscriptions. Report delivered within 48-72 hours.
              </p>
              <p style={{ fontFamily: MT, fontSize: "0.75rem", color: LGRAY, marginTop: "6px" }}>
                Please only share what you are comfortable sharing. Your responses are used solely to produce your report. Results will be clearly labeled as directional insight from AI-generated personas.
              </p>
            </div>

          </form>
        </div>
      </section>

      {/* ── EXPLORE MORE ── */}
      <section style={{ backgroundColor: WHITE, padding: "48px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, marginBottom: "10px" }}>
          Want feedback from your actual customers instead?
        </p>
        <Link href="/services/voice-of-customer" style={{ fontFamily: MT, fontWeight: 600, fontSize: "0.9rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>
          See the Voice of Customer Survey →
        </Link>
      </section>

      <SiteFooter />
    </div>
  );
}
