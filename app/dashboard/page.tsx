"use client";

import { useState, useEffect, useCallback } from "react";
import type { Order, AIDraft, AnalystCommentary } from "@/lib/supabase";

// ── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  pending_payment: "Pending Payment",
  new:             "New",
  in_progress:     "In Progress",
  delivered:       "Delivered",
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: "bg-gray-100 text-gray-500",
  new:             "bg-blue-100 text-blue-700",
  in_progress:     "bg-yellow-100 text-yellow-700",
  delivered:       "bg-green-100 text-green-700",
};

const SECTIONS: { key: keyof AIDraft; label: string }[] = [
  { key: "snapshot",              label: "Business Snapshot" },
  { key: "customer_profile",      label: "Customer Profile" },
  { key: "competitive_landscape", label: "Competitive Landscape" },
  { key: "positioning",           label: "Market Positioning" },
  { key: "insights",              label: "Key Insights" },
  { key: "recommendations",       label: "Recommendations" },
];

const QUESTIONS = [
  "What is your business name and what do you sell or offer?",
  "How long have you been in business, and where are you located?",
  "Who is your ideal customer?",
  "Who are your top 2–3 competitors?",
  "What makes you different from those competitors?",
  "What is the biggest challenge you are facing right now?",
  "What does success look like for you in the next 12 months?",
  "What marketing are you currently doing, if any?",
  "What do you wish you knew about your market or customers?",
  "Is there anything else you want the report to focus on?",
];

// ── Login Gate ───────────────────────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dashboard-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) {
      onAuth();
    } else {
      setError(true);
      setPw("");
    }
  }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-10 w-full max-w-sm text-center">
        <p className="text-seafoam text-xs font-semibold uppercase tracking-widest mb-2">
          Analyst Access
        </p>
        <h1
          className="text-navy text-2xl font-bold mb-6"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Sea Glass Insights
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter dashboard password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(false); }}
            className={`w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-seafoam ${
              error ? "border-red-400 bg-red-50" : "border-gray-300"
            }`}
            autoFocus
          />
          {error && (
            <p className="text-red-500 text-xs">Incorrect password.</p>
          )}
          <button
            type="submit"
            className="w-full bg-navy text-white font-semibold py-3 rounded-full hover:bg-navy-dark transition-colors"
          >
            Enter Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Order List ───────────────────────────────────────────────────────────────

