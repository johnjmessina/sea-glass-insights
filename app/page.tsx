import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-full">
      {/* ── Nav ── */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
            Sea Glass Insights
          </span>
          <span className="ml-3 text-seafoam text-sm hidden sm:inline">
            Refining the Edge.
          </span>
        </div>
        <Link
          href="/get-report"
          className="bg-seafoam text-navy font-semibold text-sm px-4 py-2 rounded-full hover:bg-seafoam-dark transition-colors"
        >
          Get Your Report
        </Link>
      </header>

      {/* ── Hero ── */}
      <section className="bg-navy text-white text-center px-6 py-24">
        <p className="text-seafoam text-sm font-semibold uppercase tracking-widest mb-4">
          Premium Market Research
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold leading-tight max-w-2xl mx-auto mb-6">
          Know your market.<br />Own your edge.
        </h1>
        <p className="text-blue-200 text-lg max-w-xl mx-auto mb-10">
          A professionally written, analyst-reviewed market research report
          tailored to your small business — delivered in 48–72 hours.
        </p>
        <Link
          href="/get-report"
          className="inline-block bg-seafoam text-navy font-bold text-lg px-8 py-4 rounded-full hover:bg-seafoam-dark transition-colors"
        >
          Order Your Report — $149
        </Link>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-navy text-center mb-12">
          How It Works
        </h2>
        <div className="grid sm:grid-cols-3 gap-10 text-center">
          {[
            {
              step: "1",
              title: "Tell Us About Your Business",
              desc: "Answer 10 focused questions about your market, customers, and competitors. Takes about 15 minutes.",
            },
            {
              step: "2",
              title: "We Get to Work",
              desc: "Our analyst reviews your intake and produces a custom report with real insights — not generic advice.",
            },
            {
              step: "3",
              title: "Receive Your Report",
              desc: "A branded, professionally written PDF lands in your inbox within 48–72 hours. Ready to act on.",
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center text-xl font-bold mb-4">
                {step}
              </div>
              <h3 className="text-navy font-semibold text-lg mb-2">{title}</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What's in the report ── */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-navy text-center mb-12">
            What's Inside Your Report
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Business Snapshot", desc: "A clear-eyed summary of who you are and what you offer." },
              { title: "Customer Profile", desc: "3–4 distinct customer segments with motivations and spend patterns." },
              { title: "Competitive Landscape", desc: "An honest look at your competitors and where you have the edge." },
              { title: "Market Positioning", desc: "Your strengths, vulnerabilities, and how to play to both." },
              { title: "Key Insights", desc: "4–5 analyst insights — the 'so what' that most businesses miss." },
              { title: "Recommendations", desc: "Exactly 4 actions, ranked by impact and feasibility. Move fast." },
            ].map(({ title, desc }) => (
              <div
                key={title}
                className="border border-gray-200 rounded-xl p-6 hover:border-seafoam transition-colors"
              >
                <div className="w-2 h-6 bg-seafoam rounded mb-3" />
                <h3 className="text-navy font-semibold text-base mb-1">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-seagreen text-white text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-4">Ready to refine your edge?</h2>
        <p className="text-green-100 text-lg mb-8 max-w-md mx-auto">
          One flat fee. No subscriptions. A report written by a real analyst who read every word you submitted.
        </p>
        <Link
          href="/get-report"
          className="inline-block bg-white text-seagreen font-bold text-lg px-8 py-4 rounded-full hover:bg-sand transition-colors"
        >
          Start Your Report — $149
        </Link>
      </section>

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
