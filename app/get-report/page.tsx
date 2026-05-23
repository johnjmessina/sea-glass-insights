"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const QUESTIONS = [
  {
    id: "q1",
    label: "1. What is your business name and what do you sell or offer?",
  },
  {
    id: "q2",
    label: "2. How long have you been in business, and where are you located?",
  },
  {
    id: "q3",
    label:
      "3. Who is your ideal customer? (age, income, lifestyle, problem they have)",
  },
  {
    id: "q4",
    label:
      "4. Who are your top 2–3 competitors? (names, or describe them)",
  },
  {
    id: "q5",
    label: "5. What makes you different from those competitors?",
  },
  {
    id: "q6",
    label: "6. What is the biggest challenge you are facing right now?",
  },
  {
    id: "q7",
    label:
      "7. What does success look like for you in the next 12 months?",
  },
  {
    id: "q8",
    label: "8. What marketing are you currently doing, if any?",
  },
  {
    id: "q9",
    label:
      "9. What do you wish you knew about your market or customers that you don't know today?",
  },
  {
    id: "q10",
    label:
      "10. Is there anything else you want the report to focus on or address?",
  },
];

type FormData = {
  customerName: string;
  businessName: string;
  email: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q8: string;
  q9: string;
  q10: string;
};

const EMPTY: FormData = {
  customerName: "",
  businessName: "",
  email: "",
  q1: "",
  q2: "",
  q3: "",
  q4: "",
  q5: "",
  q6: "",
  q7: "",
  q8: "",
  q9: "",
  q10: "",
};

export default function GetReportPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );
  const [submitted, setSubmitted] = useState(false);

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error as soon as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    (Object.keys(EMPTY) as (keyof FormData)[]).forEach((key) => {
      if (!form[key].trim()) {
        newErrors[key] = "This field is required.";
      }
    });
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (!validate()) {
      // Scroll to first error
      const firstError = document.querySelector("[data-error]");
      firstError?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    // Persist for Stripe checkout (Step 3 will read this)
    sessionStorage.setItem("sgi_intake", JSON.stringify(form));
    router.push("/checkout");
  }

  const inputBase =
    "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
  const inputOk = "border-gray-300 bg-white";
  const inputErr = "border-red-400 bg-red-50";

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Nav ── */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span
            className="text-xl font-bold tracking-wide"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Sea Glass Insights
          </span>
          <span className="text-seafoam text-sm hidden sm:inline">
            Refining the Edge.
          </span>
        </Link>
      </header>

      {/* ── Page header ── */}
      <div className="bg-navy text-white text-center px-6 py-14">
        <p className="text-seafoam text-sm font-semibold uppercase tracking-widest mb-3">
          Step 1 of 2 — Tell Us About Your Business
        </p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          Your Market Research Intake Form
        </h1>
        <p className="text-blue-200 max-w-lg mx-auto text-base">
          Answer each question as thoroughly as you can. The more detail you
          provide, the sharper your report will be. This takes about 15 minutes.
        </p>
      </div>

      {/* ── Form ── */}
      <main className="flex-1 bg-sand px-4 py-12">
        <form
          onSubmit={handleSubmit}
          noValidate
          className="max-w-2xl mx-auto space-y-8"
        >
          {/* ── Contact info ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
            <h2
              className="text-navy text-xl font-semibold"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Your Contact Information
            </h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Jane Smith"
                value={form.customerName}
                onChange={(e) => set("customerName", e.target.value)}
                className={`${inputBase} ${errors.customerName ? inputErr : inputOk}`}
                data-error={errors.customerName ? true : undefined}
              />
              {errors.customerName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.customerName}
                </p>
              )}
            </div>

            {/* Business name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Acme Coffee Co."
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                className={`${inputBase} ${errors.businessName ? inputErr : inputOk}`}
                data-error={errors.businessName ? true : undefined}
              />
              {errors.businessName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.businessName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="jane@acmecoffee.com"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className={`${inputBase} ${errors.email ? inputErr : inputOk}`}
                data-error={errors.email ? true : undefined}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">
                Your report will be delivered to this address.
              </p>
            </div>
          </div>

          {/* ── 10 Questions ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
            <h2
              className="text-navy text-xl font-semibold"
              style={{ fontFamily: "Georgia, serif" }}
            >
              The 10 Questions
            </h2>

            {QUESTIONS.map(({ id, label }) => {
              const key = id as keyof FormData;
              const hasError = !!errors[key];
              return (
                <div key={id} data-error={hasError ? true : undefined}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write as much detail as you like…"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className={`${inputBase} resize-y ${hasError ? inputErr : inputOk}`}
                  />
                  {hasError && (
                    <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Validation summary ── */}
          {submitted && Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-6 py-4 text-red-700 text-sm">
              Please fill in all required fields before proceeding.
            </div>
          )}

          {/* ── Submit ── */}
          <div className="text-center pb-4">
            <p className="text-gray-500 text-sm mb-4">
              You will be taken to a secure checkout page to complete your $149
              payment.
            </p>
            <button
              type="submit"
              className="inline-block bg-navy text-white font-bold text-lg px-10 py-4 rounded-full hover:bg-navy-dark transition-colors cursor-pointer"
            >
              Proceed to Payment →
            </button>
          </div>
        </form>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-navy text-blue-300 text-center text-sm py-6 px-6">
        <p
          className="font-semibold text-white mb-1"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Sea Glass Insights
        </p>
        <p>
          Refining the Edge. &copy; {new Date().getFullYear()} Sea Glass
          Insights. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
