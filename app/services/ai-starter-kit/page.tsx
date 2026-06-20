"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter       from "@/components/SiteFooter";
import ServiceFormField from "@/components/ServiceFormField";
import { CheckboxGroupWithOther, AI_TOOLS, AI_TASKS, AI_TONES } from "@/components/StructuredFormInputs";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

const CHECKLIST = [
  "Business Type Analysis",
  "5-6 Custom-Written Prompts for your specific business",
  "Prompt-by-Prompt Instructions",
  "Works with ChatGPT, Claude, or any major AI tool",
  "Built for real use cases: marketing, responses, social captions",
  "One Round of Revisions",
  "Every prompt is written specifically for your business type, your tone, and your real use cases — not generic templates you could find anywhere online.",
];
const HIW = [
  { num: "1", title: "Tell Us About Your Business", body: "Fill out the short form below. Tell us your business type, your brand voice, what AI tool you're using, and the tasks where you most need help." },
  { num: "2", title: "We Write Your Prompts", body: "We study your business and write 5-6 prompts built specifically for your situation — not generic templates pulled from a library." },
  { num: "3", title: "Use Them Immediately", body: "Your kit arrives within 48 hours with instructions for each prompt. Copy, paste, and start saving time the same day." },
];

type FormData = { customerName: string; email: string; businessName: string; q1: string; q2: string; q3: string; q4: string; q5: string; q6: string; };
const EMPTY: FormData = { customerName: "", email: "", businessName: "", q1: "", q2: "", q3: "", q4: "", q5: "", q6: "" };
const REQUIRED: (keyof FormData)[] = ["customerName", "email", "businessName", "q1", "q2", "q3", "q4", "q5"];

const inputBase = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inputOk = "border-gray-300 bg-white"; const inputErr = "border-red-400 bg-red-50";

export default function AIStarterKitPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "ai-starter-kit", ...form })); router.push("/checkout");
  }
  const cls = (f: keyof FormData) => `${inputBase} ${errors[f] ? inputErr : inputOk}`;


  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: SAND }}>
      <SiteNav />
      <section style={{ backgroundColor: SAND, textAlign: "center", padding: "48px 24px 16px" }}>
        <p style={{ fontFamily: MT, fontSize: "0.72rem", fontWeight: 600, color: TEAL, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "12px" }}>AI Starter Kit</p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: NAVY, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>Custom AI prompts built for your specific business.</h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>$99</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: GRAY }}>48 hour delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: TEAL, fontWeight: 600 }}>$79 as an add-on</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: GRAY, maxWidth: "540px", margin: "0 auto 28px" }}>Five to six prompts written specifically for your business type and voice — ready to use immediately with ChatGPT, Claude, or any major AI tool. No generic templates. Built for the tasks that actually save you time.</p>
        <a href="#intake-form" style={{ display: "inline-block", backgroundColor: "transparent", color: NAVY, border: "1.5px solid #0A2F61", fontFamily: MT, fontWeight: 600, fontSize: "1rem", padding: "13px 36px", borderRadius: "9999px", textDecoration: "none" }}>Get Started →</a>
      </section>
      <div style={{ backgroundColor: SAND, padding: "6px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.8rem", color: NAVY, opacity: 0.55, letterSpacing: "0.04em" }}>Analyst-reviewed. Flat fee. No surprises.</p>
      </div>
      <section style={{ backgroundColor: SAND, padding: "16px 24px 16px" }}>
        <div style={{ maxWidth: "960px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "48px", alignItems: "stretch" }}>
          <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px", boxShadow: "0 4px 20px rgba(10,47,97,0.08)" }}>
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
      <section id="intake-form" style={{ backgroundColor: SAND, padding: "16px 24px 48px" }}>
        <div style={{ maxWidth: "680px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.8rem,4vw,2.6rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "8px" }}>Get Your AI Starter Kit</h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>Answer a few questions about your business and we&rsquo;ll write prompts that actually fit how you work. Delivered in 48 hours.</p>
          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>Your Contact Information</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <ServiceFormField label="Your Name" required placeholder="Jane Smith"  value={form.customerName} error={errors.customerName} onChange={v => set("customerName", v)} />
                <ServiceFormField label="Email Address" required placeholder="jane@yourbusiness.com"  value={form.email} error={errors.email} onChange={v => set("email", v)} />
                <ServiceFormField label="Business Name" required placeholder="Acme Coffee Co."  value={form.businessName} error={errors.businessName} onChange={v => set("businessName", v)} />
              </div>
            </div>
            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>About Your Business</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <ServiceFormField label="1. What is your business name and what do you do?" required placeholder="e.g. Anchor Coffee Co. — we run a specialty coffee shop and roastery in Bradley Beach, NJ." rows={2}  value={form.q1} error={errors.q1} onChange={v => set("q1", v)} />
                <ServiceFormField label="2. Where are you located and who are your customers?" required placeholder="e.g. Bradley Beach, NJ. Our customers are mostly locals, 25-50, who value quality and community. Tourists in summer." rows={2}  value={form.q2} error={errors.q2} onChange={v => set("q2", v)} />
                <CheckboxGroupWithOther
                  label="3. What AI tool are you planning to use?"
                  hint="Select all that apply. If you're not sure yet, that's fine too."
                  options={AI_TOOLS}
                  onChange={v => set("q3", v)}
                  required={true}
                  error={errors.q3}
                  otherPlaceholder="Which other AI tool?"
                />
                <CheckboxGroupWithOther
                  label="4. What are the top tasks you want AI to help you with?"
                  hint="Select all that apply."
                  options={AI_TASKS}
                  onChange={v => set("q4", v)}
                  required={true}
                  error={errors.q4}
                  otherPlaceholder="Describe another task…"
                />
                <CheckboxGroupWithOther
                  label="5. What is the tone of your brand?"
                  hint="Select all that apply."
                  options={AI_TONES}
                  onChange={v => set("q5", v)}
                  required={true}
                  error={errors.q5}
                  otherPlaceholder="Describe your brand tone…"
                />
                <ServiceFormField label="6. Anything specific about your business or customers we should know when writing your prompts?" hint="Seasonal business? Specific sensitivities? Things you never want to say? Anything that would help us get the tone exactly right." placeholder="e.g. We're very community-focused and never do aggressive sales language. We also have a lot of dog owners as customers — that's a big part of our identity." rows={3}  value={form.q6} error={errors.q6} onChange={v => set("q6", v)} />
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: "pointer", letterSpacing: "0.02em" }}>Proceed to Payment — $99</button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>Flat fee. Delivered within 48 hours. Includes one round of revisions.</p>
            </div>
          </form>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
