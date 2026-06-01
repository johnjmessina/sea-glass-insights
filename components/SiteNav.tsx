import Link from "next/link";

const SAND = "#F4EADA";
const NAVY = "#0A2F61";
const GRAY = "#6B7280";

export default function SiteNav() {
  return (
    <header
      style={{
        backgroundColor: SAND,
        padding: "18px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(10,47,97,0.06)",
      }}
    >
      <Link href="/" style={{ flexShrink: 0, lineHeight: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logos/logo_transparent_FINAL.png"
          alt="Sea Glass Insights"
          style={{ height: "40px", width: "auto", display: "block" }}
        />
      </Link>

      <nav
        style={{
          display: "flex",
          alignItems: "center",
          gap: "28px",
        }}
      >
        {[
          { label: "Services", href: "/services" },
          { label: "Bundles",  href: "/bundles"  },
          { label: "About",    href: "/about"    },
          { label: "Contact",  href: "/contact"  },
        ].map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: GRAY,
              textDecoration: "none",
              letterSpacing: "0.01em",
            }}
          >
            {label}
          </Link>
        ))}

        <Link
          href="/services"
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            color: NAVY,
            textDecoration: "none",
            border: `1.5px solid ${NAVY}`,
            padding: "7px 20px",
            borderRadius: "9999px",
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
          }}
        >
          Get Started
        </Link>
      </nav>
    </header>
  );
}
