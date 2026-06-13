"use client";

import { useState, useRef } from "react";
import type { Order } from "@/lib/supabase";
import {
  VOC_PHASE1_SECTIONS,
  VOC_PHASE2_SECTIONS,
  SERVICE_DISPLAY_NAMES,
  SERVICE_TAG_COLORS,
  getEffectiveServiceType,
  getQuestionLabels,
} from "@/lib/serviceConfig";

type SectionMeta = { notes: string; locked: boolean; callout: string };
type MetaMap     = Record<string, SectionMeta>;

const AI_SECTIONS = [
  ...VOC_PHASE1_SECTIONS.filter(s => s.aiGenerated),
  ...VOC_PHASE2_SECTIONS.filter(s => s.aiGenerated),
];
const PHASE2_AI   = VOC_PHASE2_SECTIONS.filter(s => s.aiGenerated);

function defaultMeta(): MetaMap {
  return Object.fromEntries(
    AI_SECTIONS.map(s => [s.key, { notes: "", locked: false, callout: "" }])
  );
}

function initMeta(saved: Record<string, unknown> | null): MetaMap {
  const base = defaultMeta();
  if (!saved) return base;
  for (const k of Object.keys(base)) {
    const v = saved[k];
    if (v && typeof v === "object" && "locked" in (v as object)) {
      const sv = v as Partial<SectionMeta>;
      base[k] = { notes: sv.notes ?? "", locked: !!sv.locked, callout: sv.callout ?? "" };
    }
  }
  return base;
}

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered:   "bg-green-100 text-green-700",
};

interface Props { order: Order; onBack: () => void; }

