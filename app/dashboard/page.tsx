"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Order, AIDraft, Insight, Recommendation } from "@/lib/supabase";

// ── Constants ─────────────────────────────────────────────────────────────────

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

type SectionKey =
  | "snapshot"
  | "customer_profile"
  | "competitive_landscape"
  | "positioning"
  | "insights"
  | "recommendations";

type SectionMeta = { notes: string; locked: boolean };
type MetaMap     = Record<SectionKey, SectionMeta>;

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: "snapshot",              label: "Business Snapshot"    },
  { key: "customer_profile",      label: "Customer Profile"      },
  { key: "competitive_landscape", label: "Competitive Landscape" },
  { key: "positioning",           label: "Market Positioning"    },
  { key: "insights",              label: "Key Insights"          },
  { key: "recommendations",       label: "Recommendations"       },
];

const QUESTIONS = [
  "What is your business name and what do you sell or offer?",
  "How long have you been in business, and where are you located?",
  "Who is your ideal customer? (age, income, lifestyle, problem they have)",
  "Who are your top 2–3 competitors? (names, or describe them)",
  "What makes you different from those competitors?",
  "What is the biggest challenge you are facing right now?",
  "What does success look like for you in the next 12 months?",
  "What marketing are you currently doing, if any?",
  "What do you wish you knew about your market or customers that you don't know today?",
  "Is there anything else you want the report to focus on or address?",
];

function defaultMeta(): MetaMap {
  return {
    snapshot:              { notes: "", locked: false },
    customer_profile:      { notes: "", locked: false },
    competitive_landscape: { notes: "", locked: false },
    positioning:           { notes: "", locked: false },
    insights:              { notes: "", locked: false },
    recommendations:       { notes: "", locked: false },
  };
}

function initMeta(order: Order): MetaMap {
  const base = defaultMeta();
  const saved = order.analyst_commentary as Partial<MetaMap> | null;
  if (!saved || typeof saved !== "object") return base;
  for (const k of Object.keys(base) as SectionKey[]) {
    const v = (saved as Record<string, unknown>)[k];
    if (v && typeof v === "object" && "locked" in (v as object)) {
      base[k] = v as SectionMeta;
    }
  }
  return base;
}

// ── Login Gate ────────────────────────────────────────────────────────────────