function OrderList({
  orders,
  onSelect,
}: {
  orders: Order[];
  onSelect: (o: Order) => void;
}) {
  const paid = orders.filter(o => o.status !== "pending_payment");

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2
          className="text-navy text-2xl font-bold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Orders
        </h2>
        <span className="text-sm text-gray-400">{paid.length} paid order{paid.length !== 1 ? "s" : ""}</span>
      </div>

      {paid.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          No paid orders yet. They'll appear here after customers complete payment.
        </div>
      ) : (
        <div className="space-y-3">
          {paid.map(order => (
            <button
              key={order.id}
              onClick={() => onSelect(order)}
              className="w-full bg-white border border-gray-100 rounded-xl px-6 py-4 flex items-center justify-between hover:border-seafoam hover:shadow-sm transition-all text-left group"
            >
              <div>
                <p className="font-semibold text-navy group-hover:text-seafoam transition-colors">
                  {order.business_name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {order.customer_name} · {order.email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString("en-US", {
                    month: "short", day: "numeric", year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-4 ${
                  STATUS_COLORS[order.status] ?? STATUS_COLORS.new
                }`}
              >
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Order Detail ─────────────────────────────────────────────────────────────

function OrderDetail({
  order: initialOrder,
  onBack,
}: {
  order: Order;
  onBack: () => void;
}) {
  const [order, setOrder]           = useState<Order>(initialOrder);
  const [draft, setDraft]           = useState<AIDraft | null>(initialOrder.ai_draft);
  const [commentary, setCommentary] = useState<AnalystCommentary>(
    initialOrder.analyst_commentary ?? {}
  );
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);

  const answers = [
    order.q1, order.q2, order.q3, order.q4, order.q5,
    order.q6, order.q7, order.q8, order.q9, order.q10,
  ];

  async function generateDraft() {
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraft(data.draft);
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  async function saveCommentary() {
    setSaving(true);
    setSaveMsg(null);
    try {
      await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          analyst_commentary: commentary,
          status: "in_progress",
        }),
      });
      setOrder(prev => ({ ...prev, status: "in_progress", analyst_commentary: commentary }));
      setSaveMsg("Commentary saved.");
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(status: string) {
    await fetch("/api/update-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, status }),
    });
    setOrder(prev => ({ ...prev, status: status as Order["status"] }));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="text-sm text-gray-400 hover:text-navy transition-colors"
        >
          ← All Orders
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <h2
          className="text-navy text-2xl font-bold"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {order.business_name}
        </h2>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-navy mt-0.5">{order.customer_name}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-semibold text-navy mt-0.5">{order.email}</p></div>
        <div><span className="text-gray-400">Submitted</span><p className="font-semibold text-navy mt-0.5">{new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
        <div><span className="text-gray-400">Order ID</span><p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0, 8)}…</p></div>
      </div>

      {/* Intake answers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Intake Answers
        </h3>
        <div className="space-y-4">
          {QUESTIONS.map((q, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                Q{i + 1} — {q}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {answers[i] ?? <span className="italic text-gray-300">No answer</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Generate AI Draft */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>
            AI Draft Report
          </h3>
          <button
            onClick={generateDraft}
            disabled={generating}
            className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : draft ? "Regenerate Draft" : "Generate AI Draft"}
          </button>
        </div>

        {genError && (
          <p className="text-red-500 text-sm mb-4">{genError}</p>
        )}

        {generating && (
          <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
            <div className="w-5 h-5 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Claude is drafting your report…</span>
          </div>
        )}

        {draft && !generating && (
          <div className="space-y-6">
            {SECTIONS.map(({ key, label }) => (
              <div key={key} className="border-t border-gray-100 pt-5 first:border-0 first:pt-0">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-5 bg-seafoam rounded" />
                  <h4 className="font-semibold text-navy text-sm">{label}</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">
                  {draft[key]}
                </p>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Your Analyst Commentary
                </label>
                <textarea
                  rows={3}
                  placeholder="Add your expert commentary here…"
                  value={commentary[key] ?? ""}
                  onChange={e =>
                    setCommentary(prev => ({ ...prev, [key]: e.target.value }))
                  }
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y"
                />
              </div>
            ))}

            <div className="flex items-center gap-4 pt-2">
              <button
                onClick={saveCommentary}
                disabled={saving}
                className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Commentary"}
              </button>
              {saveMsg && (
                <span className="text-green-600 text-sm font-medium">{saveMsg}</span>
              )}
            </div>
          </div>
        )}

        {!draft && !generating && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Click "Generate AI Draft" to create the report using Claude.
          </p>
        )}
      </div>

      {/* Status actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Order Actions
        </h3>
        {order.status === "new" && (
          <button
            onClick={() => updateStatus("in_progress")}
            className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200 transition-colors"
          >
            Mark In Progress
          </button>
        )}
        {(order.status === "new" || order.status === "in_progress") && (
          <button
            onClick={() => updateStatus("delivered")}
            className="bg-seagreen text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity"
          >
            Mark Delivered
          </button>
        )}
        {order.status === "delivered" && (
          <span className="text-sm text-green-600 font-semibold py-2">
            Report delivered.
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [authed, setAuthed]       = useState(false);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [selected, setSelected]   = useState<Order | null>(null);
  const [loading, setLoading]     = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) fetchOrders();
  }, [authed, fetchOrders]);

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  return (
    <div className="min-h-screen bg-sand">
      {/* Nav */}
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div>
          <span
            className="text-xl font-bold tracking-wide"
            style={{ fontFamily: "Georgia, serif" }}
          >
            Sea Glass Insights
          </span>
          <span className="ml-3 text-seafoam text-sm hidden sm:inline">
            Analyst Dashboard
          </span>
        </div>
        <button
          onClick={fetchOrders}
          className="text-blue-300 hover:text-white text-sm transition-colors"
        >
          ↻ Refresh
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-seafoam border-t-transparent rounded-full animate-spin" />
          </div>
        ) : selected ? (
          <OrderDetail
            order={selected}
            onBack={() => { setSelected(null); fetchOrders(); }}
          />
        ) : (
          <OrderList orders={orders} onSelect={setSelected} />
        )}
      </main>
    </div>
  );
}
