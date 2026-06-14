"use client";

import { useState, useRef } from "react";
import type { Order } from "@/lib/supabase";
import {
  AI_STARTER_KIT_SECTIONS,
  SERVICE_DISPLAY_NAMES,
  SERVICE_TAG_COLORS,
  getEffectiveServiceType,
  getQuestionLabels,
} from "@/lib/serviceConfig";

// AI-generated sections only (excludes revision_notes which is humanOnly)
const AI_SECTIONS = AI_STARTER_KIT_SECTIONS.filter(s => !s.humanOnly);
const TOTAL_SECTIONS = AI_STARTER_KIT_SECTIONS.length + 1; // +1 for analyst note

type SectionMeta = { notes: string; locked: boolean };
type MetaMap     = Record<string, SectionMeta>;

function defaultMeta(): MetaMap {
  return Object.fromEntries(
    AI_SECTIONS.map(s => [s.key, { notes: "", locked: false }])
  );
}

function initMeta(saved: Record<string, unknown> | null): MetaMap {
  const base = defaultMeta();
  if (!saved) return base;
  for (const k of Object.keys(base)) {
    const v = saved[k];
    if (v && typeof v === "object" && "locked" in (v as object)) {
      const sv = v as Partial<SectionMeta>;
      base[k] = { notes: sv.notes ?? "", locked: !!sv.locked };
    }
  }
  return base;
}

function parsePromptContent(content: string): { prompt: string; instructions: string } {
  const parts = content.split("\n---\n");
  if (parts.length >= 2) {
    return { prompt: parts[0].trim(), instructions: parts.slice(1).join("\n---\n").trim() };
  }
  return { prompt: content.trim(), instructions: "" };
}

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered:   "bg-green-100 text-green-700",
};

interface Props { order: Order; onBack: () => void; }

