"use client";

import { useState, useRef } from "react";
import type { Order, SMAComparison, SMAComparisonRow } from "@/lib/supabase";

// Defined locally to avoid importing a value from the server-only supabase module
// (lib/supabase.ts throws at init time if SUPABASE_URL is absent — not safe to
// bundle into a "use client" component).
const EMPTY_SMA_COMPARISON: SMAComparison = {
  competitor_1_name: "",
  competitor_2_name: "",
  rows: {
    platforms:            { your_business: "", competitor_1: "", competitor_2: "" },
    follower_count:       { your_business: "", competitor_1: "", competitor_2: "" },
    posting_frequency:    { your_business: "", competitor_1: "", competitor_2: "" },
    avg_engagement_rate:  { your_business: "", competitor_1: "", competitor_2: "" },
    content_mix:          { your_business: "", competitor_1: "", competitor_2: "" },
    profile_completeness: { your_business: "", competitor_1: "", competitor_2: "" },
    response_to_comments: { your_business: "", competitor_1: "", competitor_2: "" },
    overall_presence:     { your_business: "", competitor_1: "", competitor_2: "" },
  },
};
import {
  SERVICE_DISPLAY_NAMES, SERVICE_TAG_COLORS,
  getSectionsForService, getQuestionLabels, getEffectiveServiceType,
  type ServiceSection,
} from "@/lib/serviceConfig";

type SectionMeta = { notes: string; locked: boolean };
type MetaMap     = Record<string, SectionMeta>;

function defaultMeta(sections: ServiceSection[]): MetaMap {
  return Object.fromEntries(sections.map(s => [s.key, { notes: "", locked: false }]));
}

function initMeta(sections: ServiceSection[], saved: Record<string, unknown> | null): MetaMap {
  const base = defaultMeta(sections);
  if (!saved) return base;
  for (const k of Object.keys(base)) {
    const v = saved[k];
    if (v && typeof v === "object" && "locked" in (v as object)) {
      base[k] = v as SectionMeta;
    }
  }
  return base;
}

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered:   "bg-green-100 text-green-700",
};

interface Props {
  order:   Order;
  onBack:  () => void;
}

