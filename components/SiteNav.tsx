"use client";

import { useState } from "react";
import Link from "next/link";

const SAND = "#F4EADA";
const NAVY = "#0A2F61";
const TEAL = "#00CED1";

const NAV_LINKS = [
  { label: "Services", href: "/services" },
  { label: "Bundles",  href: "/bundles"  },
  { label: "About",    href: "/about"    },
  { label: "Contact",  href: "/contact"  },
];

export default function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header
        style={{
          backgroundColor: NAVY,
          padding: "8px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(244,234,218,0.15)",
          position: "relative",
          zIndex: 40,
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ flexShrink: 0, lineHeight: 0 }} onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/seaglass_transparent.png"
            alt="Sea Glass Insights"
            style={{ height: "44px", width: "auto", display: "block" }}
          />
        </Link>

        {/* Desktop nav — hidden on small screens */}
        <nav className="hidden md:flex" style={{ alignItems: "center", gap: "28px" }}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "0.85rem", fontWeight: 500, color: SAND, textDecoration: "none", letterSpacing: "0.01em" }}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/services"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "0.85rem", backgroundColor: "transparent", color: "#FFFFFF", textDecoration: "none", padding: "7px 20px", borderRadius: "9999px", letterSpacing: "0.02em", whiteSpace: "nowrap", border: "1.5px solid #FFFFFF" }}
          >
            Get Started
          </Link>
        </nav>

        {/* Hamburger button — visible on small screens only */}
        <button
          className="flex md:hidden"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{ background: "none", border: "none", cursor: "pointer", padding: "4px", alignItems: "center", justifyContent: "center" }}
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6L18 18M6 18L18 6" stroke={SAND} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 6H20M4 12H20M4 18H20" stroke={SAND} strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
      </header>

      {/* Mobile menu dropdown */}
      {open && (
        <div
          className="md:hidden"
          style={{
            position: "fixed",
            top: "61px",
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: NAVY,
            zIndex: 39,
            display: "flex",
            flexDirection: "column",
            padding: "32px 24px",
            gap: "8px",
            overflowY: "auto",
          }}
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ fontFamily: "'Montserrat', sans-serif", fontSize: "1.1rem", fontWeight: 500, color: SAND, textDecoration: "none", padding: "14px 0", borderBottom: "1px solid rgba(244,234,218,0.15)", display: "block" }}
            >
              {label}
            </Link>
          ))}
          <div style={{ marginTop: "24px" }}>
            <Link
              href="/services"
              onClick={() => setOpen(false)}
              style={{ display: "block", textAlign: "center", backgroundColor: TEAL, color: NAVY, fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: "1rem", padding: "14px 32px", borderRadius: "9999px", textDecoration: "none", letterSpacing: "0.02em" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
