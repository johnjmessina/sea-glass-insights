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
  { title: "Business Type Analysis",         desc: "Before writing a single prompt, we study your business type, your customers, and your goals so every prompt reflects how you actually work." },
  { title: "5-6 Custom-Written Prompts",     desc: "Each prompt is written specifically for your business — not generic templates. They're ready to copy, paste, and use immediately." },
  { title: "Prompt-by-Prompt Instructions",  desc: "Every prompt comes with a plain-English explanation of what it does, when to use it, and how to customize it for specific situations." },
  { title: "Works With Any Major AI Tool",   desc: "Your prompts work with ChatGPT, Claude, Gemini, or any other major AI tool. No software purchase required beyond what you already use." },
  { title: "Built for Real Use Cases",       desc: "Marketing copy, customer responses, social media captions, promotions, email drafts — prompts are built around the tasks that save you the most time." },
  { title: "One Round of Revisions",         desc: "After delivery, you have one round of revisions to fine-tune the prompts based on your feedback. We want them to actually work for you." },
];

type FormData = {
  customerName: string; email: string; businessName: string;
  q1: string; q2: string; q3: string; q4: string; q5: string; q6: string;
};

const EMPTY: FormData = {
  customerName: "", email: "", businessName: "",
  q1: "", q2: "", q3: "", q4: "", q5: "", q6: "",
};

const REQUIRED: (keyof FormData)[] = [
  "customerName", "email", "businessName",
  "q1", "q2", "q3", "q4", "q5",
];

