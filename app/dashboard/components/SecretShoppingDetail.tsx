"use client";

import { useState, useRef } from "react";
import type { Order } from "@/lib/supabase";
import type { SSVisitOverview, SSAnalystObs, ServiceData } from "@/lib/supabase";
import { SERVICE_DISPLAY_NAMES, SERVICE_TAG_COLORS, getEffectiveServiceType, SS_NARRATIVE_SECTIONS } from "@/lib/serviceConfig";
import { SecretShoppingScorecard, SS_DIMENSIONS } from "./SecretShoppingScorecard";

type SectionMeta = { notes: string; locked: boolean };
type MetaMap     = Record<string, SectionMeta>;

function defaultMeta(): MetaMap {
  return Object.fromEntries(
    SS_NARRATIVE_SECTIONS.map(s => [s.key, { notes: "", locked: false }])
  );
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

const SECTION_LABELS = ["Visit Overview", "Experience Scorecard", "Analyst Observations", "Narrative Notes", "Summary & Recommendations", "Analyst Note"];
const NARRATIVE_ONLY = SS_NARRATIVE_SECTIONS.filter(s => s.key !== "summary_and_recommendations");

export default function SecretShoppingDetail({ order: initialOrder, onBack }: { order: Order; onBack: () => void }) {
  const sd = (initialOrder.service_data ?? {}) as ServiceData;

  const [order, setOrder]         = useState(initialOrder);
  const [activeSection, setActive] = useState<1|2|3|4|5|6>(1);
  const [visitOverview, setVO]     = useState<SSVisitOverview>(sd.ss_visit_overview ?? {
    business_name: "", location: "", date_of_visit: "", time_of_visit: "", shopper_scenario: "", template_used: "",
  });
  const [scorecard, setScorecard]  = useState<Record<string, boolean | number>>(sd.ss_scorecard ?? {});
  const [analystObs, setObs]       = useState<SSAnalystObs>(sd.ss_analyst_obs ?? {
    best_moment: "", biggest_miss: "", immediate_fix: "", additional_observations: "",
  });
  const [narrativeDraft, setNarr]  = useState<Record<string, string>>(
    (initialOrder.ai_draft as Record<string, string>) ?? {}
  );
  const [meta, setMeta]            = useState<MetaMap>(() =>
    initMeta(initialOrder.analyst_commentary as Record<string, unknown> | null)
  );
  const [analystNote, setNote]     = useState(
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
  const [scorecardStep, setScorecardStep] = useState(0);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [narrativeStep, setNarrativeStep] = useState(0);

  const voTimer   = useRef<NodeJS.Timeout | null>(null);
  const scTimer   = useRef<NodeJS.Timeout | null>(null);
  const obsTimer  = useRef<NodeJS.Timeout | null>(null);
  const metaTimer = useRef<NodeJS.Timeout | null>(null);
  const noteTimer = useRef<NodeJS.Timeout | null>(null);

  function flashSaved() { setAutoSaved(true); setTimeout(() => setAutoSaved(false), 2500); }

  async function persist(updates: Record<string, unknown>) {
    await fetch("/api/update-order-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, ...updates }),
    });
    flashSaved();
  }

  function schedSD(vo: SSVisitOverview, sc: Record<string, boolean | number>, obs: SSAnalystObs) {
    if (scTimer.current) clearTimeout(scTimer.current);
    scTimer.current = setTimeout(() => persist({
      service_data: {
        ...(order.service_data ?? {}),
        ss_visit_overview: vo, ss_scorecard: sc, ss_analyst_obs: obs,
      },
    }), 2000);
  }

  function updateVO(field: keyof SSVisitOverview, val: string) {
    const updated = { ...visitOverview, [field]: val };
    setVO(updated);
    schedSD(updated, scorecard, analystObs);
  }

  function updateScorecard(updated: Record<string, boolean | number>) {
    setScorecard(updated);
    schedSD(visitOverview, updated, analystObs);
  }

  function updateObs(field: keyof SSAnalystObs, val: string) {
    const updated = { ...analystObs, [field]: val };
    setObs(updated);
    schedSD(visitOverview, scorecard, updated);
  }

  function schedMeta(m: MetaMap) {
    if (metaTimer.current) clearTimeout(metaTimer.current);
    metaTimer.current = setTimeout(() => persist({ analyst_commentary: m }), 2000);
  }
  function schedNote(n: string) {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => persist({ analyst_note: n }), 2000);
  }

  function lockSection(key: string) {
    const u = { ...meta, [key]: { ...meta[key], locked: true } };
    setMeta(u); setEditingKey(null); persist({ analyst_commentary: u });
  }
  function unlockSection(key: string) {
    const u = { ...meta, [key]: { ...meta[key], locked: false } };
    setMeta(u); persist({ analyst_commentary: u });
  }

  const hasDraft      = Object.keys(narrativeDraft).length > 0;
  const lockedCount   = NARRATIVE_ONLY.filter(s => meta[s.key]?.locked).length;
  const summaryLocked = !!(meta["summary_and_recommendations"]?.locked);
  const allLocked     = lockedCount === NARRATIVE_ONLY.length && summaryLocked;

  async function generateNarratives() {
    setGenerating(true); setGenError(null); setEditingKey(null);
    try {
      const res  = await fetch("/api/generate-draft", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, ssScorecard: scorecard, ssAnalystObs: analystObs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setNarr(data.draft as Record<string, string>);
      const reset = defaultMeta(); setMeta(reset); persist({ analyst_commentary: reset });
    } catch (e) { setGenError(e instanceof Error ? e.message : "Unknown error"); }
    finally { setGenerating(false); }
  }

  async function regenerateSection(key: string) {
    setRegen(p => ({ ...p, [key]: true }));
    setRegenErr(p => ({ ...p, [key]: undefined }));
    try {
      const res  = await fetch("/api/regenerate-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: key, analystNotes: meta[key]?.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setNarr(p => ({ ...p, [key]: data.content as string }));
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
        orderId: order.id, ai_draft: narrativeDraft,
        analyst_note: analystNote, analyst_commentary: meta, status: newStatus,
        service_data: { ...(order.service_data ?? {}), ss_visit_overview: visitOverview, ss_scorecard: scorecard, ss_analyst_obs: analystObs },
      }),
    });
    setOrder(p => ({ ...p, status: newStatus as Order["status"] }));
    setSaveMsg("All changes saved."); setTimeout(() => setSaveMsg(null), 3000); setSaving(false);
  }

  async function downloadDocx() {
    setDownloadingDocx(true);
    try {
      const res = await fetch("/api/generate-ss-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          analystNote,
          visitOverview,
          scorecard,
          analystObs,
          aiDraft: narrativeDraft,
          summaryAnalystNote: meta["summary_and_recommendations"]?.notes ?? "",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Report generation failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SeaGlassInsights-${order.business_name.replace(/[^a-zA-Z0-9]/g, "")}-SecretShopping.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Report generation failed");
    } finally {
      setDownloadingDocx(false);
    }
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

  const inp  = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam";
  const lbl  = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";
  const svcType  = getEffectiveServiceType(order.service_type);
  const tagColor = SERVICE_TAG_COLORS[svcType];

  // ── Narrative section renderer ─────────────────────────────────────────────

  function renderNarrativeSection(key: string, label: string) {
    const m         = meta[key] ?? { notes: "", locked: false };
    const content   = narrativeDraft[key] ?? "";
    const isEditing = editingKey === key;
    const isRegen   = !!regenerating[key];
    const err       = regenError[key];
    return (
      <div key={key} className="border-t border-gray-100 py-4 first:border-0 first:pt-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-1 h-4 rounded-full shrink-0 ${m.locked ? "bg-green-400" : "bg-seafoam"}`} />
            <h5 className="font-semibold text-navy text-sm">{label}</h5>
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
        {isEditing ? (
          <div>
            <textarea rows={8} value={editBuf} onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y"
              autoFocus />
            <div className="flex gap-2 mt-2">
              <button onClick={() => {
                const u = { ...narrativeDraft, [key]: editBuf };
                setNarr(u); setEditingKey(null); persist({ ai_draft: u });
              }} className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:bg-seafoam-dark transition-colors">
                Apply Changes
              </button>
              <button onClick={() => setEditingKey(null)} className="text-xs text-gray-400 px-3 py-1.5">Cancel</button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : (
          <p className="text-sm text-gray-300 italic">Generate narratives to populate this section.</p>
        )}
        {!m.locked && (
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

  // ── Section 5 renderer (always shows analyst notes, even when locked) ────────

  function renderSection5() {
    const key = "summary_and_recommendations";
    const m = meta[key] ?? { notes: "", locked: false };
    const content = narrativeDraft[key] ?? "";
    const isEditing = editingKey === key;
    const isRegen = !!regenerating[key];
    const err = regenError[key];
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-5 bg-seafoam rounded-full" />
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Section 5 — Summary & Recommendations</h3>
          </div>
          <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
            Section 5 of 6
          </span>
        </div>
        {/* AI content with lock / edit controls */}
        <div className="border-t border-gray-100 py-4 first:border-0 first:pt-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-1 h-4 rounded-full shrink-0 ${m.locked ? "bg-green-400" : "bg-seafoam"}`} />
              <h5 className="font-semibold text-navy text-sm">Summary & Recommendations</h5>
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
          {isEditing ? (
            <div>
              <textarea rows={8} value={editBuf} onChange={e => setEditBuf(e.target.value)}
                className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y"
                autoFocus />
              <div className="flex gap-2 mt-2">
                <button onClick={() => {
                  const u = { ...narrativeDraft, [key]: editBuf };
                  setNarr(u); setEditingKey(null); persist({ ai_draft: u });
                }} className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:bg-seafoam-dark transition-colors">
                  Apply Changes
                </button>
                <button onClick={() => setEditingKey(null)} className="text-xs text-gray-400 px-3 py-1.5">Cancel</button>
              </div>
            </div>
          ) : content ? (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
          ) : (
            <p className="text-sm text-gray-300 italic">Generate narratives to populate this section.</p>
          )}
        </div>
        {/* Analyst Notes — always visible, even when locked */}
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <label className={lbl}>Analyst Notes</label>
          <textarea rows={3} value={m.notes}
            onChange={e => { const u = { ...meta, [key]: { ...m, notes: e.target.value } }; setMeta(u); schedMeta(u); }}
            placeholder="Direction for regenerating this section…"
            className={inp + " resize-y placeholder-gray-300"} />
          {err && <p className="text-red-500 text-xs">{err}</p>}
          <button onClick={() => regenerateSection(key)} disabled={isRegen || !hasDraft}
            className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50">
            {isRegen ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Regenerating…</> : "↺ Regenerate"}
          </button>
        </div>
        {/* Back / Continue */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button type="button" onClick={() => { setNarrativeStep(NARRATIVE_ONLY.length - 1); setActive(4); }}
            className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
            ← Back
          </button>
          <button type="button" onClick={() => setActive(6)}
            className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            Continue to Analyst Note →
          </button>
        </div>
      </div>
    );
  }

  // ── Sub-section nav ────────────────────────────────────────────────────────

  const navItems: { n: 1|2|3|4|5|6; label: string }[] = [
    { n: 1, label: "1. Visit Overview" }, { n: 2, label: "2. Scorecard" },
    { n: 3, label: "3. Observations" },   { n: 4, label: "4. Narratives" },
    { n: 5, label: "5. Summary" },         { n: 6, label: "6. Analyst Note" },
  ];

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

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-navy mt-0.5">{order.customer_name}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-semibold text-navy mt-0.5">{order.email}</p></div>
        <div><span className="text-gray-400">Submitted</span>
          <p className="font-semibold text-navy mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div><span className="text-gray-400">Order ID</span><p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0, 8)}…</p></div>
      </div>

      {/* Section nav */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {navItems.map(({ n, label }) => (
          <button key={n} onClick={() => setActive(n)}
            className={`text-xs font-semibold px-4 py-2 rounded-full transition-colors ${
              activeSection === n ? "bg-navy text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-navy"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Section 1: Visit Overview ─────────────────────────────────────── */}
      {activeSection === 1 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-400 rounded-full" />
              <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Section 1 — Visit Overview</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human entry only</span>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              Section 1 of 6
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {([
              ["business_name",    "Business Name"],
              ["location",         "Location / Address"],
              ["date_of_visit",    "Date of Visit"],
              ["time_of_visit",    "Time of Visit"],
              ["shopper_scenario", "Shopper Scenario"],
              ["template_used",    "Template Used"],
            ] as [keyof SSVisitOverview, string][]).map(([field, fieldLabel]) => (
              <div key={field} className={field === "shopper_scenario" || field === "template_used" ? "col-span-2" : ""}>
                <label className={lbl}>{fieldLabel}</label>
                <input type="text" className={inp} value={visitOverview[field]}
                  onChange={e => updateVO(field, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setActive(2)}
              className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              Continue to Scorecard →
            </button>
          </div>
        </div>
      )}

      {/* ── Section 2: Scorecard ─────────────────────────────────────────── */}
      {activeSection === 2 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-400 rounded-full" />
              <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Section 2 — Experience Scorecard</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human scoring</span>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              Section {scorecardStep + 1} of {SS_DIMENSIONS.length}
            </span>
          </div>
          <SecretShoppingScorecard scorecard={scorecard} onChange={updateScorecard} step={scorecardStep} />
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => scorecardStep === 0 ? setActive(1) : setScorecardStep(s => s - 1)}
              className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
              ← Back
            </button>
            {scorecardStep < SS_DIMENSIONS.length - 1 ? (
              <button
                type="button"
                onClick={() => setScorecardStep(s => s + 1)}
                className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActive(3)}
                className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                Continue to Observations →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Section 3: Analyst Observations ─────────────────────────────── */}
      {activeSection === 3 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-orange-400 rounded-full" />
              <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Section 3 — Analyst Observations</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human entry only</span>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              Section 3 of 6
            </span>
          </div>
          <div className="space-y-4">
            {([
              ["best_moment",             "What was the single best moment of this experience?"],
              ["biggest_miss",            "What was the single biggest missed opportunity?"],
              ["immediate_fix",           "If you could fix one thing immediately, what would it be?"],
              ["additional_observations", "Any additional observations worth noting?"],
            ] as [keyof SSAnalystObs, string][]).map(([field, q]) => (
              <div key={field}>
                <label className={lbl}>{q}</label>
                <textarea rows={3} className={inp + " resize-y"} value={analystObs[field]}
                  onChange={e => updateObs(field, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <button type="button" onClick={() => setActive(2)}
              className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
              ← Back
            </button>
            <button type="button" onClick={() => { setNarrativeStep(0); setActive(4); }}
              className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
              Continue to Narrative Notes →
            </button>
          </div>
        </div>
      )}

      {/* ── Section 4: Narrative Notes ───────────────────────────────────── */}
      {activeSection === 4 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-seafoam rounded-full" />
              <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Section 4 — Narrative Notes</h3>
            </div>
            <div className="flex items-center gap-3">
              {hasDraft && (
                <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                  Narrative {narrativeStep + 1} of {NARRATIVE_ONLY.length}
                </span>
              )}
              {hasDraft && <span className="text-xs text-gray-400">{lockedCount}/{NARRATIVE_ONLY.length} locked</span>}
              <button onClick={generateNarratives} disabled={generating}
                className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50">
                {generating ? "Generating…" : hasDraft ? "Regenerate Narratives" : "Generate AI Narratives"}
              </button>
            </div>
          </div>
          {genError && <p className="text-red-500 text-sm mb-4">{genError}</p>}
          {generating && (
            <div className="flex items-center gap-3 py-8 justify-center text-gray-400">
              <div className="w-5 h-5 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Generating narrative notes from scorecard data…</span>
            </div>
          )}
          {!hasDraft && !generating && (
            <div>
              <p className="text-xs text-gray-400 text-center py-4">
                Complete the scorecard and analyst observations, then click &ldquo;Generate AI Narratives&rdquo;.
              </p>
              <div className="flex items-center justify-start mt-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setActive(3)}
                  className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
                  ← Back
                </button>
              </div>
            </div>
          )}
          {hasDraft && !generating && (
            <div>
              {renderNarrativeSection(NARRATIVE_ONLY[narrativeStep].key, NARRATIVE_ONLY[narrativeStep].label)}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <button type="button"
                  onClick={() => narrativeStep === 0 ? setActive(3) : setNarrativeStep(s => s - 1)}
                  className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
                  ← Back
                </button>
                {narrativeStep < NARRATIVE_ONLY.length - 1 ? (
                  <button type="button" onClick={() => setNarrativeStep(s => s + 1)}
                    className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                    Continue →
                  </button>
                ) : (
                  <button type="button" onClick={() => setActive(5)}
                    className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
                    Continue to Summary →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Section 5: Summary & Recommendations ────────────────────────── */}
      {activeSection === 5 && renderSection5()}

      {/* ── Section 6: Analyst Note + Actions ───────────────────────────── */}
      {activeSection === 6 && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6 space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-seagreen rounded-full" />
              <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Section 6 — Analyst Note</h3>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human entry</span>
            </div>
            <span className="text-xs font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
              Section 6 of 6
            </span>
          </div>
          <div className="flex items-center pb-1 border-b border-gray-100">
            <button type="button" onClick={() => setActive(5)}
              className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
              ← Back to Summary
            </button>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Write one warm, personal closing paragraph. Auto-saved as you type.
          </p>
          <textarea rows={6} value={analystNote}
            onChange={e => { setNote(e.target.value); schedNote(e.target.value); }}
            placeholder="Your personal closing note to the client…"
            className={inp + " resize-y"} />

          {/* Actions */}
          <div className="flex items-center gap-3 flex-wrap pt-2">
            <button onClick={saveReport} disabled={saving}
              className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50">
              {saving ? "Saving…" : "Save Report"}
            </button>
            <button onClick={sendReport}
              disabled={sendingReport || order.status === "delivered" || !hasDraft || !allLocked}
              className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
              {sendingReport ? "Sending…" : order.status === "delivered" ? "✓ Sent" : "✉ Send to Customer"}
            </button>
            {hasDraft && (
              <button onClick={downloadDocx} disabled={!allLocked || downloadingDocx}
                className="bg-seagreen text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {downloadingDocx ? "Building Report…" : "⬇ Save as Word Document"}
              </button>
            )}
            {!allLocked && hasDraft && (
              <p className="text-xs text-amber-600 font-medium">
                Lock all sections first ({lockedCount}/{NARRATIVE_ONLY.length} narratives{!summaryLocked ? " + summary" : ""} locked)
              </p>
            )}
            {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
            {sendMsg && <span className={`text-sm font-medium ${sendMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{sendMsg}</span>}
          </div>

          {/* Status actions */}
          <div className="flex gap-3 pt-2 border-t border-gray-100">
            {order.status === "new" && (
              <button onClick={async () => {
                await fetch("/api/update-order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status: "in_progress" }) });
                setOrder(p => ({ ...p, status: "in_progress" }));
              }} className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200">
                Mark In Progress
              </button>
            )}
            {(order.status === "new" || order.status === "in_progress") && (
              <button onClick={async () => {
                await fetch("/api/update-order-status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, status: "delivered" }) });
                setOrder(p => ({ ...p, status: "delivered" }));
              }} className="bg-seagreen text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90">
                Mark Delivered
              </button>
            )}
            {order.status === "delivered" && <span className="text-sm text-green-600 font-semibold py-2">Report delivered.</span>}
          </div>
        </div>
      )}
    </div>
  );
}
