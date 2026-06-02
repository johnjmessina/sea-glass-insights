"use client";

import { useState, useRef } from "react";
import type { Order } from "@/lib/supabase";
import { SERVICE_DISPLAY_NAMES, SERVICE_TAG_COLORS, getEffectiveServiceType, VOC_PHASE1_SECTIONS, VOC_PHASE2_SECTIONS } from "@/lib/serviceConfig";

type SectionMeta = { notes: string; locked: boolean };
type MetaMap     = Record<string, SectionMeta>;

const ALL_SECTIONS = [...VOC_PHASE1_SECTIONS, ...VOC_PHASE2_SECTIONS];

function defaultMeta(): MetaMap {
  return Object.fromEntries(ALL_SECTIONS.map(s => [s.key, { notes: "", locked: false }]));
}
function initMeta(saved: Record<string, unknown> | null): MetaMap {
  const base = defaultMeta();
  if (!saved) return base;
  for (const k of Object.keys(base)) {
    const v = saved[k];
    if (v && typeof v === "object" && "locked" in (v as object)) base[k] = v as SectionMeta;
  }
  return base;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
};

export default function VoCDetail({ order: initialOrder, onBack }: { order: Order; onBack: () => void }) {
  const sd        = (initialOrder.service_data ?? {}) as Record<string, unknown>;
  const initPhase = (sd.voc_phase as 1 | 2) ?? 1;

  const [order, setOrder]         = useState(initialOrder);
  const [phase, setPhase]         = useState<1 | 2>(initPhase);
  const [draft, setDraft]         = useState<Record<string, string>>(
    (initialOrder.ai_draft as Record<string, string>) ?? {}
  );
  const [vocResponses, setVocResp] = useState<string>((sd.voc_responses as string) ?? "");
  const [meta, setMeta]           = useState<MetaMap>(() =>
    initMeta(initialOrder.analyst_commentary as Record<string, unknown> | null)
  );
  const [analystNote, setNote]    = useState(
    initialOrder.analyst_note === "Manual Order" ? "" : (initialOrder.analyst_note ?? "")
  );
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState<string | null>(null);
  const [regenerating, setRegen]    = useState<Record<string, boolean>>({});
  const [regenError, setRegenErr]   = useState<Record<string, string | undefined>>({});
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editBuf, setEditBuf]       = useState("");
  const [autoSaved, setAutoSaved]   = useState(false);
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState<string | null>(null);
  const [sendingReport, setSending] = useState(false);
  const [sendMsg, setSendMsg]       = useState<string | null>(null);

  const metaTimer  = useRef<NodeJS.Timeout | null>(null);
  const noteTimer  = useRef<NodeJS.Timeout | null>(null);
  const respTimer  = useRef<NodeJS.Timeout | null>(null);

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
    noteTimer.current = setTimeout(() => persist({ analyst_note: n }), 2000);
  }
  function schedResp(r: string) {
    if (respTimer.current) clearTimeout(respTimer.current);
    respTimer.current = setTimeout(() => persist({
      service_data: { ...(order.service_data ?? {}), voc_responses: r, voc_phase: phase },
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
    const newPhase: 2 = 2;
    setPhase(newPhase);
    await persist({
      service_data: { ...(order.service_data ?? {}), voc_phase: newPhase },
    });
  }

  async function generateDraft() {
    setGenerating(true); setGenError(null); setEditingKey(null);
    try {
      const res = await fetch("/api/generate-draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          vocPhase: phase,
          vocResponses: phase === 2 ? vocResponses : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraft(data.draft as Record<string, string>);
      const reset = defaultMeta(); setMeta(reset); persist({ analyst_commentary: reset });
    } catch (e) { setGenError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setGenerating(false); }
  }

  async function regenerateSection(key: string) {
    setRegen(p => ({ ...p, [key]: true }));
    setRegenErr(p => ({ ...p, [key]: undefined }));
    try {
      const res = await fetch("/api/regenerate-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: key, analystNotes: meta[key]?.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDraft(p => ({ ...p, [key]: data.content as string }));
      flashSaved();
    } catch (e) { setRegenErr(p => ({ ...p, [key]: e instanceof Error ? e.message : "Failed" })); }
    finally { setRegen(p => ({ ...p, [key]: false })); }
  }

  async function saveReport() {
    setSaving(true); setSaveMsg(null);
    const newStatus = order.status === "new" ? "in_progress" : order.status;
    await fetch("/api/update-order-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id, ai_draft: draft, analyst_note: analystNote,
        analyst_commentary: meta, status: newStatus,
        service_data: { ...(order.service_data ?? {}), voc_phase: phase, voc_responses: vocResponses },
      }),
    });
    setOrder(p => ({ ...p, status: newStatus as Order["status"] }));
    setSaveMsg("All changes saved."); setTimeout(() => setSaveMsg(null), 3000); setSaving(false);
  }

  async function sendReport() {
    if (!confirm(`Send the report to ${order.email}?`)) return;
    setSending(true); setSendMsg(null);
    try {
      const res = await fetch("/api/send-report", {
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

  const inp = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam";
  const lbl = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

  const currentSections = phase === 1 ? VOC_PHASE1_SECTIONS : VOC_PHASE2_SECTIONS;
  const aiSections      = currentSections.filter(s => s.aiGenerated);
  const hasDraft        = Object.keys(draft).length > 0;
  const lockedCount     = aiSections.filter(s => meta[s.key]?.locked).length;
  const allLocked       = phase === 2 && lockedCount === aiSections.length;
  const svcType         = getEffectiveServiceType(order.service_type);
  const tagColor        = SERVICE_TAG_COLORS[svcType];

  function renderSection(key: string, label: string, aiGenerated: boolean, description?: string) {
    const m         = meta[key] ?? { notes: "", locked: false };
    const content   = draft[key] ?? "";
    const isEditing = editingKey === key;
    const isRegen   = !!regenerating[key];
    const err       = regenError[key];

    return (
      <div key={key} className="border-t border-gray-100 py-4 first:border-0 first:pt-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`w-1 h-4 rounded-full shrink-0 ${m.locked ? "bg-green-400" : "bg-teal-400"}`} />
            <h5 className="font-semibold text-navy text-sm">{label}</h5>
            {!aiGenerated && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human entry</span>}
            {m.locked && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Locked</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!m.locked && !isEditing && (
              <button onClick={() => { setEditBuf(content); setEditingKey(key); }}
                className="text-xs text-seafoam hover:text-navy border border-seafoam/40 rounded-full px-3 py-1 transition-colors font-medium">
                Edit
              </button>
            )}
            {m.locked ? (
              <button onClick={() => unlockSection(key)} className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Unlock</button>
            ) : (
              <button onClick={() => lockSection(key)}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">
                Lock Section
              </button>
            )}
          </div>
        </div>

        {description && !content && <p className="text-xs text-gray-400 italic mb-2">{description}</p>}

        {isEditing ? (
          <div>
            <textarea rows={key === "survey_design" ? 16 : 10} value={editBuf}
              onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y font-mono"
              autoFocus />
            <div className="flex gap-2 mt-2">
              <button onClick={() => {
                const u = { ...draft, [key]: editBuf };
                setDraft(u); setEditingKey(null); persist({ ai_draft: u });
              }} className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:bg-seafoam-dark transition-colors">
                Apply Changes
              </button>
              <button onClick={() => setEditingKey(null)} className="text-xs text-gray-400 px-3 py-1.5">Cancel</button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          !aiGenerated
            ? <button onClick={() => { setEditBuf(""); setEditingKey(key); }}
                className="text-xs text-seafoam border border-seafoam/40 rounded-full px-3 py-1.5 transition-colors font-medium mt-1">
                + Paste content
              </button>
            : <p className="text-sm text-gray-300 italic">Generate draft to populate this section.</p>
        )}

        {aiGenerated && !m.locked && (
          <div className="mt-3 pt-2 border-t border-gray-50 space-y-2">
            <label className={lbl}>Analyst Notes</label>
            <textarea rows={2} value={m.notes}
              onChange={e => { const u = { ...meta, [key]: { ...m, notes: e.target.value } }; setMeta(u); schedMeta(u); }}
              placeholder="Direction for this section…"
              className={inp + " resize-y placeholder-gray-300"} />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button onClick={() => regenerateSection(key)} disabled={isRegen || !hasDraft}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50">
              {isRegen ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Regenerating…</> : "↺ Regenerate"}
            </button>
          </div>
        )}
      </div>
    );
  }

  const answers = [order.q1, order.q2, order.q3, order.q4, order.q5, order.q6, order.q7];
  const qLabels = ["Business name and location", "Industry / business type", "Customer contacts", "How contacts were collected", "What you most want to learn", "Prior surveys and findings", "What decision this informs"];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-navy transition-colors">← All Orders</button>
        <div className="h-4 w-px bg-gray-200" />
        <h2 className="text-navy text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{order.business_name}</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagColor}`}>{SERVICE_DISPLAY_NAMES[svcType]}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] ?? ""}`}>{order.status.replace("_", " ")}</span>
        {autoSaved && <span className="text-xs text-green-500 font-medium ml-auto">✓ Auto-saved</span>}
      </div>

      {/* Phase indicator */}
      <div className="flex items-center gap-0 mb-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className={`flex-1 flex items-center gap-2 px-5 py-3 ${phase === 1 ? "bg-teal-50 border-b-2 border-teal-400" : "bg-white"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${phase === 1 ? "bg-teal-400 text-white" : "bg-green-400 text-white"}`}>
            {phase > 1 ? "✓" : "1"}
          </span>
          <div>
            <p className="text-xs font-semibold text-navy">Phase 1</p>
            <p className="text-xs text-gray-500">Survey Design</p>
          </div>
        </div>
        <div className="w-px h-full bg-gray-100" />
        <div className={`flex-1 flex items-center gap-2 px-5 py-3 ${phase === 2 ? "bg-teal-50 border-b-2 border-teal-400" : "bg-gray-50"}`}>
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${phase === 2 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>2</span>
          <div>
            <p className={`text-xs font-semibold ${phase === 2 ? "text-navy" : "text-gray-400"}`}>Phase 2</p>
            <p className={`text-xs ${phase === 2 ? "text-gray-500" : "text-gray-300"}`}>Analysis {phase === 1 ? "(locked until Phase 1 complete)" : ""}</p>
          </div>
        </div>
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-navy mt-0.5">{order.customer_name}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-semibold text-navy mt-0.5">{order.email}</p></div>
        <div><span className="text-gray-400">Submitted</span>
          <p className="font-semibold text-navy mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>

      {/* Intake */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>Intake Answers</h3>
        <div className="space-y-3">
          {qLabels.map((q, i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Q{i + 1} — {q}</p>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {answers[i] ?? <span className="italic text-gray-300">No answer</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Phase 1 */}
      <div className={`bg-white rounded-xl border mb-6 p-6 ${phase === 1 ? "border-teal-200" : "border-gray-100"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-teal-400 text-white flex items-center justify-center text-xs font-bold">1</span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 1 — Survey Design</h3>
          </div>
          <button onClick={generateDraft} disabled={generating || phase !== 1}
            className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50">
            {generating && phase === 1 ? "Generating…" : draft.survey_design ? "Regenerate Survey" : "Generate Survey Design"}
          </button>
        </div>
        {genError && phase === 1 && <p className="text-red-500 text-sm mb-4">{genError}</p>}
        {generating && phase === 1 && (
          <div className="flex items-center gap-3 py-6 justify-center text-gray-400">
            <div className="w-5 h-5 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Claude is designing your survey…</span>
          </div>
        )}
        {renderSection("survey_design", "Survey Design", true, "AI drafts up to 10 survey questions formatted for Google Forms.")}
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

      {/* Phase 2 */}
      <div className={`bg-white rounded-xl border mb-6 p-6 ${phase === 2 ? "border-teal-200" : "border-gray-100 opacity-50 pointer-events-none"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase === 2 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>2</span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 2 — Analysis</h3>
            {phase === 1 && <span className="text-xs text-gray-400">(Locked until Phase 1 complete)</span>}
          </div>
          {phase === 2 && (
            <button onClick={generateDraft} disabled={generating || !vocResponses.trim()}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50">
              {generating ? "Generating…" : "Generate Analysis"}
            </button>
          )}
        </div>

        {phase === 2 && (
          <>
            {genError && <p className="text-red-500 text-sm mb-4">{genError}</p>}

            {/* Response Summary — human entry */}
            <div className="mb-6">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Response Summary — Paste your collected responses here
              </label>
              <textarea rows={10} value={vocResponses}
                onChange={e => { setVocResp(e.target.value); schedResp(e.target.value); }}
                placeholder="Paste survey responses here — can be raw CSV export, copied text from Google Forms, or a summary of responses…"
                className={inp + " resize-y font-mono text-xs"} />
            </div>

            {VOC_PHASE2_SECTIONS.filter(s => s.key !== "response_summary").map(s =>
              renderSection(s.key, s.label, s.aiGenerated, s.description)
            )}

            {/* Analyst Note */}
            <div className="border-t-2 border-dashed border-teal-200 pt-5 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-4 bg-teal-400 rounded-full" />
                <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>Analyst Note</h4>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human entry</span>
              </div>
              <p className="text-xs text-gray-400 ml-3 mb-2">Closing note in your own voice. Auto-saved.</p>
              <textarea rows={4} value={analystNote}
                onChange={e => { setNote(e.target.value); schedNote(e.target.value); }}
                placeholder="Your personal closing note to the client…"
                className={inp + " resize-y"} />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap pt-5">
              <button onClick={saveReport} disabled={saving}
                className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save Report"}
              </button>
              <button onClick={sendReport}
                disabled={sendingReport || order.status === "delivered" || !hasDraft || !allLocked}
                className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                {sendingReport ? "Sending…" : order.status === "delivered" ? "✓ Sent" : "✉ Send to Customer"}
              </button>
              {!allLocked && hasDraft && <p className="text-xs text-amber-600 font-medium">Lock all Phase 2 sections to enable sending</p>}
              {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
              {sendMsg && <span className={`text-sm font-medium ${sendMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{sendMsg}</span>}
            </div>
          </>
        )}
      </div>

      {/* Status actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>Order Actions</h3>
        {order.status === "new" && (
          <button onClick={async () => {
            await fetch("/api/update-order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status: "in_progress" }) });
            setOrder(p => ({ ...p, status: "in_progress" }));
          }} className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200">Mark In Progress</button>
        )}
        {(order.status === "new" || order.status === "in_progress") && (
          <button onClick={async () => {
            await fetch("/api/update-order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status: "delivered" }) });
            setOrder(p => ({ ...p, status: "delivered" }));
          }} className="bg-seagreen text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90">Mark Delivered</button>
        )}
        {order.status === "delivered" && <span className="text-sm text-green-600 font-semibold py-2">Report delivered.</span>}
      </div>
    </div>
  );
}