export default function AIStarterKitPage() {
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
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service: "ai-starter-kit", ...form }));
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
          AI Starter Kit
        </p>
        <h1 style={{ fontFamily: CG, fontSize: "clamp(2.2rem,5vw,3.4rem)", fontWeight: 700, color: WHITE, lineHeight: 1.2, maxWidth: "640px", margin: "0 auto 20px" }}>
          Custom AI prompts built for your specific business.
        </h1>
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
          <span style={{ fontFamily: MT, fontSize: "1.4rem", fontWeight: 700, color: WHITE }}>$99</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>48 hour delivery</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: "#93C5FD" }}>Flat fee</span>
          <span style={{ fontFamily: MT, fontSize: "0.82rem", color: TEAL, fontWeight: 600 }}>$79 as an add-on</span>
        </div>
        <p style={{ fontFamily: MT, fontSize: "0.92rem", color: "#CBD5E1", maxWidth: "540px", margin: "0 auto" }}>
          Five to six prompts written specifically for your business type and voice — ready to use immediately with ChatGPT, Claude, or any major AI tool. No generic templates. Built for the tasks that actually save you time.
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

      {/* ── WHAT IT'S GOOD FOR ── */}
      <section style={{ backgroundColor: SAND, padding: "72px 24px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ fontFamily: CG, fontSize: "clamp(1.6rem,4vw,2.2rem)", fontWeight: 700, color: NAVY, textAlign: "center", marginBottom: "40px" }}>
            Built for Real Tasks
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {[
              { icon: "✍", label: "Marketing copy",        body: "Social media captions, promotional emails, and ad copy written in your brand voice." },
              { icon: "💬", label: "Customer responses",    body: "Professional replies to reviews, inquiries, and complaints — at any time of day." },
              { icon: "📧", label: "Email drafts",          body: "Follow-ups, announcements, newsletters, and outreach that actually sound like you." },
              { icon: "📣", label: "Promotions and offers", body: "Seasonal sales, event announcements, and limited offers written to convert." },
              { icon: "📝", label: "Product descriptions",  body: "Menu items, retail products, and service listings that sell without sounding generic." },
              { icon: "🗓", label: "Content planning",      body: "Prompts that help you generate ideas, plan content calendars, and stay consistent." },
            ].map(({ icon, label, body }) => (
              <div key={label} style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "12px", padding: "20px" }}>
                <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>{icon}</div>
                <h3 style={{ fontFamily: CG, fontSize: "1.05rem", fontWeight: 600, color: NAVY, marginBottom: "6px" }}>{label}</h3>
                <p style={{ fontFamily: MT, color: GRAY, fontSize: "0.82rem", lineHeight: 1.65 }}>{body}</p>
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
              { num: "1", title: "Tell Us About Your Business", body: "Fill out the short form below. Tell us your business type, your brand voice, what AI tool you're using, and the tasks where you most need help." },
              { num: "2", title: "We Write Your Prompts", body: "We study your business and write 5-6 prompts built specifically for your situation — not generic templates pulled from a library." },
              { num: "3", title: "Use Them Immediately", body: "Your kit arrives within 48 hours with instructions for each prompt. Copy, paste, and start saving time the same day." },
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
            Get Your AI Starter Kit
          </h2>
          <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, textAlign: "center", marginBottom: "40px", lineHeight: 1.7 }}>
            Answer a few questions about your business and we&rsquo;ll write prompts that actually fit how you work. Delivered in 48 hours.
          </p>

          <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

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

            <div style={{ backgroundColor: WHITE, border: "1px solid #E5E7EB", borderRadius: "16px", padding: "32px" }}>
              <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700, marginBottom: "20px" }}>
                About Your Business
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <Field id="q1" label="1. What is your business name and what do you do?" required
                  placeholder="e.g. Anchor Coffee Co. — we run a specialty coffee shop and roastery in Bradley Beach, NJ." rows={2} />
                <Field id="q2" label="2. Where are you located and who are your customers?" required
                  placeholder="e.g. Bradley Beach, NJ. Our customers are mostly locals, 25-50, who value quality and community. Tourists in summer." rows={2} />
                <Field id="q3" label="3. What AI tool are you planning to use?" required
                  hint="e.g. ChatGPT, Claude, Gemini, Copilot, or other."
                  placeholder="e.g. ChatGPT — I have a Plus subscription and have tried it a few times but don't know how to get good results." />
                <Field id="q4" label="4. What are the top 3 tasks you want AI to help you with?" required
                  hint="e.g. writing social posts, responding to reviews, drafting emails, creating promotions, writing product descriptions."
                  placeholder="e.g. 1. Instagram captions that sound like us, 2. Responding to Google reviews professionally, 3. Monthly email newsletter drafts." rows={3} />
                <Field id="q5" label="5. What is the tone of your brand?" required
                  hint="How do you sound when you talk to customers? Friendly and casual? Professional? Local and personal? Something else?"
                  placeholder="e.g. Warm and local. We know most of our regulars by name. We're not corporate at all — we want to sound like a person, not a brand." rows={2} />
                <Field id="q6" label="6. Anything specific about your business or customers we should know when writing your prompts?"
                  hint="Seasonal business? Specific sensitivities? Things you never want to say? Anything that would help us get the tone exactly right."
                  placeholder="e.g. We're very community-focused and never do aggressive sales language. We also have a lot of dog owners as customers — that's a big part of our identity." rows={3} />
              </div>
            </div>

            <div style={{ textAlign: "center" }}>
              <button type="submit" style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "none", cursor: "pointer", letterSpacing: "0.02em" }}>
                Proceed to Payment — $99
              </button>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>
                Flat fee. Delivered within 48 hours. Includes one round of revisions.
              </p>
            </div>

          </form>
        </div>
      </section>

      {/* ── ADD-ON NOTE ── */}
      <section style={{ backgroundColor: WHITE, padding: "40px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: MT, fontSize: "0.88rem", color: GRAY, maxWidth: "520px", margin: "0 auto", lineHeight: 1.7 }}>
          Already purchasing another service?{" "}
          <Link href="/contact" style={{ color: NAVY, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>
            Contact us
          </Link>
          {" "}to add the AI Starter Kit for just $79.
        </p>
      </section>

      <SiteFooter />
    </div>
  );
}
