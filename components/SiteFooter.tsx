import Link from "next/link";

const NAVY  = "#0A2F61";
const TEAL  = "#00CED1";
const WHITE = "#FFFFFF";

const LINKS = [
  { label: "Services",       href: "/services" },
  { label: "About",          href: "/about"    },
  { label: "Contact",        href: "/contact"  },
  { label: "Privacy Policy", href: "/privacy"  },
];

export default function SiteFooter() {
  return (
    <footer
      style={{
        backgroundColor: NAVY,
        color: "#93C5FD",
        textAlign: "center",
        padding: "48px 24px",
      }}
    >
      <p
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: "1.15rem",
          fontWeight: 600,
          color: WHITE,
          marginBottom: "8px",
        }}
      >
        Sea Glass Insights
      </p>
      <p
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.8rem",
          marginBottom: "6px",
        }}
      >
        John Messina, Founder &nbsp;|&nbsp; Bradley Beach, NJ &nbsp;|&nbsp; seaglassinsights.com
      </p>
      <p
        style={{
          fontFamily: "'Montserrat', sans-serif",
          fontSize: "0.78rem",
          marginBottom: "20px",
          color: "rgba(147,197,253,0.6)",
        }}
      >
        &copy; 2026 Sea Glass Insights LLC. All rights reserved.
      </p>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: "6px 20px",
        }}
      >
        {LINKS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontSize: "0.77rem",
              color: "#93C5FD",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            {label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