function LoginGate({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw]       = useState("");
  const [error, setError] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/dashboard-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    if (res.ok) onAuth();
    else { setError(true); setPw(""); }
  }

  return (
    <div className="min-h-screen bg-sand flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow border border-gray-100 p-10 w-full max-w-sm text-center">
        <img
          src="/images/logo.png"
          alt="Sea Glass Insights"
          className="h-10 w-auto mx-auto mb-4"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        />
        <p className="text-seafoam text-xs font-semibold uppercase tracking-widest mb-2">
          Analyst Access
        </p>
        <h1 className="text-navy text-2xl font-bold mb-6" style={{ fontFamily: "Georgia, serif" }}>
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
          {error && <p className="text-red-500 text-xs">Incorrect password.</p>}
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

// ── Manual Order Form ─────────────────────────────────────────────────────────

type ManualForm = {
  customerName: string; businessName: string; email: string; location: string;
  q1: string; q2: string; q3: string; q4: string; q5: string;
  q6: string; q7: string; q8: string; q9: string; q10: string;
};

const MANUAL_EMPTY: ManualForm = {
  customerName: "", businessName: "", email: "", location: "",
  q1: "", q2: "", q3: "", q4: "", q5: "",
  q6: "", q7: "", q8: "", q9: "", q10: "",
};

function ManualOrderForm({ onSuccess, onCancel }: { onSuccess: (order: Order) => void; onCancel: () => void }) {
  const [form, setForm]      = useState<ManualForm>(MANUAL_EMPTY);
  const [submitting, setSub] = useState(false);
  const [error, setError]    = useState<string | null>(null);

  function set(field: keyof ManualForm, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim() || !form.businessName.trim() || !form.email.trim()) {
      setError("Customer name, business name, and email are required.");
      return;
    }
    setSub(true);
    setError(null);
    try {
      const q2Val = form.location.trim()
        ? form.q2.trim()
          ? `Located in ${form.location.trim()}.\n\n${form.q2}`
          : `Located in ${form.location.trim()}.`
        : form.q2;

      const res = await fetch("/api/manual-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          businessName: form.businessName,
          email:        form.email,
          q1: form.q1, q2: q2Val,  q3: form.q3,
          q4: form.q4, q5: form.q5, q6: form.q6,
          q7: form.q7, q8: form.q8, q9: form.q9, q10: form.q10,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      onSuccess(data as Order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSub(false);
    }
  }

  const inputCls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam placeholder-gray-300";
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onCancel} className="text-sm text-gray-400 hover:text-navy transition-colors">
          ← All Orders
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <h2 className="text-navy text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          Create Manual Order
        </h2>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Contact Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Customer Name <span className="text-red-400 normal-case font-normal tracking-normal">*</span></label>
              <input type="text" placeholder="Jane Smith" value={form.customerName}
                onChange={e => set("customerName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Business Name <span className="text-red-400 normal-case font-normal tracking-normal">*</span></label>
              <input type="text" placeholder="Acme Coffee Co." value={form.businessName}
                onChange={e => set("businessName", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Customer Email <span className="text-red-400 normal-case font-normal tracking-normal">*</span></label>
              <input type="email" placeholder="jane@acmecoffee.com" value={form.email}
                onChange={e => set("email", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input type="text" placeholder="Bradley Beach, NJ" value={form.location}
                onChange={e => set("location", e.target.value)} className={inputCls} />
              <p className="text-xs text-gray-400 mt-1">Prepended to Answer 2 automatically.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-6">
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Intake Answers</h3>
          <p className="text-xs text-gray-400 -mt-2">All fields optional — fill in whatever the client shared.</p>
          {(["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10"] as (keyof ManualForm)[]).map((key, i) => (
            <div key={key}>
              <label className={labelCls}>
                <span className="text-seafoam mr-1">Q{i + 1}</span> — {QUESTIONS[i]}
              </label>
              <textarea rows={3} placeholder="Write as much detail as you have…"
                value={form[key]} onChange={e => set(key, e.target.value)}
                className={`${inputCls} resize-y`} />
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-red-600 text-sm">{error}</div>
        )}

        <div className="flex items-center gap-4 pb-6">
          <button type="submit" disabled={submitting}
            className="bg-seafoam text-navy font-semibold text-sm px-8 py-2.5 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? "Creating…" : "Create Order"}
          </button>
          <button type="button" onClick={onCancel}
            className="text-sm text-gray-400 hover:text-navy transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Order List ────────────────────────────────────────────────────────────────

function OrderList({ orders, onSelect, onCreateManual }: {
  orders: Order[];
  onSelect: (o: Order) => void;
  onCreateManual: () => void;
}) {
  const paid = orders.filter(o => o.status !== "pending_payment");
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-navy text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>Orders</h2>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{paid.length} order{paid.length !== 1 ? "s" : ""}</span>
          <button onClick={onCreateManual}
            className="bg-navy text-white text-sm font-semibold px-4 py-2 rounded-full hover:bg-navy-dark transition-colors">
            + Create Manual Order
          </button>
        </div>
      </div>
      {paid.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          No orders yet. They&apos;ll appear here after customers complete payment or you create a manual order.
        </div>
      ) : (
        <div className="space-y-3">
          {paid.map(order => (
            <button key={order.id} onClick={() => onSelect(order)}
              className="w-full bg-white border border-gray-100 rounded-xl px-6 py-4 flex items-center justify-between hover:border-seafoam hover:shadow-sm transition-all text-left group">
              <div>
                <p className="font-semibold text-navy group-hover:text-seafoam transition-colors">
                  {order.business_name}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">{order.customer_name} · {order.email}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {order.analyst_note === "Manual Order" && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full font-medium">Manual</span>
                  )}
                </p>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 ml-4 ${STATUS_COLORS[order.status] ?? STATUS_COLORS.new}`}>
                {STATUS_LABELS[order.status] ?? order.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function OldFormatFallback({ text }: { text: string }) {
  return <p className="text-sm text-gray-500 italic leading-relaxed whitespace-pre-wrap">{text}</p>;
}

// ── Order Detail ──────────────────────────────────────────────────────────────

function OrderDetail({ order: initialOrder, onBack }: { order: Order; onBack: () => void }) {
  const [order, setOrder]           = useState<Order>(initialOrder);
  const [draft, setDraft]           = useState<AIDraft | null>(initialOrder.ai_draft);
  const [analystNote, setAnalystNote]           = useState(initialOrder.analyst_note === "Manual Order" ? "" : (initialOrder.analyst_note ?? ""));
  const [executiveSummary, setExecutiveSummary] = useState(initialOrder.executive_summary ?? "");
  const [sectionMeta, setSectionMeta]           = useState<MetaMap>(() => initMeta(initialOrder));

  // Edit state (unified: single textarea buffer for all sections)
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editBuf, setEditBuf] = useState("");

  // Loading states
  const [generating, setGenerating]               = useState(false);
  const [regenerating, setRegenerating]           = useState<Partial<Record<SectionKey, boolean>>>({});
  const [saving, setSaving]                       = useState(false);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [sendingReport, setSendingReport]         = useState(false);

  // Messages
  const [genError, setGenError]     = useState<string | null>(null);
  const [regenError, setRegenError] = useState<Partial<Record<SectionKey, string>>>({});
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);
  const [sendMsg, setSendMsg]       = useState<string | null>(null);
  const [autoSaved, setAutoSaved]   = useState(false);

  // Debounce refs
  const metaSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const noteSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const execSaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (metaSaveTimer.current) clearTimeout(metaSaveTimer.current);
      if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
      if (execSaveTimer.current) clearTimeout(execSaveTimer.current);
    };
  }, []);

  const sectionsLocked = SECTIONS.every(({ key }) => sectionMeta[key].locked);
  const allLocked      = sectionsLocked && executiveSummary.trim() !== "";
  const lockedCount    = SECTIONS.filter(({ key }) => sectionMeta[key].locked).length;

  const answers = [
    order.q1, order.q2, order.q3, order.q4, order.q5,
    order.q6, order.q7, order.q8, order.q9, order.q10,
  ];

  // ── Auto-save helpers ──────────────────────────────────────────────────────

  function flashAutoSaved() {
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2500);
  }

  async function persistDraft(d: AIDraft) {
    await fetch("/api/update-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, ai_draft: d }),
    });
    flashAutoSaved();
  }

  async function persistMeta(m: MetaMap) {
    await fetch("/api/update-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, analyst_commentary: m }),
    });
    flashAutoSaved();
  }

  function scheduleSaveMeta(m: MetaMap) {
    if (metaSaveTimer.current) clearTimeout(metaSaveTimer.current);
    metaSaveTimer.current = setTimeout(() => persistMeta(m), 2000);
  }

  function scheduleNoteSave(note: string) {
    if (noteSaveTimer.current) clearTimeout(noteSaveTimer.current);
    noteSaveTimer.current = setTimeout(async () => {
      await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, analyst_note: note }),
      });
      flashAutoSaved();
    }, 2000);
  }

  function scheduleExecSave(text: string) {
    if (execSaveTimer.current) clearTimeout(execSaveTimer.current);
    execSaveTimer.current = setTimeout(async () => {
      await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, executive_summary: text }),
      });
      flashAutoSaved();
    }, 2000);
  }

  // ── Section actions ────────────────────────────────────────────────────────

  function updateSectionNotes(key: SectionKey, notes: string) {
    const updated = { ...sectionMeta, [key]: { ...sectionMeta[key], notes } };
    setSectionMeta(updated);
    scheduleSaveMeta(updated);
  }

  function lockSection(key: SectionKey) {
    const updated = { ...sectionMeta, [key]: { ...sectionMeta[key], locked: true } };
    setSectionMeta(updated);
    setEditingSection(null);
    persistMeta(updated);
  }

  function unlockSection(key: SectionKey) {
    const updated = { ...sectionMeta, [key]: { ...sectionMeta[key], locked: false } };
    setSectionMeta(updated);
    persistMeta(updated);
  }

  function startEdit(key: SectionKey) {
    if (!draft) return;
    const content = draft[key];
    setEditBuf(key === "snapshot"
      ? (typeof content === "string" ? content : "")
      : JSON.stringify(content, null, 2)
    );
    setEditingSection(key);
  }

  function applyEdit() {
    if (!draft || !editingSection) return;
    let newContent: unknown;
    if (editingSection === "snapshot") {
      newContent = editBuf;
    } else {
      try {
        newContent = JSON.parse(editBuf);
      } catch {
        alert("Invalid JSON. Check your edits or cancel and use Regenerate instead.");
        return;
      }
    }
    const updated = { ...draft, [editingSection]: newContent } as AIDraft;
    setDraft(updated);
    setEditingSection(null);
    persistDraft(updated);
  }

  async function regenerateSection(key: SectionKey) {
    if (!draft) return;
    setRegenerating(prev => ({ ...prev, [key]: true }));
    setRegenError(prev => ({ ...prev, [key]: undefined }));
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:      order.id,
          sectionKey:   key,
          analystNotes: sectionMeta[key].notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regeneration failed");
      setDraft(prev => prev ? { ...prev, [key]: data.content } : prev);
      flashAutoSaved(); // API already saved to DB
    } catch (err) {
      setRegenError(prev => ({
        ...prev,
        [key]: err instanceof Error ? err.message : "Regeneration failed",
      }));
    } finally {
      setRegenerating(prev => ({ ...prev, [key]: false }));
    }
  }

  // ── Full draft generation ──────────────────────────────────────────────────

  async function generateDraft() {
    setGenerating(true);
    setGenError(null);
    setEditingSection(null);
    try {
      const res  = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraft(data.draft);
      // Reset section locks when a full draft is regenerated
      const resetMeta = defaultMeta();
      setSectionMeta(resetMeta);
      persistMeta(resetMeta);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  // ── Save / Download / Send ─────────────────────────────────────────────────

  async function saveReport() {
    setSaving(true);
    setSaveMsg(null);
    try {
      const newStatus = order.status === "new" ? "in_progress" : order.status;
      await fetch("/api/update-order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId:            order.id,
          ai_draft:           draft,
          analyst_note:       analystNote,
          executive_summary:  executiveSummary,
          analyst_commentary: sectionMeta,
          status:             newStatus,
        }),
      });
      setOrder(prev => ({ ...prev, status: newStatus as Order["status"] }));
      setSaveMsg("All changes saved.");
      setTimeout(() => setSaveMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  }

  async function downloadReport() {
    setDownloadingReport(true);
    try {
      const res = await fetch("/api/generate-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, analystNote }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Report generation failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SeaGlassInsights-${order.business_name.replace(/[^a-zA-Z0-9]/g, "")}-Report.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Report generation failed");
    } finally {
      setDownloadingReport(false);
    }
  }

  async function sendReport() {
    if (!confirm(`Send the report to ${order.email}?`)) return;
    setSendingReport(true);
    setSendMsg(null);
    try {
      const res  = await fetch("/api/send-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setOrder(prev => ({ ...prev, status: "delivered" }));
      setSendMsg(`Report sent to ${order.email}`);
      setTimeout(() => setSendMsg(null), 6000);
    } catch (e) {
      setSendMsg(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
      setTimeout(() => setSendMsg(null), 8000);
    } finally {
      setSendingReport(false);
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

  // ── Content display renderer ───────────────────────────────────────────────

  function renderContent(key: SectionKey, d: AIDraft): React.ReactNode {
    if (key === "snapshot") {
      return <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{d.snapshot}</p>;
    }

    if (key === "customer_profile") {
      if (!Array.isArray(d.customer_profile)) return <OldFormatFallback text={String(d.customer_profile)} />;
      return (
        <div className="space-y-3">
          {d.customer_profile.map((seg, i) => (
            <div key={i} className="border-l-2 border-seafoam/40 pl-3 py-0.5">
              <p className="font-semibold text-navy text-sm">{["A","B","C","D","E"][i]}. {seg.name}</p>
              <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{seg.desc}</p>
              <p className="text-xs text-gray-500 mt-1">
                <span className="font-medium text-gray-600">Motivation:</span> {seg.motivation}
              </p>
              <p className="text-xs text-gray-500">
                <span className="font-medium text-gray-600">Key Need:</span> {seg.key_need}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (key === "competitive_landscape") {
      if (!Array.isArray(d.competitive_landscape)) return <OldFormatFallback text={String(d.competitive_landscape)} />;
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-navy text-white">
                <th className="text-left px-3 py-2 font-semibold text-xs">Competitor</th>
                <th className="text-left px-3 py-2 font-semibold text-xs">Their Strength</th>
                <th className="text-left px-3 py-2 font-semibold text-xs text-seafoam">Your Edge</th>
              </tr>
            </thead>
            <tbody>
              {d.competitive_landscape.map((c, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-sand" : "bg-white"}>
                  <td className="px-3 py-2 font-semibold text-navy text-xs border border-gray-100">{c.name}</td>
                  <td className="px-3 py-2 text-gray-600 text-xs border border-gray-100">{c.strength}</td>
                  <td className="px-3 py-2 text-teal-700 text-xs border border-gray-100">{c.edge}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (key === "positioning") {
      if (!d.positioning || !Array.isArray(d.positioning.strengths)) return <OldFormatFallback text={String(d.positioning)} />;
      return (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Strengths</p>
            <ul className="space-y-1.5">
              {d.positioning.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-seafoam mt-0.5 shrink-0 font-bold">▸</span>{s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Vulnerabilities</p>
            <ul className="space-y-1.5">
              {d.positioning.vulnerabilities.map((v, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-400 mt-0.5 shrink-0 font-bold">▸</span>{v}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (key === "insights" || key === "recommendations") {
      const items = key === "insights" ? d.insights : d.recommendations;
      if (!Array.isArray(items)) return <OldFormatFallback text={String(items)} />;
      return (
        <div className="space-y-3">
          {(items as Array<Insight | Recommendation>).map((item, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: key === "insights" ? "#0A2F61" : "#00CED1" }}>
                {i + 1}
              </div>
              <div>
                <p className="font-semibold text-navy text-sm">{item.title}</p>
                <p className="text-sm text-gray-600 mt-0.5 leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }

  // ── Full section renderer ──────────────────────────────────────────────────

  function renderSection(key: SectionKey, label: string): React.ReactNode {
    if (!draft) return null;
    const meta          = sectionMeta[key];
    const isEditing     = editingSection === key;
    const isRegenerating = !!regenerating[key];
    const err           = regenError[key];

    return (
      <div key={key} className="border-t border-gray-100 py-5 first:border-0 first:pt-0">

        {/* Section header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`w-1 h-5 rounded-full shrink-0 ${meta.locked ? "bg-green-400" : "bg-seafoam"}`} />
            <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>{label}</h4>
            {meta.locked && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                ✓ Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!meta.locked && !isEditing && (
              <button onClick={() => startEdit(key)}
                className="text-xs text-seafoam hover:text-navy border border-seafoam/40 hover:border-navy/40 rounded-full px-3 py-1 transition-colors font-medium">
                Edit
              </button>
            )}
            {meta.locked ? (
              <button onClick={() => unlockSection(key)}
                className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
                Unlock
              </button>
            ) : (
              <button onClick={() => lockSection(key)}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">
                Lock Section
              </button>
            )}
          </div>
        </div>

        {/* AI content or edit textarea */}
        {isEditing ? (
          <div>
            <textarea
              rows={key === "snapshot" ? 10 : 16}
              value={editBuf}
              onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed"
              autoFocus
            />
            {key !== "snapshot" && (
              <p className="text-xs text-gray-400 mt-1">
                Editing as JSON. For structural changes, add Analyst Notes and use Regenerate instead.
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <button onClick={applyEdit}
                className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:bg-seafoam-dark transition-colors">
                Apply Changes
              </button>
              <button onClick={() => setEditingSection(null)}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          renderContent(key, draft)
        )}

        {/* Analyst Notes + Regenerate — hidden when locked */}
        {!meta.locked && (
          <div className="mt-4 pt-3 border-t border-gray-50 space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">
              Analyst Notes — your thoughts, corrections, or direction for this section
            </label>
            <textarea
              rows={3}
              value={meta.notes}
              onChange={e => updateSectionNotes(key, e.target.value)}
              placeholder="e.g. Add more depth on the local competitive angle. The seasonal visitor segment needs more detail."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300"
            />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button
              onClick={() => regenerateSection(key)}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegenerating ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Regenerating…
                </>
              ) : "↺ Regenerate This Section"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-navy transition-colors">
          ← All Orders
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <h2 className="text-navy text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          {order.business_name}
        </h2>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
        {autoSaved && (
          <span className="text-xs text-green-500 font-medium ml-auto">✓ Auto-saved</span>
        )}
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-navy mt-0.5">{order.customer_name}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-semibold text-navy mt-0.5">{order.email}</p></div>
        <div>
          <span className="text-gray-400">Submitted</span>
          <p className="font-semibold text-navy mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div><span className="text-gray-400">Order ID</span><p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0,8)}…</p></div>
      </div>

      {/* Intake answers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>Intake Answers</h3>
        <div className="space-y-4">
          {QUESTIONS.map((q, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Q{i+1} — {q}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {answers[i] ?? <span className="italic text-gray-300">No answer</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Report Draft */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Report Draft</h3>
          <div className="flex items-center gap-3">
            {draft && (
              <span className="text-xs text-gray-400 font-medium">
                {lockedCount}/{SECTIONS.length} sections locked
              </span>
            )}
            <button
              onClick={generateDraft}
              disabled={generating}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating…" : draft ? "Regenerate Full Draft" : "Generate AI Draft"}
            </button>
          </div>
        </div>

        {genError && <p className="text-red-500 text-sm mb-4">{genError}</p>}

        {generating && (
          <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
            <div className="w-5 h-5 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Claude is drafting your report…</span>
          </div>
        )}

        {!draft && !generating && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Click &ldquo;Generate AI Draft&rdquo; to create the report using Claude.
          </p>
        )}

        {draft && !generating && (
          <div>
            {/* Old-format warning */}
            {!Array.isArray(draft.customer_profile) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-start gap-3">
                <span className="text-amber-500 text-lg shrink-0">⚠</span>
                <div>
                  <p className="text-amber-800 text-sm font-semibold">Draft format is outdated</p>
                  <p className="text-amber-700 text-sm mt-0.5">
                    Click <strong>Regenerate Full Draft</strong> above to upgrade to the new format.
                  </p>
                </div>
              </div>
            )}

            {/* Six sections */}
            {SECTIONS.map(({ key, label }) => renderSection(key, label))}

            {/* Executive Summary */}
            <div className="border-t-2 border-dashed border-seafoam/40 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-seafoam rounded-full" />
                <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  Executive Summary
                </h4>
              </div>
              <p className="text-xs text-gray-400 ml-3 mb-3 leading-relaxed">
                2–3 sentences capturing where they stand, their biggest opportunity, and their most urgent action. Appears at the top of the report. <strong className="text-amber-600">Required to generate the final report.</strong>
              </p>
              <textarea
                rows={3}
                placeholder="e.g. Rapid Recovery Services holds a strong position in the local restoration market, built on owner accountability and fast response times that national franchises cannot match. The biggest opportunity is formalizing referral relationships with insurance adjusters — a structured incentive program could double inbound volume with minimal spend. The most urgent action is establishing a professional online presence to capture organic search traffic that currently defaults to competitors."
                value={executiveSummary}
                onChange={e => { setExecutiveSummary(e.target.value); scheduleExecSave(e.target.value); }}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed ${
                  executiveSummary.trim() === "" ? "border-amber-300 bg-amber-50/40" : "border-gray-200"
                }`}
              />
            </div>

            {/* Analyst closing note */}
            <div className="border-t-2 border-dashed border-seagreen/30 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-seagreen rounded-full" />
                <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  A Note from the Analyst
                </h4>
              </div>
              <p className="text-xs text-gray-400 ml-3 mb-3 leading-relaxed">
                Write one warm, personal closing paragraph in your own voice. This appears at the end of the Word document. Auto-saved as you type.
              </p>
              <textarea
                rows={5}
                placeholder={`e.g. "Working through your intake responses, what struck me most was the clarity of your instincts — you already know what makes you different…"`}
                value={analystNote}
                onChange={e => { setAnalystNote(e.target.value); scheduleNoteSave(e.target.value); }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seagreen resize-y leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-5 space-y-3">
              {/* Generate Final Report — locked gate */}
              <div>
                <button
                  onClick={downloadReport}
                  disabled={!allLocked || downloadingReport}
                  className="bg-seagreen text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {downloadingReport ? "Building Report…" : "⬇ Generate Final Report"}
                </button>
                {!allLocked && (
                  <p className="text-xs text-amber-600 mt-1.5 font-medium">
                    {!sectionsLocked
                      ? `Lock all 6 sections to enable — ${lockedCount} of ${SECTIONS.length} locked`
                      : "Executive Summary is required before generating the report"}
                  </p>
                )}
              </div>

              {/* Secondary actions row */}
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={saveReport} disabled={saving}
                  className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50">
                  {saving ? "Saving…" : "Save Report"}
                </button>
                <button
                  onClick={sendReport}
                  disabled={sendingReport || order.status === "delivered"}
                  className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                  {sendingReport ? "Sending…" : order.status === "delivered" ? "✓ Sent" : "✉ Send to Customer"}
                </button>
                {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
                {sendMsg && (
                  <span className={`text-sm font-medium ${sendMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                    {sendMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>Order Actions</h3>
        {order.status === "new" && (
          <button onClick={() => updateStatus("in_progress")}
            className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200 transition-colors">
            Mark In Progress
          </button>
        )}
        {(order.status === "new" || order.status === "in_progress") && (
          <button onClick={() => updateStatus("delivered")}
            className="bg-seagreen text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
            Mark Delivered
          </button>
        )}
        {order.status === "delivered" && (
          <span className="text-sm text-green-600 font-semibold py-2">Report delivered.</span>
        )}
      </div>
    </div>
  );
}

// ── Business Pulse ────────────────────────────────────────────────────────────

type Observation = { label: string; title: string; body: string; notes: string };
type PulseForm = {
  businessName: string;
  location: string;
  introText: string;
  obs: [Observation, Observation, Observation];
  ctaPrice: string;
  analystName: string;
  phone: string;
  email: string;
  website: string;
};

const EMPTY_OBS: Observation = { label: "", title: "", body: "", notes: "" };
const PULSE_DEFAULTS: PulseForm = {
  businessName: "",
  location: "",
  introText: "A few observations from a quick look at your market. This is a fraction of what a full Market Intelligence Report uncovers.",
  obs: [{ ...EMPTY_OBS }, { ...EMPTY_OBS }, { ...EMPTY_OBS }],
  ctaPrice: "$199",
  analystName: "John Messina",
  phone: "(732) 518-3898",
  email: "john@seaglassinsights.com",
  website: "seaglassinsights.com",
};

// SVG logo-mark matching v4 design (overlapping circles + line chart)
function LogoMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="17" r="10" fill="#00CED1" fillOpacity="0.45"/>
      <circle cx="23" cy="14" r="9" fill="#1a5c8a" fillOpacity="0.65"/>
      <circle cx="20" cy="24" r="8" fill="#00CED1" fillOpacity="0.3"/>
      <path d="M7 30 L31 30" stroke="#00CED1" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.35"/>
      <path d="M11 30 L15 23 L19 27 L23 19 L28 22" stroke="#F4EADA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.6"/>
    </svg>
  );
}

const BACK_SERVICES = [
  { name: "Market Intelligence Report", price: "$199" },
  { name: "Social Media Audit",          price: "$199" },
  { name: "Secret Shopping",             price: "$299" },
  { name: "Deep Dive Report",            price: "$399" },
  { name: "Voice of Customer Survey",    price: "$499" },
  { name: "AI Starter Kit",              price: "$99"  },
];

function BusinessPulse() {
  const [form, setForm]         = useState<PulseForm>(PULSE_DEFAULTS);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [regenObs, setRegenObs] = useState<Partial<Record<number, boolean>>>({});

  function setField<K extends keyof PulseForm>(k: K, v: PulseForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }));
  }
  function setObs(i: number, k: keyof Observation, v: string) {
    setForm(prev => {
      const obs = prev.obs.map((o, idx) => idx === i ? { ...o, [k]: v } : o) as [Observation, Observation, Observation];
      return { ...prev, obs };
    });
  }

  async function generatePulse() {
    if (!form.businessName.trim()) { setGenError("Enter a business name first."); return; }
    setGenerating(true);
    setGenError(null);
    try {
      const res  = await fetch("/api/generate-pulse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: form.businessName, location: form.location }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      const raw = data.observations as { label: string; title: string; body: string }[];
      setForm(prev => ({
        ...prev,
        obs: raw.map((o, i) => ({ ...o, notes: prev.obs[i]?.notes ?? "" })) as [Observation, Observation, Observation],
      }));
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function regenerateObservation(i: number) {
    setRegenObs(prev => ({ ...prev, [i]: true }));
    try {
      const obs = form.obs[i];
      const res = await fetch("/api/regenerate-observation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName: form.businessName, label: obs.label, title: obs.title, body: obs.body, notes: obs.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regeneration failed");
      setForm(prev => {
        const obs = prev.obs.map((o, idx) => idx === i ? { ...data, notes: o.notes } : o) as [Observation, Observation, Observation];
        return { ...prev, obs };
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Regeneration failed.");
    } finally {
      setRegenObs(prev => ({ ...prev, [i]: false }));
    }
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam";
  const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  const CG       = "'Cormorant Garamond', Georgia, serif";
  const MT       = "'Montserrat', sans-serif";
  const NAVY_HEX = "#0A2F61";
  const TEAL_HEX = "#00CED1";
  const SAND_HEX = "#F4EADA";

  // ── Card preview (always visible on the right) ──────────────────────────
  const CardPreview = (
    <div id="pulse-card" style={{ fontFamily: MT }}>
      <p style={{ fontFamily: MT, fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#aaa", marginBottom: "14px" }}>Front</p>
      <div style={{ width: "620px", background: NAVY_HEX, borderRadius: "3px", overflow: "hidden", marginBottom: "32px" }}>
        <div style={{ padding: "36px 44px 28px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontFamily: MT, fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: TEAL_HEX, marginBottom: "10px" }}>Business Pulse</div>
            <h1 style={{ fontFamily: CG, fontSize: "30px", fontWeight: 700, color: "#fff", lineHeight: 1.1, margin: 0 }}>
              Three things we<br />noticed about<br />
              <span style={{ color: TEAL_HEX }}>{form.businessName || "Your Business"}</span>
            </h1>
          </div>
          <div style={{ textAlign: "right", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
            <LogoMark />
            <div style={{ fontFamily: MT, fontSize: "9px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{form.businessName || "Business Name"}</div>
            {form.location && <div style={{ fontFamily: MT, fontSize: "10px", color: "rgba(255,255,255,0.2)" }}>{form.location}</div>}
          </div>
        </div>
        <div style={{ padding: "32px 44px", background: NAVY_HEX }}>
          <p style={{ fontFamily: CG, fontSize: "16px", fontStyle: "italic", color: "rgba(244,234,218,0.55)", lineHeight: 1.7, marginBottom: "30px" }}>{form.introText}</p>
          {form.obs.map((obs, i) => (
            <div key={i} style={{ display: "flex", gap: "22px", marginBottom: i < 2 ? "26px" : 0, paddingBottom: i < 2 ? "26px" : 0, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div style={{ fontFamily: CG, fontSize: "40px", fontWeight: 700, color: "rgba(0,206,209,0.15)", lineHeight: 1, flexShrink: 0, width: "34px", marginTop: "-4px" }}>{i + 1}</div>
              <div>
                {obs.label && <div style={{ fontFamily: MT, fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: TEAL_HEX, marginBottom: "6px" }}>{obs.label}</div>}
                {obs.title
                  ? <div style={{ fontFamily: CG, fontSize: "19px", fontWeight: 700, color: SAND_HEX, marginBottom: "8px", lineHeight: 1.3 }}>{obs.title}</div>
                  : <div style={{ fontFamily: CG, fontSize: "19px", color: "rgba(244,234,218,0.2)", marginBottom: "8px", fontStyle: "italic" }}>Observation {i + 1} title</div>
                }
                {obs.body && <div style={{ fontFamily: MT, fontSize: "12px", fontWeight: 300, color: "rgba(244,234,218,0.5)", lineHeight: 1.8 }}>{obs.body}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: TEAL_HEX, padding: "20px 44px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontFamily: MT, fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(10,47,97,0.6)", marginBottom: "4px" }}>Want the full picture?</div>
            <div style={{ fontFamily: CG, fontSize: "16px", fontWeight: 700, color: NAVY_HEX }}>Market Intelligence Report — your complete edge</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: MT, fontSize: "24px", fontWeight: 600, color: NAVY_HEX, lineHeight: 1 }}>{form.ctaPrice}</div>
            <div style={{ fontFamily: MT, fontSize: "9px", color: "rgba(10,47,97,0.5)", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: "3px" }}>Flat fee · 48–72 hrs</div>
          </div>
        </div>
      </div>

      <p style={{ fontFamily: MT, fontSize: "9px", letterSpacing: "0.3em", textTransform: "uppercase", color: "#bbb", margin: "8px 0 14px" }}>— Back —</p>
      <div style={{ width: "620px", background: SAND_HEX, borderRadius: "3px", overflow: "hidden", display: "flex" }}>
        <div style={{ background: NAVY_HEX, padding: "40px 32px", width: "210px", flexShrink: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logos/logo_negative_transparent.png" alt="Sea Glass Insights" style={{ width: "120px", height: "auto", marginBottom: "12px" }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            <div style={{ fontFamily: CG, fontSize: "17px", fontWeight: 700, color: "#fff", lineHeight: 1.2 }}>Sea Glass Insights</div>
          </div>
          <div style={{ fontFamily: MT, fontSize: "10px", fontWeight: 300, color: "rgba(244,234,218,0.45)", lineHeight: 2, textAlign: "center" }}>
            <div>{form.analystName}</div>
            {form.phone && <div>{form.phone}</div>}
            <div style={{ color: TEAL_HEX }}>{form.email}</div>
            <div style={{ color: TEAL_HEX }}>{form.website}</div>
          </div>
        </div>
        <div style={{ padding: "40px 36px", flex: 1 }}>
          <div style={{ fontFamily: MT, fontSize: "8px", letterSpacing: "0.25em", textTransform: "uppercase", color: NAVY_HEX, opacity: 0.5, marginBottom: "14px" }}>What we offer</div>
          <div style={{ fontFamily: CG, fontSize: "21px", fontWeight: 700, color: NAVY_HEX, lineHeight: 1.3, marginBottom: "12px" }}>Professional research. Real analyst review. Flat fee.</div>
          <div style={{ fontFamily: MT, fontSize: "11px", fontWeight: 300, color: "#555", lineHeight: 1.8, marginBottom: "20px" }}>Every report is reviewed by a human analyst with over ten years of market research experience before it reaches you.</div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: "22px" }}>
            {BACK_SERVICES.map(svc => (
              <li key={svc.name} style={{ display: "flex", justifyContent: "space-between", fontFamily: MT, fontSize: "11px", color: "#333", padding: "6px 0", borderBottom: "1px solid rgba(10,47,97,0.08)" }}>
                <span>{svc.name}</span>
                <span style={{ color: NAVY_HEX, fontWeight: 600 }}>{svc.price}</span>
              </li>
            ))}
          </ul>
          <div style={{ display: "inline-block", background: NAVY_HEX, padding: "10px 18px", borderRadius: "2px", fontFamily: MT, fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase", color: SAND_HEX }}>
            seaglassinsights.com <span style={{ opacity: 0.6 }}>→</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Print CSS */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #pulse-card, #pulse-card * { visibility: visible !important; }
          #pulse-card { position: fixed !important; top: 0; left: 0; width: 100%; margin: 0; }
          @page { margin: 0; size: 620px auto; }
        }
      `}</style>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-navy font-bold text-lg" style={{ fontFamily: "Georgia, serif" }}>Business Pulse</h2>
          <p className="text-xs text-gray-400 mt-0.5">Fill in the left panel — the card updates live on the right.</p>
        </div>
        <button onClick={() => window.print()} className="bg-seafoam text-navy text-sm font-semibold px-4 py-2 rounded-full hover:opacity-90">
          🖨 Print / Save PDF
        </button>
      </div>

      {/* TWO-PANEL LAYOUT */}
      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "32px", alignItems: "start" }}>

        {/* ── LEFT: FORM ── */}
        <div style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto", paddingRight: "4px" }} className="space-y-5">

          {/* Business info + Generate */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-navy font-semibold text-sm mb-3" style={{ fontFamily: "Georgia, serif" }}>Business Info</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className={lbl}>Business Name</label>
                <input className={inp} value={form.businessName} onChange={e => setField("businessName", e.target.value)} placeholder="e.g. Anchor Coffee Co." />
              </div>
              <div>
                <label className={lbl}>Location</label>
                <input className={inp} value={form.location} onChange={e => setField("location", e.target.value)} placeholder="e.g. Asbury Park, NJ" />
              </div>
            </div>
            <button
              onClick={generatePulse}
              disabled={generating}
              className="w-full bg-navy text-white font-semibold text-sm py-2.5 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? "Generating with Claude…" : "⚡ Generate Pulse"}
            </button>
            {genError && <p className="text-red-500 text-xs mt-2">{genError}</p>}
          </div>

          {/* Intro text */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <label className={lbl}>Intro Text <span className="normal-case font-normal text-gray-400">(italic line below header)</span></label>
            <textarea rows={2} className={inp + " resize-y mt-1"} value={form.introText} onChange={e => setField("introText", e.target.value)} />
          </div>

          {/* Observations */}
          {([0, 1, 2] as const).map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-navy font-semibold text-sm" style={{ fontFamily: "Georgia, serif" }}>Observation {i + 1}</h3>
                <button
                  onClick={() => regenerateObservation(i)}
                  disabled={!!regenObs[i] || !form.businessName}
                  className="text-xs font-semibold text-seafoam border border-seafoam px-3 py-1 rounded-full hover:bg-seafoam hover:text-navy transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {regenObs[i] ? "…" : "↻ Regenerate"}
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className={lbl}>Label</label>
                  <input className={inp} value={form.obs[i].label} onChange={e => setObs(i, "label", e.target.value)} placeholder="e.g. Customer Experience" />
                </div>
                <div>
                  <label className={lbl}>Title</label>
                  <input className={inp} value={form.obs[i].title} onChange={e => setObs(i, "title", e.target.value)} placeholder="One sentence naming the insight" />
                </div>
                <div>
                  <label className={lbl}>Body</label>
                  <textarea rows={3} className={inp + " resize-y"} value={form.obs[i].body} onChange={e => setObs(i, "body", e.target.value)} placeholder="2-3 sentences with specificity..." />
                </div>
                <div>
                  <label className={lbl}>Your Notes <span className="normal-case font-normal text-gray-400">(for Regenerate)</span></label>
                  <textarea rows={2} className={inp + " resize-y bg-amber-50/40 border-amber-200"} value={form.obs[i].notes} onChange={e => setObs(i, "notes", e.target.value)} placeholder="Add your thoughts to refine this observation..." />
                </div>
              </div>
            </div>
          ))}

          {/* Footer + Contact */}
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="text-navy font-semibold text-sm mb-3" style={{ fontFamily: "Georgia, serif" }}>Footer & Back Panel</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className={lbl}>CTA Price</label>
                <input className={inp} value={form.ctaPrice} onChange={e => setField("ctaPrice", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Name</label>
                <input className={inp} value={form.analystName} onChange={e => setField("analystName", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Phone</label>
                <input className={inp} value={form.phone} onChange={e => setField("phone", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Email</label>
                <input className={inp} value={form.email} onChange={e => setField("email", e.target.value)} />
              </div>
              <div>
                <label className={lbl}>Website</label>
                <input className={inp} value={form.website} onChange={e => setField("website", e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: LIVE PREVIEW ── */}
        <div style={{ position: "sticky", top: "80px", overflowX: "auto" }}>
          {CardPreview}
        </div>

      </div>
    </div>
  );
}


// ── Main Dashboard ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [authed, setAuthed]         = useState(false);
  const [activeTab, setActiveTab]   = useState<"orders" | "pulse">("orders");
  const [orders, setOrders]         = useState<Order[]>([]);
  const [selected, setSelected]     = useState<Order | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [loading, setLoading]       = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/orders");
      const data = await res.json();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed && activeTab === "orders") fetchOrders();
  }, [authed, activeTab, fetchOrders]);

  if (!authed) return <LoginGate onAuth={() => setAuthed(true)} />;

  function handleManualSuccess(order: Order) {
    setOrders(prev => [order, ...prev]);
    setShowManual(false);
    setSelected(order);
  }

  return (
    <div className="min-h-screen bg-sand">
      <header className="bg-navy text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/logo.png"
            alt="Sea Glass Insights"
            className="h-8 w-auto"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div>
            <span className="text-xl font-bold tracking-wide" style={{ fontFamily: "Georgia, serif" }}>
              Sea Glass Insights
            </span>
            <span className="ml-3 text-seafoam text-sm hidden sm:inline">Analyst Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Tab navigation */}
          <nav className="flex gap-1 bg-white/10 rounded-full p-1">
            {(["orders", "pulse"] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSelected(null); setShowManual(false); }}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${
                  activeTab === tab
                    ? "bg-white text-navy"
                    : "text-white/70 hover:text-white"
                }`}
              >
                {tab === "orders" ? "Orders" : "Business Pulse"}
              </button>
            ))}
          </nav>
          {activeTab === "orders" && (
            <button onClick={fetchOrders} className="text-blue-300 hover:text-white text-sm transition-colors">
              ↻ Refresh
            </button>
          )}
        </div>
      </header>

      <main className={`${activeTab === "pulse" ? "max-w-screen-xl" : "max-w-4xl"} mx-auto px-4 py-10`}>
        {activeTab === "pulse" ? (
          <BusinessPulse />
        ) : loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-seafoam border-t-transparent rounded-full animate-spin" />
          </div>
        ) : showManual ? (
          <ManualOrderForm onSuccess={handleManualSuccess} onCancel={() => setShowManual(false)} />
        ) : selected ? (
          <OrderDetail order={selected} onBack={() => { setSelected(null); fetchOrders(); }} />
        ) : (
          <OrderList orders={orders} onSelect={setSelected} onCreateManual={() => setShowManual(true)} />
        )}
      </main>
    </div>
  );
}