export default function GenericServiceDetail({ order: initialOrder, onBack }: Props) {
  const serviceType = getEffectiveServiceType(initialOrder.service_type);
  const sections    = getSectionsForService(serviceType);
  const questionLabels = getQuestionLabels(serviceType);

  const [order, setOrder]       = useState(initialOrder);
  const [draft, setDraft]       = useState<Record<string, string>>(
    (initialOrder.ai_draft as Record<string, string>) ?? {}
  );
  const [meta, setMeta]         = useState<MetaMap>(() =>
    initMeta(sections, initialOrder.analyst_commentary as Record<string, unknown> | null)
  );
  const [analystNote, setAnalystNote]   = useState(
    initialOrder.analyst_note === "Manual Order" ? "" : (initialOrder.analyst_note ?? "")
  );
  const [generating, setGenerating]     = useState(false);
  const [genError, setGenError]         = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [regenError, setRegenError]     = useState<Record<string, string | undefined>>({});
  const [editingKey, setEditingKey]     = useState<string | null>(null);
  const [editBuf, setEditBuf]           = useState("");
  const [autoSaved, setAutoSaved]       = useState(false);
  const [saving, setSaving]             = useState(false);
  const [saveMsg, setSaveMsg]           = useState<string | null>(null);
  const [sendingReport, setSendingReport] = useState(false);
  const [sendMsg, setSendMsg]           = useState<string | null>(null);

  const metaTimer  = useRef<NodeJS.Timeout | null>(null);
  const noteTimer  = useRef<NodeJS.Timeout | null>(null);
  const compTimer  = useRef<NodeJS.Timeout | null>(null);

  // ── SMA Competitive Comparison table state ─────────────────────────────────
  const isSMA = serviceType === "social_media_audit";
  const [smaComp, setSmaComp] = useState<SMAComparison>(() => {
    const saved = (initialOrder.service_data as Record<string, unknown> | null)?.sma_comparison;
    return (saved as SMAComparison | undefined) ?? EMPTY_SMA_COMPARISON;
  });

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

  function updateSmaComp(updated: SMAComparison) {
    setSmaComp(updated);
    if (compTimer.current) clearTimeout(compTimer.current);
    compTimer.current = setTimeout(() => persist({
      service_data: { ...(order.service_data ?? {}), sma_comparison: updated },
    }), 1500);
  }

  function updateMeta(key: string, notes: string) {
    const updated = { ...meta, [key]: { ...meta[key], notes } };
    setMeta(updated);
    schedMeta(updated);
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

  const aiSections    = sections.filter(s => s.aiGenerated);
  const lockedCount   = aiSections.filter(s => meta[s.key]?.locked).length;
  const allLocked     = aiSections.length > 0 && lockedCount === aiSections.length;
  const hasDraft      = Object.keys(draft).length > 0;

  // ── Generate full draft ────────────────────────────────────────────────────

  async function generateDraft() {
    setGenerating(true);
    setGenError(null);
    setEditingKey(null);
    try {
      const res  = await fetch("/api/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setDraft(data.draft as Record<string, string>);
      const reset = defaultMeta(sections);
      setMeta(reset);
      persist({ analyst_commentary: reset });
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  // ── Regenerate section ─────────────────────────────────────────────────────

  async function regenerateSection(key: string) {
    setRegenerating(p => ({ ...p, [key]: true }));
    setRegenError(p => ({ ...p, [key]: undefined }));
    try {
      const res  = await fetch("/api/regenerate-section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: key, analystNotes: meta[key]?.notes }),
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

  // ── Save / Send ────────────────────────────────────────────────────────────

  async function saveReport() {
    setSaving(true);
    setSaveMsg(null);
    const newStatus = order.status === "new" ? "in_progress" : order.status;
    await fetch("/api/update-order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id, ai_draft: draft,
        analyst_note: analystNote, analyst_commentary: meta, status: newStatus,
      }),
    });
    setOrder(p => ({ ...p, status: newStatus as Order["status"] }));
    setSaveMsg("All changes saved.");
    setTimeout(() => setSaveMsg(null), 3000);
    setSaving(false);
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
      setOrder(p => ({ ...p, status: "delivered" }));
      setSendMsg(`Report sent to ${order.email}`);
    } catch (e) {
      setSendMsg(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setSendingReport(false);
      setTimeout(() => setSendMsg(null), 6000);
    }
  }

  // ── SMA Competitive Comparison section ────────────────────────────────────

  function buildTableContext(comp: SMAComparison): string {
    const haC1 = comp.competitor_1_name.trim() !== "";
    const haC2 = comp.competitor_2_name.trim() !== "";
    const cols = [
      "Your Business",
      haC1 ? (comp.competitor_1_name || "Competitor 1") : null,
      haC2 ? (comp.competitor_2_name || "Competitor 2") : null,
    ].filter(Boolean) as string[];

    const ROW_LABELS: Record<keyof SMAComparison["rows"], string> = {
      platforms:            "Platform(s)",
      follower_count:       "Follower Count",
      posting_frequency:    "Posting Frequency",
      avg_engagement_rate:  "Avg Engagement Rate",
      content_mix:          "Content Mix",
      profile_completeness: "Profile Completeness",
      response_to_comments: "Response to Comments",
      overall_presence:     "Overall Presence",
    };

    const lines = [`Metric | ${cols.join(" | ")}`];
    for (const [key, label] of Object.entries(ROW_LABELS)) {
      const row = comp.rows[key as keyof SMAComparison["rows"]];
      const cells = [row.your_business, haC1 ? row.competitor_1 : null, haC2 ? row.competitor_2 : null].filter(v => v !== null);
      lines.push(`${label} | ${cells.join(" | ")}`);
    }
    return lines.join("\n");
  }

  function renderSMAComparisonSection() {
    const KEY     = "competitive_social_comparison";
    const m       = meta[KEY] ?? { notes: "", locked: false };
    const content = draft[KEY] ?? "";
    const isRegen = !!regenerating[KEY];
    const err     = regenError[KEY];
    const comp    = smaComp;
    const haC1    = comp.competitor_1_name.trim() !== "";
    const haC2    = comp.competitor_2_name.trim() !== "";

    const NAVY = "#0A2F61";

    type RowKey = keyof SMAComparison["rows"];
    const TABLE_ROWS: { key: RowKey; label: string }[] = [
      { key: "platforms",            label: "Platform(s)" },
      { key: "follower_count",       label: "Follower Count" },
      { key: "posting_frequency",    label: "Posting Frequency" },
      { key: "avg_engagement_rate",  label: "Avg Engagement Rate" },
      { key: "content_mix",          label: "Content Mix" },
      { key: "profile_completeness", label: "Profile Completeness" },
      { key: "response_to_comments", label: "Response to Comments" },
      { key: "overall_presence",     label: "Overall Presence" },
    ];

    function updateCell(rowKey: RowKey, col: keyof SMAComparisonRow, val: string) {
      const updated: SMAComparison = {
        ...comp,
        rows: {
          ...comp.rows,
          [rowKey]: { ...comp.rows[rowKey], [col]: val },
        },
      };
      updateSmaComp(updated);
    }

    function updateCompName(slot: 1 | 2, val: string) {
      updateSmaComp({
        ...comp,
        [slot === 1 ? "competitor_1_name" : "competitor_2_name"]: val,
      });
    }

    const inpCls = "w-full text-xs text-gray-700 bg-transparent border-0 outline-none resize-none leading-relaxed placeholder-gray-300 focus:bg-white focus:ring-1 focus:ring-seafoam rounded px-1 py-0.5";

    return (
      <div className="border-t border-gray-100 py-5">
        {/* Section header */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`w-1 h-5 rounded-full shrink-0 ${m.locked ? "bg-green-400" : "bg-seafoam"}`} />
            <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
              Competitive Social Comparison
            </h4>
            {m.locked && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Locked</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {m.locked ? (
              <button onClick={() => unlockSection(KEY)}
                className="text-xs text-gray-400 hover:text-orange-500 transition-colors">
                Unlock
              </button>
            ) : (
              <button onClick={() => lockSection(KEY)}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">
                Lock Section
              </button>
            )}
          </div>
        </div>

        {/* ── Editable comparison table ── */}
        {!m.locked && (
          <div className="mb-5">
            {/* Competitor name inputs */}
            <div className="flex gap-3 mb-3">
              <div className="flex-1" />
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Competitor 1 name</label>
                <input type="text" value={comp.competitor_1_name}
                  onChange={e => updateCompName(1, e.target.value)}
                  placeholder="e.g. The Java House"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-1">Competitor 2 name <span className="text-gray-300 normal-case font-normal tracking-normal">(optional)</span></label>
                <input type="text" value={comp.competitor_2_name}
                  onChange={e => updateCompName(2, e.target.value)}
                  placeholder="e.g. Coastal Coffee"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam" />
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto mb-5 rounded-lg border border-gray-200">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: NAVY, color: "#fff" }}>
                <th className="text-left px-4 py-2.5 text-xs font-semibold w-[28%]">Metric</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold">Your Business</th>
                {(haC1 || !m.locked) && (
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#00CED1" }}>
                    {comp.competitor_1_name || "Competitor 1"}
                  </th>
                )}
                {(haC2 || !m.locked) && (
                  <th className="text-left px-4 py-2.5 text-xs font-semibold" style={{ color: "#93C5FD" }}>
                    {comp.competitor_2_name || "Competitor 2"}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {TABLE_ROWS.map(({ key: rk, label }, idx) => {
                const row = comp.rows[rk];
                const bg  = idx % 2 === 0 ? "bg-gray-50" : "bg-white";
                return (
                  <tr key={rk} className={bg}>
                    <td className="px-4 py-2 text-xs font-semibold text-gray-600 border-b border-gray-100 align-top whitespace-nowrap">
                      {label}
                    </td>
                    <td className="px-3 py-1.5 border-b border-gray-100 align-top">
                      {m.locked ? (
                        <span className="text-xs text-gray-700">{row.your_business || <span className="text-gray-300 italic">—</span>}</span>
                      ) : (
                        <textarea rows={2} value={row.your_business}
                          onChange={e => updateCell(rk, "your_business", e.target.value)}
                          placeholder={rk === "overall_presence" ? "Strong / Developing / Needs Attention" : "Enter value…"}
                          className={inpCls} />
                      )}
                    </td>
                    {(haC1 || !m.locked) && (
                      <td className="px-3 py-1.5 border-b border-gray-100 align-top">
                        {m.locked ? (
                          <span className="text-xs text-gray-700">{row.competitor_1 || <span className="text-gray-300 italic">—</span>}</span>
                        ) : (
                          <textarea rows={2} value={row.competitor_1}
                            onChange={e => updateCell(rk, "competitor_1", e.target.value)}
                            placeholder={rk === "overall_presence" ? "Strong / Developing / Needs Attention" : "Enter value…"}
                            className={inpCls} />
                        )}
                      </td>
                    )}
                    {(haC2 || !m.locked) && (
                      <td className="px-3 py-1.5 border-b border-gray-100 align-top">
                        {m.locked ? (
                          <span className="text-xs text-gray-700">{row.competitor_2 || <span className="text-gray-300 italic">—</span>}</span>
                        ) : (
                          <textarea rows={2} value={row.competitor_2}
                            onChange={e => updateCell(rk, "competitor_2", e.target.value)}
                            placeholder={rk === "overall_presence" ? "Strong / Developing / Needs Attention" : "Enter value…"}
                            className={inpCls} />
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Narrative paragraph ── */}
        {content && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Comparison Narrative</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
          </div>
        )}

        {/* ── Analyst notes + generate ── */}
        {!m.locked && (
          <div className="mt-4 pt-3 border-t border-gray-50 space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">
              Analyst Notes — guidance for the narrative paragraph
            </label>
            <textarea rows={2} value={m.notes}
              onChange={e => updateMeta(KEY, e.target.value)}
              placeholder="e.g. Focus on our engagement advantage. Note that competitor 1 has more followers but lower engagement rate."
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300"
            />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button
              onClick={async () => {
                setRegenerating(p => ({ ...p, [KEY]: true }));
                setRegenError(p => ({ ...p, [KEY]: undefined }));
                try {
                  const tableCtx = buildTableContext(comp);
                  const res = await fetch("/api/regenerate-section", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId:      order.id,
                      sectionKey:   KEY,
                      analystNotes: m.notes,
                      tableContext: tableCtx,
                    }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error ?? "Failed");
                  setDraft(p => ({ ...p, [KEY]: data.content as string }));
                  flashSaved();
                } catch (e) {
                  setRegenError(p => ({ ...p, [KEY]: e instanceof Error ? e.message : "Failed" }));
                } finally {
                  setRegenerating(p => ({ ...p, [KEY]: false }));
                }
              }}
              disabled={isRegen}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRegen ? (
                <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Generating…</>
              ) : content ? "↺ Regenerate Comparison Narrative" : "✦ Generate Comparison Narrative"}
            </button>
            <p className="text-xs text-gray-400">Claude will write a narrative paragraph from the table values above.</p>
          </div>
        )}
      </div>
    );
  }

  // ── Section renderer ───────────────────────────────────────────────────────

  function renderSection(section: ServiceSection) {
    const { key, label, aiGenerated, description } = section;
    const m          = meta[key] ?? { notes: "", locked: false };
    const content    = draft[key] ?? "";
    const isEditing  = editingKey === key;
    const isRegen    = !!regenerating[key];
    const err        = regenError[key];

    return (
      <div key={key} className="border-t border-gray-100 py-5 first:border-0 first:pt-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`w-1 h-5 rounded-full shrink-0 ${m.locked ? "bg-green-400" : "bg-seafoam"}`} />
            <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>{label}</h4>
            {!aiGenerated && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Human entry</span>
            )}
            {m.locked && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Locked</span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!m.locked && !isEditing && (
              <button onClick={() => { setEditBuf(content); setEditingKey(key); }}
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
              <button onClick={() => lockSection(key)}
                className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">
                Lock Section
              </button>
            )}
          </div>
        </div>

        {description && !content && (
          <p className="text-xs text-gray-400 italic mb-3 leading-relaxed">{description}</p>
        )}

        {/* Content or edit */}
        {isEditing ? (
          <div>
            <textarea
              rows={10} value={editBuf}
              onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed"
              autoFocus
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => {
                const updated = { ...draft, [key]: editBuf };
                setDraft(updated);
                setEditingKey(null);
                persist({ ai_draft: updated });
              }}
                className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:bg-seafoam-dark transition-colors">
                Apply Changes
              </button>
              <button onClick={() => setEditingKey(null)}
                className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{content}</p>
        ) : hasDraft ? (
          <p className="text-sm text-gray-300 italic">No content yet for this section.</p>
        ) : null}

        {/* Analyst notes + regen — for AI sections, when not locked */}
        {aiGenerated && !m.locked && (
          <div className="mt-4 pt-3 border-t border-gray-50 space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block">
              Analyst Notes
            </label>
            <textarea
              rows={2} value={m.notes}
              onChange={e => updateMeta(key, e.target.value)}
              placeholder="Your direction for this section…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300"
            />
            {err && <p className="text-red-500 text-xs">{err}</p>}
            <button onClick={() => regenerateSection(key)} disabled={isRegen || !hasDraft}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {isRegen ? (
                <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Regenerating…</>
              ) : "↺ Regenerate This Section"}
            </button>
          </div>
        )}

        {/* Human-only sections: just show edit button, no regen */}
        {!aiGenerated && !m.locked && !isEditing && !content && (
          <button onClick={() => { setEditBuf(""); setEditingKey(key); }}
            className="text-xs text-seafoam border border-seafoam/40 rounded-full px-3 py-1.5 mt-2 transition-colors font-medium hover:text-navy hover:border-navy/40">
            + Add Content
          </button>
        )}
      </div>
    );
  }

  // ── Questions display ──────────────────────────────────────────────────────

  const answers = [
    order.q1, order.q2, order.q3, order.q4, order.q5,
    order.q6, order.q7, order.q8, order.q9, order.q10,
  ];

  const svcType  = getEffectiveServiceType(order.service_type);
  const tagColor = SERVICE_TAG_COLORS[svcType] ?? "bg-gray-100 text-gray-500";

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
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-navy mt-0.5">{order.customer_name}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-semibold text-navy mt-0.5">{order.email}</p></div>
        <div><span className="text-gray-400">Submitted</span>
          <p className="font-semibold text-navy mt-0.5">
            {new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <div><span className="text-gray-400">Order ID</span><p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0, 8)}…</p></div>
      </div>

      {/* Intake answers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>Intake Answers</h3>
        <div className="space-y-4">
          {questionLabels.slice(0, 10).map((q, i) => {
            const a = answers[i];
            if (!a && q === "(not used)") return null;
            return (
              <div key={i}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Q{i + 1} — {q}</p>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {a ?? <span className="italic text-gray-300">No answer</span>}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Report Draft */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Report Draft</h3>
          <div className="flex items-center gap-3">
            {hasDraft && (
              <span className="text-xs text-gray-400 font-medium">
                {lockedCount}/{aiSections.length} AI sections locked
              </span>
            )}
            <button onClick={generateDraft} disabled={generating}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:bg-seafoam-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {generating ? "Generating…" : hasDraft ? "Regenerate Full Draft" : "Generate AI Draft"}
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

        {!hasDraft && !generating && (
          <p className="text-sm text-gray-400 py-4 text-center">
            Click &ldquo;Generate AI Draft&rdquo; to create the report using Claude.
          </p>
        )}

        {(hasDraft || generating === false) && !generating && (
          <div>
            {sections.map(s =>
              isSMA && s.key === "competitive_social_comparison"
                ? <div key={s.key}>{renderSMAComparisonSection()}</div>
                : renderSection(s)
            )}

            {/* Analyst closing note */}
            <div className="border-t-2 border-dashed border-seagreen/30 pt-6 mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-1 h-5 bg-seagreen rounded-full" />
                <h4 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
                  A Note from the Analyst
                </h4>
              </div>
              <p className="text-xs text-gray-400 ml-3 mb-3 leading-relaxed">
                Write one warm, personal closing paragraph in your own voice. Auto-saved as you type.
              </p>
              <textarea rows={5} value={analystNote}
                onChange={e => { setAnalystNote(e.target.value); schedNote(e.target.value); }}
                placeholder={`Your personal note to the client…`}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seagreen resize-y leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-5 flex items-center gap-3 flex-wrap">
              <button onClick={saveReport} disabled={saving}
                className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-navy-dark transition-colors disabled:opacity-50">
                {saving ? "Saving…" : "Save Report"}
              </button>
              <button onClick={sendReport}
                disabled={sendingReport || order.status === "delivered" || !hasDraft || !allLocked}
                className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                {sendingReport ? "Sending…" : order.status === "delivered" ? "✓ Sent" : "✉ Send to Customer"}
              </button>
              {!allLocked && hasDraft && (
                <p className="text-xs text-amber-600 font-medium">
                  Lock all {aiSections.length} AI sections to enable sending
                </p>
              )}
              {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
              {sendMsg && (
                <span className={`text-sm font-medium ${sendMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>
                  {sendMsg}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Order actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>Order Actions</h3>
        {order.status === "new" && (
          <button onClick={async () => {
            await fetch("/api/update-order-status", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id, status: "in_progress" }),
            });
            setOrder(p => ({ ...p, status: "in_progress" }));
          }} className="bg-yellow-100 text-yellow-700 font-semibold text-sm px-5 py-2 rounded-full hover:bg-yellow-200 transition-colors">
            Mark In Progress
          </button>
        )}
        {(order.status === "new" || order.status === "in_progress") && (
          <button onClick={async () => {
            await fetch("/api/update-order-status", {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ orderId: order.id, status: "delivered" }),
            });
            setOrder(p => ({ ...p, status: "delivered" }));
          }} className="bg-seagreen text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-opacity">
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
