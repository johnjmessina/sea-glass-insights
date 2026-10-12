"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import ServiceFormField from "@/components/ServiceFormField";

const CG = "'Cormorant Garamond', Georgia, serif";
const MT = "'Montserrat', system-ui, sans-serif";
const NAVY = "#0A2F61"; const TEAL = "#00CED1"; const SAND = "#F4EADA";
const GRAY = "#6B7280"; const LGRAY = "#9CA3AF"; const WHITE = "#FFFFFF";

function validateEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e); }

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}>
      <path d="M5 7.5L10 12.5L15 7.5" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Shared simple contact form ────────────────────────────────────────────────

interface ContactFields { customerName: string; email: string; businessName: string; }
type ContactErrors = Partial<Record<keyof ContactFields, string>>;

function useContactForm(service: string) {
  const router = useRouter();
  const [fields, setFields] = useState<ContactFields>({ customerName: "", email: "", businessName: "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function setField(f: keyof ContactFields, v: string) {
    setFields(p => ({ ...p, [f]: v }));
    setErrors(p => { const n = { ...p }; delete n[f]; return n; });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const errs: ContactErrors = {};
    if (!fields.customerName.trim()) errs.customerName = "Required.";
    if (!fields.email.trim()) errs.email = "Required.";
    else if (!validateEmail(fields.email)) errs.email = "Please enter a valid email.";
    if (!fields.businessName.trim()) errs.businessName = "Required.";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    sessionStorage.setItem("sgi_intake", JSON.stringify({ service, ...fields }));
    router.push("/checkout");
  }

  return { fields, errors, submitting, setField, handleSubmit };
}

// ── Bundle config ─────────────────────────────────────────────────────────────

const BUNDLES = [
  {
    id: "starter-intelligence",
    name: "Starter Intelligence",
    price: "$349",
    save: "save $49",
    includes: "Market Intelligence Report + Social Media Audit",
    description: "Understand your market and see exactly how your social presence stacks up against it. The essential starting point for any small business ready to compete.",
    services: [
      { name: "Market Intelligence Report", retail: "$199" },
      { name: "Social Media Audit", retail: "$199" },
    ],
    note: "Both deliverables included. Flat fee.",
  },
  {
    id: "the-field-report",
    name: "The Field Report",
    price: "$449",
    save: "save $49",
    includes: "Market Intelligence Report + Secret Shopping",
    description: "Know your market from the outside and your customer experience from the inside. Market intelligence meets boots-on-the-ground research.",
    services: [
      { name: "Market Intelligence Report", retail: "$199" },
      { name: "Secret Shopping", retail: "$299" },
    ],
    note: "Secret Shopping available on the coast. Flat fee.",
  },
  {
    id: "market-and-mind",
    name: "Market & Mind",
    price: "$499",
    save: "save $99",
    includes: "Market Intelligence Report + Synthetic Customer Profiles",
    description: "Understand your market and your customer without needing an existing contact list. Two research streams working together to give you the full picture.",
    services: [
      { name: "Market Intelligence Report", retail: "$199" },
      { name: "Synthetic Customer Profiles", retail: "$399" },
    ],
    note: "Flat fee.",
  },
  {
    id: "the-deep-field",
    name: "The Deep Field",
    price: "$599",
    save: "save $99",
    includes: "Deep Dive Report + Secret Shopping",
    description: "Know your competitive landscape in depth and your customer experience from the inside. The most complete picture of your market position available.",
    services: [
      { name: "Deep Dive Report", retail: "$399" },
      { name: "Secret Shopping", retail: "$299" },
    ],
    note: "Secret Shopping available on the coast. Flat fee.",
  },
  {
    id: "complete-shopper-experience",
    name: "Complete Shopper Experience",
    price: "$699",
    save: "save $99",
    includes: "Secret Shopping + Voice of Customer Survey",
    description: "See what your customers experience walking through your door, then hear what they actually think. The most complete view of your customer experience available.",
    services: [
      { name: "Secret Shopping", retail: "$299" },
      { name: "Voice of Customer Survey", retail: "$499" },
    ],
    note: "Secret Shopping available on the coast. Flat fee.",
  },
];

// ── Bundle section ────────────────────────────────────────────────────────────

function BundleSection({ bundle, expanded, onToggle }: {
  bundle: typeof BUNDLES[0];
  expanded: boolean;
  onToggle: () => void;
}) {
  const { fields, errors, submitting, setField, handleSubmit } = useContactForm(bundle.id);

  const card = {
    backgroundColor: WHITE,
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    padding: "32px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  };

  return (
    <div id={bundle.id} style={{ scrollMarginTop: "120px" }}>
      <div style={{ border: "1px solid #E5E7EB", borderTop: `3px solid ${TEAL}`, backgroundColor: WHITE, borderRadius: "16px", overflow: "hidden" }}>
        <button
          onClick={onToggle}
          style={{ width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: "28px 32px" }}
          aria-expanded={expanded}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
            <div>
              <h2 style={{ fontFamily: CG, fontSize: "clamp(1.4rem,2.5vw,2rem)", fontWeight: 700, color: NAVY, marginBottom: "4px" }}>{bundle.name}</h2>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "6px" }}>
                <span style={{ fontFamily: MT, fontSize: "1.3rem", fontWeight: 700, color: NAVY }}>{bundle.price}</span>
                <span style={{ fontFamily: MT, fontSize: "0.8rem", fontWeight: 600, color: TEAL }}>{bundle.save}</span>
              </div>
              <p style={{ fontFamily: MT, fontSize: "0.78rem", color: GRAY, marginBottom: "10px" }}>{bundle.includes}</p>
              <p style={{ fontFamily: MT, fontSize: "0.9rem", color: GRAY, lineHeight: 1.75 }}>{bundle.description}</p>
            </div>
            <Chevron open={expanded} />
          </div>
        </button>

        {expanded && (
          <div style={{ padding: "0 32px 32px", borderTop: "1px solid #E5E7EB" }}>
            {/* What's included chips */}
            <div style={{ display: "flex", gap: "12px", margin: "24px 0", flexWrap: "wrap" }}>
              {bundle.services.map(s => (
                <div key={s.name} style={{ border: "1px solid #E5E7EB", borderRadius: "8px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "8px", backgroundColor: WHITE }}>
                  <span style={{ fontFamily: MT, fontSize: "0.82rem", color: NAVY, fontWeight: 500 }}>{s.name}</span>
                  <span style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY }}>{s.retail}</span>
                </div>
              ))}
            </div>

            {/* Contact form — only thing needed before payment */}
            <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={card}>
                <h3 style={{ fontFamily: CG, color: NAVY, fontSize: "1.3rem", fontWeight: 700 }}>Your Contact Information</h3>
                <p style={{ fontFamily: MT, fontSize: "0.85rem", color: GRAY, lineHeight: 1.7, marginTop: "-8px" }}>
                  We&rsquo;ll reach out after payment to collect the details we need to get started.
                </p>
                <ServiceFormField label="Your Name" required placeholder="Jane Smith" value={fields.customerName} error={errors.customerName} onChange={v => setField("customerName", v)} />
                <ServiceFormField label="Email Address" required placeholder="jane@yourbusiness.com" value={fields.email} error={errors.email} onChange={v => setField("email", v)} />
                <ServiceFormField label="Business Name" required placeholder="Acme Coffee Co." value={fields.businessName} error={errors.businessName} onChange={v => setField("businessName", v)} />
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ backgroundColor: "transparent", color: NAVY, fontFamily: MT, fontWeight: 700, fontSize: "1rem", padding: "14px 48px", borderRadius: "9999px", border: "1.5px solid #0A2F61", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1, letterSpacing: "0.02em" }}
                >
                  {submitting ? "Redirecting…" : `Proceed to Payment — ${bundle.price}`}
                </button>
                <p style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, marginTop: "12px" }}>{bundle.note}</p>
              </div>
            </form>

            <div style={{ textAlign: "center", paddingTop: "12px" }}>
              <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                 style={{ fontFamily: MT, fontSize: "0.78rem", color: LGRAY, textDecoration: "none", cursor: "pointer" }}>
                ↑ Back to top
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function BundlesPage() {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    const next = expanded === id ? null : id;
    setExpanded(next);
    if (next !== null) {
      setTimeout(() => {
        const el = document.getElementById(next);
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      }, 50);
    }
  }

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
        {BUNDLES.map(b => (
          <a key={b.id} href={`#${b.id}`} style={{ fontFamily: MT, fontSize: "0.78rem", fontWeight: 500, color: NAVY, textDecoration: "none", padding: "6px 14px", borderRadius: "9999px", border: "1px solid #E5E7EB" }}>{b.name}</a>
        ))}
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "30px 24px", display: "flex", flexDirection: "column", gap: "40px", width: "100%" }}>
        {BUNDLES.map(b => (
          <BundleSection
            key={b.id}
            bundle={b}
            expanded={expanded === b.id}
            onToggle={() => toggle(b.id)}
          />
        ))}
      </div>

      <SiteFooter />
    </div>
  );
}