export default function AIStarterKitDetail({ order: initialOrder, onBack }: Props) {
  const [order, setOrder]   = useState(initialOrder);
  const [draft, setDraft]   = useState<Record<string, string>>(
    (initialOrder.ai_draft as Record<string, string>) ?? {}
  );
  const [meta, setMeta]     = useState<MetaMap>(() =>
    initMeta(initialOrder.analyst_commentary as Record<string, unknown> | null)
  );
  const [analystNote, setAnalystNote] = useState(
    initialOrder.analyst_note === "Manual Order" ? "" : (initialOrder.analyst_note ?? "")
  );
  const [activeSection, setActiveSection] = useState(1);
  const [generating, setGenerating]       = useState(false);
  const [genError, setGenError]           = useState<string | null>(null);
  const [genSectionIdx, setGenSectionIdx] = useState(-1);
  const [genFailed, setGenFailed]         = useState<Record<string, string>>({});
  const [retrying, setRetrying]           = useState<Record<string, boolean>>({});
  const [regenerating, setRegenerating]   = useState<Record<string, boolean>>({});
  const [regenError, setRegenError]       = useState<Record<string, string | undefined>>({});
  const [editingKey, setEditingKey]       = useState<string | null>(null);
  const [editBuf, setEditBuf]             = useState("");
  const [autoSaved, setAutoSaved]         = useState(false);
  const [saving, setSaving]               = useState(false);
  const [saveMsg, setSaveMsg]             = useState<string | null>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const metaTimer = useRef<NodeJS.Timeout | null>(null);
  const noteTimer = useRef<NodeJS.Timeout | null>(null);

  const hasDraft    = AI_SECTIONS.some(s => !!draft[s.key]);
  const lockedCount = AI_SECTIONS.filter(s => meta[s.key]?.locked).length;
  const allLocked   = lockedCount === AI_SECTIONS.length;

  const svcType        = getEffectiveServiceType(order.service_type);
  const tagColor       = SERVICE_TAG_COLORS[svcType] ?? "bg-gray-100 text-gray-500";
  const questionLabels = getQuestionLabels("ai_starter_kit");

  function flashSaved() {
    setAutoSaved(true);
    setTimeout(() => setAutoSaved(false), 2500);
  }

  async function persist(updates: Record<string, unknown>) {
    await fetch("/api/update-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, ...updates }),
    });
    flashSaved();
  }

  function schedMeta(m: MetaMap) {
    if (metaTimer.current) clearTimeout(metaTimer.current);
    metaTimer.current = setTimeout(() => persist({ analyst_commentary: m }), 2000);
  }

  function schedNote(note: string) {
    if (noteTimer.current) clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => persist({ analyst_note: note }), 2000);
  }

  async function generateDraft() {
    setGenerating(true);
    setGenError(null);
    setGenSectionIdx(-1);
    setGenFailed({});
    setEditingKey(null);

    try {
      for (let i = 0; i < AI_SECTIONS.length; i++) {
        const section = AI_SECTIONS[i];
        setGenSectionIdx(i);
        try {
          const res  = await fetch("/api/generate-aisk-section", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ orderId: order.id, sectionKey: section.key }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Section generation failed");
          setDraft(prev => ({ ...prev, [section.key]: data.content as string }));
        } catch (e) {
          setGenFailed(prev => ({ ...prev, [section.key]: e instanceof Error ? e.message : "Failed" }));
        }
      }
      const reset = defaultMeta();
      setMeta(reset);
      persist({ analyst_commentary: reset });
      setActiveSection(1);
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
      setGenSectionIdx(-1);
    }
  }

  async function retrySection(key: string) {
    setGenFailed(prev => { const n = { ...prev }; delete n[key]; return n; });
    setRetrying(prev => ({ ...prev, [key]: true }));
    try {
      const res  = await fetch("/api/generate-aisk-section", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId: order.id, sectionKey: key }),
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
    setRegenerating(p => ({ ...p, [key]: true }));
    setRegenError(p => ({ ...p, [key]: undefined }));
    try {
      const res  = await fetch("/api/regenerate-section", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId: order.id, sectionKey: key, analystNotes: meta[key]?.notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Regeneration failed");
      setDraft(p => ({ ...p, [key]: data.content as string }));
      flashSaved();
    } catch (e) {
      setRegenError(p => ({ ...p, [key]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setRegenerating(p => ({ ...p, [key]: false }));
    }
  }

  function lockSection(key: string) {
    const updated = { ...meta, [key]: { ...meta[key], locked: true } };
    setMeta(updated);
    setEditingKey(null);
    persist({ analyst_commentary: updated });
  }

  function unlockSection(key: string) {
    const updated = { ...meta, [key]: { ...meta[key], locked: false } };
    setMeta(updated);
    persist({ analyst_commentary: updated });
  }

  async function saveReport() {
    setSaving(true);
    setSaveMsg(null);
    const newStatus = order.status === "new" ? "in_progress" : order.status;
    await fetch("/api/update-order-status", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        orderId: order.id, ai_draft: draft,
        analyst_note: analystNote, analyst_commentary: meta, status: newStatus,
      }),
    });
    setOrder(p => ({ ...p, status: newStatus as Order["status"] }));
    setSaveMsg("All changes saved.");
    setTimeout(() => setSaveMsg(null), 3000);
    setSaving(false);
  }

  async function downloadDocx() {
    setDownloadingDocx(true);
    try {
      const res = await fetch("/api/generate-aisk-pdf", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ orderId: order.id, analystNote, aiDraft: draft }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Report generation failed");
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SeaGlassInsights-${order.business_name.replace(/[^a-zA-Z0-9]/g, "")}-AIStarterKit.docx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Report generation failed");
    } finally {
      setDownloadingDocx(false);
    }
  }

  // ── Render one AI section ─────────────────────────────────────────────────────

  function renderAISection(idx: number) {
    const section        = AI_STARTER_KIT_SECTIONS[idx];
    const { key, label } = section;
    const m              = meta[key] ?? { notes: "", locked: false };
    const content        = draft[key] ?? "";
    const isEditing      = editingKey === key;
    const isRegen        = !!regenerating[key];
    const err            = regenError[key];
    const isFirst        = idx === 0;
    const isLast         = idx === AI_STARTER_KIT_SECTIONS.length - 1;
    const lbl            = "text-xs font-semibold text-gray-400 uppercase tracking-wide block";
    const isFailed       = !!genFailed[key];
    const isRetrying     = !!retrying[key];
    const isPrompt       = /^custom_prompt_\d+$/.test(key);

    return (
      <div key={key}>
        {/* Section header */}
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
            Section {idx + 1} of {TOTAL_SECTIONS}
          </span>
          <h4 className="font-bold text-navy text-base" style={{ fontFamily: "Georgia, serif" }}>
            {label}
          </h4>
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

        {/* Content or states */}
        {isRetrying ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-4">
            <div className="w-4 h-4 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            <span>Retrying…</span>
          </div>
        ) : isFailed ? (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-3">{genFailed[key]}</p>
            <button
              onClick={() => retrySection(key)}
              className="inline-flex items-center gap-1.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-4 py-2 rounded-full transition-colors">
              ↺ Retry this section
            </button>
          </div>
        ) : isEditing ? (
          <div className="mb-4">
            <textarea
              rows={isPrompt ? 14 : 12} value={editBuf}
              onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed font-mono"
              autoFocus
            />
            {isPrompt && (
              <p className="text-xs text-gray-400 mt-1">
                Separate the prompt from the instructions with a line containing only <code className="bg-gray-100 px-1 rounded">---</code>
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => {
                  const updated = { ...draft, [key]: editBuf };
                  setDraft(updated);
                  setEditingKey(null);
                  persist({ ai_draft: updated });
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
          isPrompt ? (
            <PromptDisplay content={content} />
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{content}</p>
          )
        ) : (
          <p className="text-sm text-gray-300 italic mb-4">No content for this section.</p>
        )}

        {/* Analyst notes + regen — only when unlocked */}
        {!m.locked && (
          <div className="mb-4 pt-3 border-t border-gray-50 space-y-2">
            <label className={lbl}>Analyst Notes for Regeneration</label>
            <textarea
              rows={2} value={m.notes}
              onChange={e => {
                const updated = { ...meta, [key]: { ...m, notes: e.target.value } };
                setMeta(updated);
                schedMeta(updated);
              }}
              placeholder="Your direction for regenerating this section…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300"
            />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button
              onClick={() => regenerateSection(key)}
              disabled={isRegen || !hasDraft}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isRegen ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Regenerating…
                </>
              ) : "↺ Regenerate This Section"}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          {isFirst ? (
            <div />
          ) : (
            <button
              type="button"
              onClick={() => setActiveSection(idx)}
              className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
              ← Back
            </button>
          )}
          <button
            type="button"
            onClick={() => isLast ? setActiveSection(TOTAL_SECTIONS) : setActiveSection(idx + 2)}
            className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            {isLast ? "Continue to Analyst Note →" : "Continue →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render revision notes (human-only section) ────────────────────────────────

  function renderRevisionNotes(idx: number) {
    const section = AI_STARTER_KIT_SECTIONS[idx];
    const content = draft[section.key] ?? "";
    const isLast  = idx === AI_STARTER_KIT_SECTIONS.length - 1;

    return (
      <div key={section.key}>
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full shrink-0">
            Section {idx + 1} of {TOTAL_SECTIONS}
          </span>
          <h4 className="font-bold text-navy text-base" style={{ fontFamily: "Georgia, serif" }}>
            {section.label}
          </h4>
        </div>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Analyst-filled section. Notes on revisions, delivery context, or anything to pass along with the report. Not AI-generated.
        </p>
        <textarea
          rows={5}
          value={content}
          onChange={e => setDraft(prev => ({ ...prev, [section.key]: e.target.value }))}
          placeholder="Notes on this draft, revision requests, or delivery context…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed"
        />
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setActiveSection(idx)}
            className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
            ← Back
          </button>
          <button
            type="button"
            onClick={() => isLast ? setActiveSection(TOTAL_SECTIONS) : setActiveSection(idx + 2)}
            className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity">
            {isLast ? "Continue to Analyst Note →" : "Continue →"}
          </button>
        </div>
      </div>
    );
  }

  // ── Render closing analyst note ───────────────────────────────────────────────

  function renderAnalystNote() {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
            Section {TOTAL_SECTIONS} of {TOTAL_SECTIONS}
          </span>
          <h4 className="font-bold text-navy text-base" style={{ fontFamily: "Georgia, serif" }}>
            A Note from the Analyst
          </h4>
        </div>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Write one warm, personal closing paragraph in your own voice. Auto-saved as you type.
        </p>
        <textarea
          rows={6} value={analystNote}
          onChange={e => { setAnalystNote(e.target.value); schedNote(e.target.value); }}
          placeholder="Your personal note to the client…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed"
        />
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => setActiveSection(AI_STARTER_KIT_SECTIONS.length)}
            className="text-sm font-semibold text-gray-400 hover:text-navy transition-colors">
            ← Back
          </button>
          <div />
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  const answers = [
    order.q1, order.q2, order.q3, order.q4, order.q5,
    order.q6, order.q7, order.q8, order.q9, order.q10,
  ];

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

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div>
          <span className="text-gray-400">Customer</span>
          <p className="font-semibold text-navy mt-0.5">{order.customer_name}</p>
        </div>
        <div>
          <span className="text-gray-400">Email</span>
          <p className="font-semibold text-navy mt-0.5">{order.email}</p>
        </div>
        <div>
          <span className="text-gray-400">Submitted</span>
          <p className="font-semibold text-navy mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div>
          <span className="text-gray-400">Order ID</span>
          <p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0, 8)}…</p>
        </div>
      </div>

      {/* Intake answers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>
          Intake Answers
        </h3>
        <div className="space-y-4">
          {questionLabels.map((q, i) => {
            const a = answers[i];
            if (!a || q === "(not used)") return null;
            return (
              <div key={i}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                  Q{i + 1} — {q}
                </p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{a}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Draft */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>
            Report Draft
          </h3>
          <div className="flex items-center gap-3">
            {hasDraft && (
              <span className="text-xs text-gray-400 font-medium">
                {allLocked
                  ? "All sections locked ✓"
                  : `${lockedCount}/${AI_SECTIONS.length} sections locked`}
              </span>
            )}
            <button onClick={generateDraft} disabled={generating}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? "Generating…" : hasDraft ? "Regenerate Full Draft" : "Generate AI Draft"}
            </button>
          </div>
        </div>

        {genError && <p className="text-red-500 text-sm mb-4">{genError}</p>}

        {generating && (
          <div className="py-4 space-y-1.5">
            {AI_SECTIONS.map((section, i) => {
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
                        {i + 1} of {AI_SECTIONS.length}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {!hasDraft && !generating && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Click &ldquo;Generate AI Draft&rdquo; to build the business analysis and custom prompts.
          </p>
        )}

        {hasDraft && !generating && (
          <div>
            {activeSection >= 1 && activeSection <= AI_STARTER_KIT_SECTIONS.length
              ? (() => {
                  const section = AI_STARTER_KIT_SECTIONS[activeSection - 1];
                  return section?.humanOnly
                    ? renderRevisionNotes(activeSection - 1)
                    : renderAISection(activeSection - 1);
                })()
              : renderAnalystNote()
            }
          </div>
        )}

        {hasDraft && !generating && (
          <div className="pt-5 mt-4 border-t border-dashed border-seagreen/30 flex items-center gap-3 flex-wrap">
            <button onClick={saveReport} disabled={saving}
              className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
              {saving ? "Saving…" : "Save Report"}
            </button>
            <button onClick={downloadDocx} disabled={!allLocked || downloadingDocx}
              className="bg-seagreen text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
              {downloadingDocx ? "Building Report…" : "⬇ Save as Word Document"}
            </button>
            {!allLocked && (
              <p className="text-xs text-amber-600 font-medium">
                Lock all {AI_SECTIONS.length} sections to enable download
                ({lockedCount}/{AI_SECTIONS.length} locked)
              </p>
            )}
            {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
          </div>
        )}
      </div>

      {/* Order Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>
          Order Actions
        </h3>
        {order.status === "new" && (
          <button
            onClick={async () => {
              await fetch("/api/update-order-status", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, status: "in_progress" }),
              });
              setOrder(p => ({ ...p, status: "in_progress" }));
            }}
            className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200 transition-colors">
            Mark In Progress
          </button>
        )}
        {(order.status === "new" || order.status === "in_progress") && (
          <button
            onClick={async () => {
              await fetch("/api/update-order-status", {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: order.id, status: "delivered" }),
              });
              setOrder(p => ({ ...p, status: "delivered" }));
            }}
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

// ── Prompt display sub-component ──────────────────────────────────────────────

function PromptDisplay({ content }: { content: string }) {
  const { prompt, instructions } = parsePromptContent(content);
  return (
    <div className="mb-4">
      <div className="bg-gray-50 border-l-4 border-seafoam rounded-r-lg px-4 py-3 mb-2">
        <p className="text-xs font-bold text-seafoam uppercase tracking-wide mb-2">Your Prompt</p>
        <p className="text-sm text-gray-800 font-mono whitespace-pre-wrap leading-relaxed">{prompt}</p>
      </div>
      {instructions && (
        <p className="text-sm text-gray-500 italic leading-relaxed">{instructions}</p>
      )}
    </div>
  );
}
