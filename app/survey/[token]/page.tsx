"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { VocQuestion } from "@/lib/vocTypes";

type FormState = "loading" | "ready" | "completed_already" | "submitted" | "error";

export default function SurveyPage() {
  const params = useParams();
  const token  = params?.token as string | undefined;

  const [state,        setState]       = useState<FormState>("loading");
  const [contactName,  setContactName] = useState<string | null>(null);
  const [businessName, setBizName]     = useState("");
  const [questions,    setQuestions]   = useState<VocQuestion[]>([]);
  const [responses,    setResponses]   = useState<Record<string, string>>({});
  const [submitting,   setSubmitting]  = useState(false);
  const [errorMsg,     setErrorMsg]    = useState("");

  useEffect(() => {
    if (!token) { setState("error"); return; }
    fetch(`/api/voc/survey-form?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error)     { setState("error"); setErrorMsg(data.error); return; }
        if (data.completed) { setState("completed_already"); setContactName(data.contactName); return; }
        setContactName(data.contactName);
        setBizName(data.businessName ?? "");
        setQuestions(data.questions ?? []);
        setState("ready");
      })
      .catch(() => { setState("error"); setErrorMsg("Could not load survey. Please check your link and try again."); });
  }, [token]);

  function setResponse(qId: string, value: string) {
    setResponses(prev => ({ ...prev, [qId]: value }));
  }

  function toggleMulti(qId: string, option: string) {
    const current = responses[qId] ?? "";
    const parts   = current ? current.split("|||") : [];
    const idx     = parts.indexOf(option);
    if (idx >= 0) parts.splice(idx, 1);
    else parts.push(option);
    setResponses(prev => ({ ...prev, [qId]: parts.join("|||") }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/voc/submit-response", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, responses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed");
      setState("submitted");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  }

  // ── Renders ──────────────────────────────────────────────────────────────────

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-navy">
          <div className="w-5 h-5 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading your survey…</span>
        </div>
      </div>
    );
  }

  if (state === "completed_already") {
    return (
      <SurveyShell businessName="">
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-navy text-2xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Already Submitted
          </h2>
          <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
            {contactName ? `Thanks ${contactName} — you` : "You"}&apos;ve already completed this survey. Your responses have been recorded.
          </p>
        </div>
      </SurveyShell>
    );
  }

  if (state === "submitted") {
    return (
      <SurveyShell businessName={businessName}>
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-navy text-2xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Thank you{contactName ? `, ${contactName}` : ""}!
          </h2>
          <p className="text-gray-500 text-base max-w-sm mx-auto leading-relaxed">
            Your feedback for {businessName} has been submitted. We appreciate you taking the time to share your thoughts.
          </p>
        </div>
      </SurveyShell>
    );
  }

  if (state === "error") {
    return (
      <SurveyShell businessName="">
        <div className="text-center py-16 px-6">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-navy text-xl font-bold mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Link Not Found
          </h2>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            {errorMsg || "This survey link appears to be invalid or expired."}
          </p>
        </div>
      </SurveyShell>
    );
  }

  // ── Ready: render form ─────────────────────────────────────────────────────

  return (
    <SurveyShell businessName={businessName}>
      <div className="px-6 pb-12">
        {/* Intro */}
        <div className="mb-8">
          <h1 className="text-navy text-2xl font-bold mb-2" style={{ fontFamily: "Georgia, serif" }}>
            {contactName ? `Hi ${contactName},` : "We'd love your feedback"}
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            {businessName} has partnered with Sea Glass Insights to understand your experience better. Your honest responses are confidential and help shape how they serve you.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {questions.map((q, idx) => (
            <QuestionField
              key={q.id}
              q={q}
              idx={idx}
              value={responses[q.id] ?? ""}
              onChange={val => setResponse(q.id, val)}
              onToggle={opt => toggleMulti(q.id, opt)}
            />
          ))}

          {errorMsg && !submitting && (
            <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-navy text-white font-semibold py-3.5 rounded-full text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Responses"}
          </button>

          <p className="text-center text-xs text-gray-400 leading-relaxed">
            Your responses are confidential and will only be shared in aggregate form with {businessName}.
          </p>
        </form>
      </div>
    </SurveyShell>
  );
}

// ── Survey Shell ───────────────────────────────────────────────────────────────

function SurveyShell({ businessName, children }: { businessName: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <header className="bg-navy py-4 px-6">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <p className="text-seafoam font-bold text-base tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Sea Glass Insights
            </p>
            {businessName && (
              <p className="text-blue-200 text-xs mt-0.5">Customer Survey — {businessName}</p>
            )}
          </div>
          <div className="w-8 h-8 rounded-full bg-seafoam/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#5AC8C8" strokeWidth="2">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
        </div>
      </header>

      {/* Card */}
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Teal accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-seafoam to-teal-400" />
          <div className="pt-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Question Field ────────────────────────────────────────────────────────────

function QuestionField({
  q, idx, value, onChange, onToggle
}: {
  q:        VocQuestion;
  idx:      number;
  value:    string;
  onChange: (v: string) => void;
  onToggle: (opt: string) => void;
}) {
  const selected = value ? value.split("|||") : [];

  return (
    <div className="border-t border-gray-100 pt-6 first:border-0 first:pt-0">
      <label className="block mb-3">
        <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          Q{idx + 1}
        </span>
        <p className="mt-2 text-navy font-semibold text-[15px] leading-snug" style={{ fontFamily: "Georgia, serif" }}>
          {q.text}
        </p>
      </label>

      {/* Scale 1-7 */}
      {q.type === "scale_1_7" && (
        <div>
          <div className="flex gap-2 flex-wrap">
            {[1,2,3,4,5,6,7].map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onChange(String(n))}
                className={`w-11 h-11 rounded-full border-2 text-sm font-bold transition-colors ${
                  value === String(n)
                    ? "border-teal-500 bg-teal-500 text-white"
                    : "border-gray-200 text-gray-600 hover:border-teal-300"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400 px-1">
            <span>Not at all</span>
            <span>Extremely</span>
          </div>
        </div>
      )}

      {/* Multiple choice */}
      {q.type === "multiple_choice" && (
        <div className="space-y-2.5">
          {q.options.map(opt => (
            <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
              value === opt ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-gray-300"
            }`}>
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                value === opt ? "border-teal-500 bg-teal-500" : "border-gray-300"
              }`}>
                {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <input type="radio" className="sr-only" checked={value === opt} onChange={() => onChange(opt)} />
              <span className="text-sm text-gray-700">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* Select all */}
      {q.type === "select_all" && (
        <div className="space-y-2.5">
          {q.options.map(opt => {
            const checked = selected.includes(opt);
            return (
              <label key={opt} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                checked ? "border-teal-400 bg-teal-50" : "border-gray-200 hover:border-gray-300"
              }`}>
                <div className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center transition-colors ${
                  checked ? "border-teal-500 bg-teal-500" : "border-gray-300"
                }`}>
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </div>
                <input type="checkbox" className="sr-only" checked={checked} onChange={() => onToggle(opt)} />
                <span className="text-sm text-gray-700">{opt}</span>
              </label>
            );
          })}
          <p className="text-xs text-gray-400 mt-1">Select all that apply.</p>
        </div>
      )}

      {/* Open ended */}
      {q.type === "open_ended" && (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Your response…"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 resize-y placeholder-gray-300"
        />
      )}
    </div>
  );
}
