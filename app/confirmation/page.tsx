import Link from "next/link";

export default function ConfirmationPage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* ── Nav ── */}
      <header className="bg-navy text-white px-6 py-4">
        <Link href="/" style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold tracking-wide">
          Sea Glass Insights
        </Link>
      </header>

      {/* ── Confirmation card ── */}
      <main className="flex-1 bg-sand flex items-center justify-center px-4 py-20">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-12 text-center max-w-lg w-full">
          {/* Check icon */}
          <div className="w-16 h-16 rounded-full bg-seagreen flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1
            className="text-navy text-3xl font-bold mb-3"
            style={{ fontFamily: "Georgia, serif" }}
          >
            You're all set.
          </h1>
          <p className="text-gray-600 text-base mb-6 leading-relaxed">
            Your payment was received and your order is confirmed. John Messina
            will review your intake and get to work on your report.
          </p>

          {/* Timeline */}
          <div className="bg-sand rounded-xl px-6 py-5 text-left mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-navy">Right now</span> — A
                confirmation email is on its way to your inbox.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-navy">Within 48–72 hours</span>{" "}
                — Your custom market research report will be delivered to your
                email as a branded PDF.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-navy">Questions?</span> — Reply
                to your confirmation email or reach out at{" "}
                <a
                  href="mailto:john@seaglassinsights.com"
                  className="text-seafoam underline"
                >
                  john@seaglassinsights.com
                </a>
              </p>
            </div>
          </div>

          <Link
            href="/"
            className="inline-block text-navy text-sm font-semibold underline underline-offset-2 hover:text-navy-dark"
          >
            ← Back to Sea Glass Insights
          </Link>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy text-blue-300 text-center text-sm py-6 px-6">
        <p className="font-semibold text-white mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Sea Glass Insights
        </p>
        <p>Refining the Edge. &copy; {new Date().getFullYear()} Sea Glass Insights. All rights reserved.</p>
      </footer>
    </div>
  );
}
