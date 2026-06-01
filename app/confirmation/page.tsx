"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const NAVY = "#0A2F61";
const TEAL = "#00CED1";
const MT   = "'Montserrat', system-ui, sans-serif";

// ── File Upload component — shown only for voice-of-customer orders ───────────

function ContactListUpload({ orderId }: { orderId: string }) {
  const [file, setFile]       = useState<File | null>(null);
  const [status, setStatus]   = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errMsg, setErrMsg]   = useState<string | null>(null);
  const inputRef              = useRef<HTMLInputElement>(null);

  async function upload() {
    if (!file) return;
    setStatus("uploading");
    setErrMsg(null);
    try {
      const fd = new FormData();
      fd.append("orderId", orderId);
      fd.append("file", file);
      const res  = await fetch("/api/upload-contact-list", { method: "POST", body: fd });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrMsg(err instanceof Error ? err.message : "Upload failed. Please try again.");
    }
  }

  if (status === "done") {
    return (
      <div className="rounded-xl p-5 text-center" style={{ backgroundColor: "#F0FDF4", border: "1px solid #86EFAC" }}>
        <p className="text-green-700 font-semibold text-sm mb-1">Contact list uploaded successfully.</p>
        <p className="text-green-600 text-xs">We&rsquo;ve got your list and will be in touch with next steps.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 p-6 bg-white">
      <h3 className="text-navy font-bold text-base mb-1" style={{ fontFamily: "Georgia, serif" }}>
        Upload Your Customer Contact List
      </h3>
      <p className="text-gray-500 text-sm mb-4 leading-relaxed">
        Upload your contact list below so we can send your survey. Accepted formats: CSV, XLS, XLSX. Maximum file size: 10 MB.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xls,.xlsx"
        onChange={e => { setFile(e.target.files?.[0] ?? null); setErrMsg(null); }}
        className="hidden"
      />

      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-seafoam transition-colors mb-4"
        onClick={() => inputRef.current?.click()}
      >
        {file ? (
          <div>
            <p className="text-navy font-medium text-sm">{file.name}</p>
            <p className="text-gray-400 text-xs mt-1">{(file.size / 1024).toFixed(0)} KB — click to change</p>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 text-sm">Click to select your file</p>
            <p className="text-gray-400 text-xs mt-1">CSV, XLS, or XLSX · Max 10 MB</p>
          </div>
        )}
      </div>

      {errMsg && <p className="text-red-500 text-xs mb-3">{errMsg}</p>}

      <button
        onClick={upload}
        disabled={!file || status === "uploading"}
        className="w-full py-2.5 rounded-full text-sm font-semibold transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ backgroundColor: TEAL, color: NAVY, fontFamily: MT }}
      >
        {status === "uploading" ? "Uploading…" : "Upload Contact List"}
      </button>

      <p className="text-gray-400 text-xs text-center mt-3 leading-relaxed">
        Can&rsquo;t upload right now? Email your list directly to{" "}
        <a href="mailto:john@seaglassinsights.com" className="underline text-gray-500">
          john@seaglassinsights.com
        </a>{" "}
        and reference your order.
      </p>
    </div>
  );
}

// ── Confirmation page ─────────────────────────────────────────────────────────

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId    = searchParams.get("session_id");

  const [orderId,  setOrderId]  = useState<string | null>(null);
  const [service,  setService]  = useState<string | null>(null);
  const [timeline, setTimeline] = useState("Within 48–72 hours");

  useEffect(() => {
    if (!sessionId) return;
    fetch(`/api/order-by-session?sessionId=${encodeURIComponent(sessionId)}`)
      .then(r => r.json())
      .then((data: { id?: string; analyst_note?: string }) => {
        if (data.id) setOrderId(data.id);
        if (data.analyst_note) {
          const svc = data.analyst_note.split("|")[0].trim();
          setService(svc);
          if (svc === "voice-of-customer")    setTimeline("Within 1-2 weeks of receiving your contact list");
          if (svc === "secret-shopping")      setTimeline("Within 5-7 days of the shop visit");
          if (svc === "deep-dive-report")     setTimeline("Within 5-7 days");
        }
      })
      .catch(() => {/* non-blocking */});
  }, [sessionId]);

  const isVoC = service === "voice-of-customer";

  return (
    <div className="flex flex-col min-h-full">
      {/* Nav */}
      <header className="bg-navy text-white px-6 py-4">
        <Link href="/" style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold tracking-wide">
          Sea Glass Insights
        </Link>
      </header>

      {/* Main */}
      <main className="flex-1 bg-sand flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl shadow border border-gray-100 p-10 w-full" style={{ maxWidth: isVoC ? "640px" : "520px" }}>

          {/* Check icon */}
          <div className="w-16 h-16 rounded-full bg-seagreen flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-navy text-3xl font-bold mb-3 text-center" style={{ fontFamily: "Georgia, serif" }}>
            {isVoC ? "Payment confirmed." : "You're all set."}
          </h1>
          <p className="text-gray-600 text-base mb-6 leading-relaxed text-center">
            {isVoC
              ? "Your Voice of Customer Survey order is confirmed. Upload your contact list below to get started."
              : "Your payment was received and your order is confirmed. John Messina will review your intake and get to work on your report."}
          </p>

          {/* Contact list upload — VoC only */}
          {isVoC && orderId && (
            <div className="mb-6">
              <ContactListUpload orderId={orderId} />
            </div>
          )}

          {/* Timeline */}
          <div className="bg-sand rounded-xl px-6 py-5 text-left mb-8 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-navy">Right now</span> — A confirmation email is on its way to your inbox.
              </p>
            </div>
            {isVoC && (
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
                <p className="text-sm text-gray-600">
                  <span className="font-semibold text-navy">Next</span> — Upload your customer contact list above. We&rsquo;ll confirm receipt and follow up with timeline details.
                </p>
              </div>
            )}
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-navy">{timeline}</span>{" "}
                — Your{" "}
                {isVoC ? "visual findings report" : "report"}{" "}
                will be delivered to your email.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-seafoam mt-2 shrink-0" />
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-navy">Questions?</span> — Reply to your confirmation email or reach out at{" "}
                <a href="mailto:john@seaglassinsights.com" className="text-seafoam underline">
                  john@seaglassinsights.com
                </a>
              </p>
            </div>
          </div>

          <Link href="/" className="block text-center text-navy text-sm font-semibold underline underline-offset-2 hover:text-navy-dark">
            ← Back to Sea Glass Insights
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-navy text-blue-300 text-center text-sm py-6 px-6">
        <p className="font-semibold text-white mb-1" style={{ fontFamily: "Georgia, serif" }}>Sea Glass Insights</p>
        <p>Refining the Edge. &copy; {new Date().getFullYear()} Sea Glass Insights. All rights reserved.</p>
      </footer>
    </div>
  );
}

// useSearchParams() requires a Suspense boundary in Next.js App Router.
// ConfirmationContent is the inner component that calls it; the default
// export wraps it so the page can be statically pre-rendered.
export default function ConfirmationPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-full">
        <header className="bg-navy text-white px-6 py-4">
          <span style={{ fontFamily: "Georgia, serif" }} className="text-xl font-bold tracking-wide">Sea Glass Insights</span>
        </header>
        <main className="flex-1 bg-sand flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-seafoam border-t-transparent rounded-full animate-spin" />
        </main>
      </div>
    }>
      <ConfirmationContent />
    </Suspense>
  );
}