export default function VoCDetail({ order: initialOrder, onBack }: Props) {
  const sd            = (initialOrder.service_data ?? {}) as Record<string, unknown>;
  const initPhase     = (sd.voc_phase as 1 | 2) ?? 1;
  const rawNote       = initialOrder.analyst_note ?? "";
  const hasUploadNote = rawNote.includes("contact-list:");
  const contactPath   = hasUploadNote
    ? rawNote.split("contact-list:")[1]?.trim() ?? null
    : null;
  const contactFilename = contactPath ? contactPath.split("/").slice(1).join("/") : null;

  const [order, setOrder]   = useState(initialOrder);
  const [phase, setPhase]   = useState<1 | 2>(initPhase);
  const [draft, setDraft]   = useState<Record<string, string>>(
    (initialOrder.ai_draft as Record<string, string>) ?? {}
  );
  const [vocResponses, setVocResp] = useState<string>((sd.voc_responses as string) ?? "");
  const [meta, setMeta]     = useState<MetaMap>(() =>
    initMeta(initialOrder.analyst_commentary as Record<string, unknown> | null)
  );
  const [analystNote, setNote] = useState(
    (sd.voc_closing_note as string) ??
    (hasUploadNote ? "" : rawNote === "Manual Order" ? "" : rawNote)
  );

  const [genPhase, setGenPhase]       = useState<1 | 2 | null>(null);
  const [genSectionIdx, setGenIdx]    = useState(-1);
  const [genError, setGenError]       = useState<string | null>(null);
  const [genFailed, setGenFailed]     = useState<Record<string, string>>({});
  const [retrying, setRetrying]       = useState<Record<string, boolean>>({});
  const [regenerating, setRegening]   = useState<Record<string, boolean>>({});
  const [regenError, setRegenError]   = useState<Record<string, string | undefined>>({});
  const [editingKey, setEditingKey]   = useState<string | null>(null);
  const [editBuf, setEditBuf]         = useState("");
  const [autoSaved, setAutoSaved]     = useState(false);
  const [saving, setSaving]           = useState(false);
  const [saveMsg, setSaveMsg]         = useState<string | null>(null);
  const [downloadingDocx, setDlDocx]  = useState(false);
  const [sendingReport, setSending]   = useState(false);
  const [sendMsg, setSendMsg]         = useState<string | null>(null);
  const [dlLinkUrl, setDlLinkUrl]     = useState<string | null>(null);
  const [dlLinkLoading, setDlLinkLoading] = useState(false);

  const metaTimer = useRef<NodeJS.Timeout | null>(null);
  const noteTimer = useRef<NodeJS.Timeout | null>(null);
  const respTimer = useRef<NodeJS.Timeout | null>(null);

  const hasDraft      = Object.keys(draft).length > 0;
  const lockedAI      = AI_SECTIONS.filter(s => meta[s.key]?.locked).length;
  const allLocked     = lockedAI === AI_SECTIONS.length;
  const phase2Locked  = PHASE2_AI.filter(s => meta[s.key]?.locked).length === PHASE2_AI.length;
  const svcType       = getEffectiveServiceType(order.service_type);
  const tagColor      = SERVICE_TAG_COLORS[svcType] ?? "bg-gray-100 text-gray-500";
  const questionLabels= getQuestionLabels("voice_of_customer_survey");

  function flashSaved() { setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2500); }

  async function persist(updates: Record<string, unknown>) {
    await fetch("/api/update-order-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, ...updates }),
    });
    flashSaved();
  }

  function schedMeta(m: MetaMap) {
    if (metaTimer.current) clearTimeout(metaTimer.current);
    metaTimer.current = setTimeout(() => persist({ analyst_commentary: m }), 2000);
  }

  function schedNote(n: string) {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => persist({
      service_data: { ...sd, voc_closing_note: n, voc_responses: vocResponses, voc_phase: phase },
    }), 2000);
  }

  function schedResp(r: string) {
    if (respTimer.current) clearTimeout(respTimer.current);
    respTimer.current = setTimeout(() => persist({
      service_data: { ...sd, voc_responses: r, voc_phase: phase },
    }), 2000);
  }

  function lockSection(key: string) {
    const u = { ...meta, [key]: { ...meta[key], locked: true } };
    setMeta(u); setEditingKey(null); persist({ analyst_commentary: u });
  }

  function unlockSection(key: string) {
    const u = { ...meta, [key]: { ...meta[key], locked: false } };
    setMeta(u); persist({ analyst_commentary: u });
  }

  async function markPhase1Complete() {
    if (!confirm("Mark Phase 1 complete? This unlocks Phase 2 — Analysis.")) return;
    setPhase(2);
    await persist({ service_data: { ...sd, voc_phase: 2 } });
  }

  async function generatePhase1() {
    setGenPhase(1);
    setGenError(null);
    setGenFailed(prev => { const n = { ...prev }; delete n["survey_design"]; return n; });
    try {
      const res  = await fetch("/api/generate-voc-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: "survey_design" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraft(prev => ({ ...prev, survey_design: data.content as string }));
      const reset = defaultMeta(); setMeta(reset); persist({ analyst_commentary: reset });
    } catch (e) {
      setGenFailed(prev => ({ ...prev, survey_design: e instanceof Error ? e.message : "Failed" }));
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenPhase(null);
    }
  }

  async function generatePhase2() {
    if (!vocResponses.trim()) {
      setGenError("Paste your survey responses in the Response Summary field before generating analysis.");
      return;
    }
    setGenPhase(2);
    setGenError(null);
    setGenIdx(-1);

    for (let i = 0; i < PHASE2_AI.length; i++) {
      const section = PHASE2_AI[i];
      setGenIdx(i);
      setGenFailed(prev => { const n = { ...prev }; delete n[section.key]; return n; });
      try {
        const res  = await fetch("/api/generate-voc-section", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            sectionKey: section.key,
            vocResponses,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Section generation failed");
        setDraft(prev => ({ ...prev, [section.key]: data.content as string }));
      } catch (e) {
        setGenFailed(prev => ({ ...prev, [section.key]: e instanceof Error ? e.message : "Failed" }));
      }
    }

    setGenPhase(null);
    setGenIdx(-1);
  }

  async function retrySection(key: string) {
    setGenFailed(prev => { const n = { ...prev }; delete n[key]; return n; });
    setRetrying(prev => ({ ...prev, [key]: true }));
    try {
      const res  = await fetch("/api/generate-voc-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: key, vocResponses }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Retry failed");
      setDraft(prev => ({ ...prev, [key]: data.content as string }));
    } catch (e) {
      setGenFailed(prev => ({ ...prev, [key]: e instanceof Error ? e.message : "Retry failed" }));
    } finally {
      setRetrying(prev => ({ ...prev, [key]: false }));
    }
  }

  async function regenerateSection(key: string) {
    setRegening(p => ({ ...p, [key]: true }));
    setRegenError(p => ({ ...p, [key]: undefined }));
    try {
      const res  = await fetch("/api/regenerate-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: key, analystNotes: meta[key]?.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDraft(p => ({ ...p, [key]: data.content as string }));
      flashSaved();
    } catch (e) {
      setRegenError(p => ({ ...p, [key]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setRegening(p => ({ ...p, [key]: false }));
    }
  }

  async function saveReport() {
    setSaving(true); setSaveMsg(null);
    const newStatus = order.status === "new" ? "in_progress" : order.status;
    await fetch("/api/update-order-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id, ai_draft: draft, analyst_commentary: meta, status: newStatus,
        service_data: { ...sd, voc_responses: vocResponses, voc_phase: phase, voc_closing_note: analystNote },
      }),
    });
    setOrder(p => ({ ...p, status: newStatus as Order["status"] }));
    setSaveMsg("All changes saved."); setTimeout(() => setSaveMsg(null), 3000); setSaving(false);
  }

  async function downloadDocx() {
    setDlDocx(true);
    try {
      const analystPerspectives = Object.fromEntries(
        AI_SECTIONS.map(s => [s.key, meta[s.key]?.callout ?? ""])
      );
      const res = await fetch("/api/generate-voc-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id, analystNote, aiDraft: draft, analystPerspectives, vocResponses,
        }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SeaGlassInsights-${order.business_name.replace(/[^a-zA-Z0-9]/g, "")}-VoiceOfCustomerReport.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "Report generation failed"); }
    finally { setDlDocx(false); }
  }

  async function sendReport() {
    if (!confirm(`Send the report to ${order.email}?`)) return;
    setSending(true); setSendMsg(null);
    try {
      const res  = await fetch("/api/send-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setOrder(p => ({ ...p, status: "delivered" }));
      setSendMsg(`Report sent to ${order.email}`);
    } catch (e) { setSendMsg(`Error: ${e instanceof Error ? e.message : "Unknown"}`); }
    finally { setSending(false); setTimeout(() => setSendMsg(null), 6000); }
  }

  async function fetchDownloadLink() {
    if (!contactPath || dlLinkUrl) return;
    setDlLinkLoading(true);
    try {
      const res  = await fetch(`/api/get-contact-list-url?path=${encodeURIComponent(contactPath)}`);
      const data = await res.json();
      if (res.ok && data.url) setDlLinkUrl(data.url as string);
    } catch { /* non-blocking */ }
    finally { setDlLinkLoading(false); }
  }

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300";
  const lbl = "text-xs font-semibold text-gray-400 uppercase tracking-wide block";

  // ── Renders a single AI section ────────────────────────────────────────────
  function renderSection(key: string, label: string, sectionNum: number, totalSections: number) {
    const m          = meta[key] ?? { notes: "", locked: false, callout: "" };
    const content    = draft[key] ?? "";
    const isEditing  = editingKey === key;
    const isRegen    = !!regenerating[key];
    const err        = regenError[key];
    const isFailed   = !!genFailed[key];
    const isRetrying = !!retrying[key];

    return (
      <div key={key} className="border-t border-gray-100 py-5 first:border-0 first:pt-0">

        {/* Section header */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full shrink-0">
            Section {sectionNum} of {totalSections}
          </span>
          <h5 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
            {label}
          </h5>
          {m.locked && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              ✓ Locked
            </span>
          )}
        </div>

        {/* Edit / Lock controls */}
        <div className="flex items-center gap-2 mb-3 justify-end">
          {!m.locked && !isEditing && content && !isFailed && !isRetrying && (
            <button
              onClick={() => { setEditBuf(content); setEditingKey(key); }}
              className="text-xs text-seafoam hover:text-navy border border-seafoam/40 hover:border-navy/40 rounded-full px-3 py-1 transition-colors font-medium">
              Edit
            </button>
          )}
          {m.locked ? (
            <button onClick={() => unlockSection(key)}
              className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
              Unlock
            </button>
          ) : (
            content && !isFailed && !isRetrying && (
              <button onClick={() => lockSection(key)}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">
                Lock Section
              </button>
            )
          )}
        </div>

        {/* Content / editing / retrying / failed */}
        {isRetrying ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <div className="w-4 h-4 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            <span>Retrying…</span>
          </div>
        ) : isFailed ? (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-3">{genFailed[key]}</p>
            <button
              onClick={() => retrySection(key)}
              className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-4 py-2 rounded-full transition-colors">
              ↺ Retry this section
            </button>
          </div>
        ) : isEditing ? (
          <div className="mb-3">
            <textarea
              rows={12} value={editBuf}
              onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed"
              autoFocus />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const u = { ...draft, [key]: editBuf };
                  setDraft(u); setEditingKey(null); persist({ ai_draft: u });
                }}
                className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition-colors">
                Apply Changes
              </button>
              <button onClick={() => setEditingKey(null)}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{content}</p>
        ) : (
          <p className="text-sm text-gray-300 italic mb-3">Generate draft to populate this section.</p>
        )}

        {/* Analyst Perspective callout */}
        <div className="mb-3 border-l-4 border-navy/60 pl-4 py-3 bg-slate-50 rounded-r-lg">
          <label
            className="block mb-2"
            style={{
              fontFamily: "'Montserrat', system-ui, sans-serif",
              fontSize: "0.65rem", fontWeight: 700,
              letterSpacing: "0.12em", color: "#0A2F61", textTransform: "uppercase",
            }}>
            Analyst Perspective
          </label>
          <textarea
            rows={3} value={m.callout}
            onChange={e => {
              const u = { ...meta, [key]: { ...m, callout: e.target.value } };
              setMeta(u); schedMeta(u);
            }}
            placeholder="Your expert take on what this finding means for this client specifically…"
            disabled={m.locked}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/20 resize-y placeholder-gray-300 bg-white disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">
            Optional — appears in the report with a navy accent border if filled in.
          </p>
        </div>

        {/* Analyst notes + regen */}
        {!m.locked && (
          <div className="pt-2 border-t border-gray-50 space-y-2">
            <label className={lbl}>Analyst Notes for Regeneration</label>
            <textarea
              rows={2} value={m.notes}
              onChange={e => {
                const u = { ...meta, [key]: { ...m, notes: e.target.value } };
                setMeta(u); schedMeta(u);
              }}
              placeholder="Your direction for regenerating this section…"
              className={`${inp} resize-y`} />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button
              onClick={() => regenerateSection(key)}
              disabled={isRegen || !hasDraft}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isRegen
                ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Regenerating…</>
                : "↺ Regenerate This Section"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const answers = [order.q1, order.q2, order.q3, order.q4, order.q5, order.q6, order.q7];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-navy transition-colors">
          ← All Orders
        </button>
        <div className="h-4 w-px bg-gray-200" />
        <h2 className="text-navy text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>
          {order.business_name}
        </h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagColor}`}>
          {SERVICE_DISPLAY_NAMES[svcType]}
        </span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] ?? STATUS_COLORS.new}`}>
          {order.status.replace("_", " ")}
        </span>
        {autoSaved && <span className="text-xs text-green-500 font-medium ml-auto">✓ Auto-saved</span>}
      </div>

      {/* Phase indicator */}
      <div className="flex items-center mb-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className={`flex-1 flex items-center gap-2 px-5 py-3.5 ${phase === 1 ? "bg-teal-50 border-b-2 border-teal-400" : "bg-white"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${phase > 1 ? "bg-green-400 text-white" : "bg-teal-400 text-white"}`}>
            {phase > 1 ? "✓" : "1"}
          </span>
          <div>
            <p className="text-xs font-semibold text-navy">Phase 1</p>
            <p className="text-xs text-gray-500">Survey Design</p>
          </div>
        </div>
        <div className="w-px h-12 bg-gray-100" />
        <div className={`flex-1 flex items-center gap-2 px-5 py-3.5 ${phase === 2 ? "bg-teal-50 border-b-2 border-teal-400" : "bg-gray-50"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${phase === 2 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
            2
          </span>
          <div>
            <p className={`text-xs font-semibold ${phase === 2 ? "text-navy" : "text-gray-400"}`}>Phase 2</p>
            <p className={`text-xs ${phase === 2 ? "text-gray-500" : "text-gray-300"}`}>
              Analysis {phase === 1 ? "— locked until Phase 1 complete" : ""}
            </p>
          </div>
        </div>
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
        <div><span className="text-gray-400">Order ID</span><p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0, 8)}…</p></div>
      </div>

      {/* Contact list upload indicator */}
      {contactPath && (
        <div className="bg-white rounded-xl border border-teal-200 px-6 py-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Contact List Uploaded</p>
              <p className="text-sm text-navy font-medium truncate">{contactFilename ?? contactPath}</p>
            </div>
            {dlLinkUrl ? (
              <a href={dlLinkUrl} target="_blank" rel="noopener noreferrer"
                className="text-xs bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-4 py-1.5 rounded-full hover:bg-teal-100 transition-colors shrink-0">
                ⬇ Download
              </a>
            ) : (
              <button onClick={fetchDownloadLink} disabled={dlLinkLoading}
                className="text-xs bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-4 py-1.5 rounded-full hover:bg-teal-100 transition-colors shrink-0 disabled:opacity-50">
                {dlLinkLoading ? "Loading…" : "Get Download Link"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Intake answers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>Intake Answers</h3>
        <div className="space-y-4">
          {questionLabels.map((q, i) => {
            const a = answers[i];
            if (!a || q === "(not used)") return null;
            return (
              <div key={i}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Q{i + 1} — {q}</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PHASE 1 ── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 ${phase === 1 ? "border-teal-200" : "border-gray-100"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase > 1 ? "bg-green-400 text-white" : "bg-teal-400 text-white"}`}>
              {phase > 1 ? "✓" : "1"}
            </span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              Phase 1 — Survey Design
            </h3>
          </div>
          <button
            onClick={generatePhase1}
            disabled={genPhase !== null}
            className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {genPhase === 1 ? "Generating…" : draft.survey_design ? "Regenerate Survey" : "Generate Survey Design"}
          </button>
        </div>

        {genPhase === 1 && (
          <div className="flex items-center gap-3 py-4 text-gray-500 text-sm">
            <div className="w-4 h-4 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            Designing survey questions…
          </div>
        )}

        {genError && genPhase === null && !draft.survey_design && (
          <p className="text-red-500 text-sm mb-4">{genError}</p>
        )}

        {(draft.survey_design || genFailed.survey_design) && genPhase === null && (
          <div>
            {renderSection("survey_design", "Survey Design", 1, 1)}
            {draft.survey_design && (
              <p className="text-xs text-gray-400 mt-2 italic">
                Copy these questions directly into Google Forms or your preferred survey tool. Return to Phase 2 once responses are collected.
              </p>
            )}
          </div>
        )}

        {phase === 1 && draft.survey_design && meta.survey_design?.locked && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <button onClick={markPhase1Complete}
              className="bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-teal-600 transition-colors">
              ✓ Phase 1 Complete — Unlock Phase 2 Analysis
            </button>
            <p className="text-xs text-gray-400 mt-1.5">
              Mark complete when you have collected responses and are ready to run analysis.
            </p>
          </div>
        )}
      </div>

      {/* ── PHASE 2 ── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 transition-opacity ${phase === 1 ? "border-gray-100 opacity-40 pointer-events-none" : "border-teal-200"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase === 2 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
              2
            </span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              Phase 2 — Analysis
            </h3>
            {phase === 1 && <span className="text-xs text-gray-400">(Locked until Phase 1 complete)</span>}
          </div>
          {phase === 2 && (
            <button
              onClick={generatePhase2}
              disabled={genPhase !== null || !vocResponses.trim()}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {genPhase === 2 ? "Generating…" : phase2Locked ? "Regenerate Analysis" : "Generate Analysis"}
            </button>
          )}
        </div>

        {phase === 2 && (
          <>
            {genError && genPhase === null && (
              <p className="text-red-500 text-sm mb-4">{genError}</p>
            )}

            {/* Response Summary — human entry */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
                Response Summary
              </label>
              <p className="text-xs text-gray-400 mb-2">
                Paste your collected survey responses here before generating analysis.
              </p>
              <textarea
                rows={10} value={vocResponses}
                onChange={e => { setVocResp(e.target.value); schedResp(e.target.value); }}
                placeholder="Paste survey responses here — can be raw CSV export, copied text from Google Forms, or a summary of responses…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y font-mono text-xs placeholder-gray-300"
              />
            </div>

            {/* Phase 2 generation progress checklist */}
            {genPhase === 2 && (
              <div className="py-3 space-y-1.5 mb-4">
                {PHASE2_AI.map((section, i) => {
                  const isDone    = !!draft[section.key];
                  const isActive  = genSectionIdx === i;
                  const isPending = !isDone && !isActive;
                  return (
                    <div key={section.key} className="flex items-center gap-2.5">
                      {isDone    && <span className="text-green-500 text-xs shrink-0">✓</span>}
                      {isActive  && <div className="w-3 h-3 border-2 border-seafoam border-t-transparent rounded-full animate-spin shrink-0" />}
                      {isPending && <span className="text-gray-200 text-xs shrink-0">○</span>}
                      <span className={`text-sm ${isDone ? "text-gray-500" : isActive ? "text-navy font-medium" : "text-gray-300"}`}>
                        {section.label}
                        {isActive && (
                          <span className="text-xs text-gray-400 ml-2 font-normal">
                            {i + 1} of {PHASE2_AI.length}
                          </span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Phase 2 AI sections */}
            {PHASE2_AI.map((section, i) =>
              renderSection(section.key, section.label, i + 2, PHASE2_AI.length + 1)
            )}

            {/* Analyst Note */}
            <div className="border-t-2 border-dashed border-teal-200 pt-5 mt-4">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
                Section {PHASE2_AI.length + 2} — Analyst Note
              </label>
              <p className="text-xs text-gray-400 mb-2 leading-relaxed">
                Write one warm, personal closing paragraph in your own voice. Auto-saved as you type.
              </p>
              <textarea
                rows={5} value={analystNote}
                onChange={e => { setNote(e.target.value); schedNote(e.target.value); }}
                placeholder="Your personal closing note to the client…"
                className={inp}
              />
            </div>

            {/* Actions */}
            <div className="pt-5 mt-4 border-t border-dashed border-seagreen/30 flex items-center gap-3 flex-wrap">
              <button onClick={saveReport} disabled={saving}
                className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Saving…" : "Save Report"}
              </button>
              <button onClick={downloadDocx} disabled={!allLocked || downloadingDocx}
                className="bg-seagreen text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {downloadingDocx ? "Building Report…" : "⬇ Save as Word Document"}
              </button>
              <button onClick={sendReport}
                disabled={sendingReport || order.status === "delivered" || !allLocked}
                className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                {sendingReport ? "Sending…" : order.status === "delivered" ? "✓ Sent" : "✉ Send to Customer"}
              </button>
              {!allLocked && hasDraft && (
                <p className="text-xs text-amber-600 font-medium">
                  Lock all {AI_SECTIONS.length} sections to enable download and send
                  ({lockedAI}/{AI_SECTIONS.length} locked)
                </p>
              )}
              {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
              {sendMsg && (
                <span className={`text-sm font-medium ${sendMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                  {sendMsg}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Order Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Order Actions
        </h3>
        {order.status === "new" && (
          <button onClick={async () => {
            await fetch("/api/update-order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status: "in_progress" }) });
            setOrder(p => ({ ...p, status: "in_progress" }));
          }} className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200 transition-colors">
            Mark In Progress
          </button>
        )}
        {(order.status === "new" || order.status === "in_progress") && (
          <button onClick={async () => {
            await fetch("/api/update-order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status: "delivered" }) });
            setOrder(p => ({ ...p, status: "delivered" }));
          }} className="bg-seagreen text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
            Mark Delivered
          </button>
        )}
        {order.status === "delivered" && <span className="text-sm text-green-600 font-semibold py-2">Report delivered.</span>}
      </div>
    </div>
  );
}
