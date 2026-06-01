"use client";

import { useState } from "react";
import Link from "next/link";
import SiteNav    from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

const SAND  = "#F4EADA";
const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const GRAY  = "#6B7280";
const WHITE = "#FFFFFF";

const inp  = { width: "100%", border: "1px solid #D1D5DB", borderRadius: "8px", padding: "10px 14px", fontSize: "0.93rem", color: "#111", fontFamily: "'Montserrat', sans-serif", outline: "none", boxSizing: "border-box" as const };
const lbl  = { display: "block" as const, fontFamily: "'Montserrat', sans-serif", fontSize: "0.75rem", fontWeight: 600, color: GRAY, textTransform: "uppercase" as const, letterSpacing: "0.07em", marginBottom: "6px" };

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", businessName: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  function set(k: keyof typeof form, v: string) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");
    try {
      const res  = await fetch("/api/contact", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send message.");
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div style={{ backgroundColor: WHITE, minHeight: "100vh", fontFamily: "'Montserrat', sans-serif" }}>
      <SiteNav />

      {/* HERO */}
      <section style={{ backgroundColor: NAVY, textAlign: "center", padding: "64px 24px 72px" }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 700, color: WHITE, marginBottom: "16px" }}>
          Let&rsquo;s talk about your business.
        </h1>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.95rem", color: "#CBD5E1", maxWidth: "500px", margin: "0 auto", lineHeight: 1.8 }}>
          Have a question about a service, want a recommendation, or ready to get started? Reach out directly.
        </p>
      </section>

      {/* CONTENT */}
      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "72px 24px 80px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start" }}>

        {/* FORM */}
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: NAVY, marginBottom: "28px" }}>
            Send a Message
          </h2>

          {status === "sent" ? (
            <div style={{ backgroundColor: SAND, borderRadius: "12px", padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: "2rem", marginBottom: "12px" }}>✓</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.3rem", color: NAVY, marginBottom: "10px" }}>
                Message sent!
              </h3>
              <p style={{ fontSize: "0.88rem", color: GRAY, lineHeight: 1.7 }}>
                Thank you, {form.name}. I&rsquo;ll be in touch soon.
              </p>
            </div>
          ) : (
            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label style={lbl}>Name <span style={{ color: "#EF4444" }}>*</span></label>
                  <input style={inp} required value={form.name} onChange={e => set("name", e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label style={lbl}>Business Name <span style={{ color: "#EF4444" }}>*</span></label>
                  <input style={inp} required value={form.businessName} onChange={e => set("businessName", e.target.value)} placeholder="Your business" />
                </div>
              </div>
              <div>
                <label style={lbl}>Email <span style={{ color: "#EF4444" }}>*</span></label>
                <input type="email" style={inp} required value={form.email} onChange={e => set("email", e.target.value)} placeholder="you@example.com" />
              </div>
              <div>
                <label style={lbl}>Phone <span style={{ color: GRAY, fontWeight: 400, textTransform: "none" }}>(optional)</span></label>
                <input type="tel" style={inp} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="(732) 555-0100" />
              </div>
              <div>
                <label style={lbl}>Message <span style={{ color: "#EF4444" }}>*</span></label>
                <textarea
                  style={{ ...inp, minHeight: "140px", resize: "vertical" }}
                  required
                  value={form.message}
                  onChange={e => set("message", e.target.value)}
                  placeholder="Tell me a bit about your business and what you're looking for..."
                />
              </div>

              {status === "error" && (
                <p style={{ color: "#DC2626", fontSize: "0.85rem" }}>{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "sending"}
                style={{
                  backgroundColor: status === "sending" ? "#93C5FD" : TEAL,
                  color: NAVY,
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.95rem",
                  padding: "13px 32px",
                  borderRadius: "9999px",
                  border: "none",
                  cursor: status === "sending" ? "not-allowed" : "pointer",
                  width: "100%",
                  letterSpacing: "0.02em",
                }}
              >
                {status === "sending" ? "Sending…" : "Send Message"}
              </button>
            </form>
          )}
        </div>

        {/* CONTACT INFO */}
        <div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", fontWeight: 700, color: NAVY, marginBottom: "28px" }}>
            Direct Contact
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { icon: "✉", label: "Email", val: "john@seaglassinsights.com", href: "mailto:john@seaglassinsights.com" },
              { icon: "📞", label: "Phone", val: "(732) 518-3898", href: "tel:+17325183898" },
              { icon: "📍", label: "Location", val: "Bradley Beach, NJ", href: null },
            ].map(({ icon, label, val, href }) => (
              <div key={label} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                <span style={{ fontSize: "1.1rem", marginTop: "1px" }}>{icon}</span>
                <div>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.72rem", fontWeight: 600, color: GRAY, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "4px" }}>{label}</p>
                  {href ? (
                    <a href={href} style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.93rem", color: NAVY, textDecoration: "underline", textUnderlineOffset: "3px" }}>{val}</a>
                  ) : (
                    <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.93rem", color: NAVY }}>{val}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>

      </main>

      <SiteFooter />
    </div>
  );
}
