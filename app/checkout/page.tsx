"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState("Preparing your secure checkout…");

  useEffect(() => {
    async function redirect() {
      const raw = sessionStorage.getItem("sgi_intake");
      if (!raw) {
        router.replace("/get-report");
        return;
      }

      const formData = JSON.parse(raw);

      try {
        setStatus("Connecting to Stripe…");
        const res = await fetch("/api/create-checkout-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok || !data.url) {
          throw new Error(data.error ?? "Unknown error");
        }

        setStatus("Redirecting to secure payment…");
        window.location.href = data.url;
      } catch (err) {
        console.error(err);
        setError(
          "Something went wrong setting up your payment. Please go back and try again."
        );
      }
    }

    redirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-12 text-center max-w-md w-full">
        {error ? (
          <>
            <div className="text-4xl mb-4">⚠️</div>
            <h1
              className="text-navy text-xl font-bold mb-3"
              style={{ fontFamily: "Georgia, serif" }}
            >
              Something went wrong
            </h1>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <a
              href="/get-report"
              className="inline-block bg-navy text-white font-semibold px-6 py-3 rounded-full text-sm hover:bg-navy-dark transition-colors"
            >
              ← Back to Form
            </a>
          </>
        ) : (
          <>
            {/* Spinner */}
            <div className="flex justify-center mb-6">
              <div className="w-10 h-10 border-4 border-seafoam border-t-transparent rounded-full animate-spin" />
            </div>
            <h1
              className="text-navy text-xl font-bold mb-2"
              style={{ fontFamily: "Georgia, serif" }}
            >
              {status}
            </h1>
            <p className="text-gray-400 text-sm">
              You will be redirected to Stripe's secure payment page.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
