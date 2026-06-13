"use client";

import { useState, useRef, useCallback } from "react";
import type { Order } from "@/lib/supabase";
import {
  VOC_PHASE2_SECTIONS,
  SERVICE_DISPLAY_NAMES,
  SERVICE_TAG_COLORS,
  getEffectiveServiceType,
  getQuestionLabels,
} from "@/lib/serviceConfig";
import type {
  VocQuestion, VocQuestionType, VocQuantData, ParsedCSV, ColumnMapping,
} from "@/lib/vocTypes";
import {
  VOC_QUESTION_TYPE_LABELS, VOC_GOOGLE_FORM_TYPE_LABELS,
} from "@/lib/vocTypes";
import { parseCSV, parseNarrativeResponses, autoMapColumns, calculateStats } from "@/lib/vocDataProcessing";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionMeta = { notes: string; locked: boolean; callout: string };
type MetaMap     = Record<string, SectionMeta>;

const AI_SECTIONS = VOC_PHASE2_SECTIONS.filter(s => s.aiGenerated);

function defaultMeta(): MetaMap {
  return Object.fromEntries(AI_SECTIONS.map(s => [s.key, { notes: "", locked: false, callout: "" }]));
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

function newQuestion(idx: number): VocQuestion {
  return {
    id:             `q_${Date.now()}_${idx}`,
    text:           "",
    type:           "open_ended",
    options:        [],
    bannerCut:      false,
    t2bB2b:         false,
    segmentationVar:false,
  };
}

const STATUS_COLORS: Record<string, string> = {
  new:         "bg-blue-100 text-blue-700",
  in_progress: "bg-yellow-100 text-yellow-700",
  delivered:   "bg-green-100 text-green-700",
};

const Q_TYPE_OPTIONS: { value: VocQuestionType; label: string }[] = [
  { value: "scale_1_7",       label: "1-7 Scale" },
  { value: "multiple_choice", label: "Multiple Choice" },
  { value: "select_all",      label: "Select All That Apply" },
  { value: "open_ended",      label: "Open-Ended" },
];

const Q_TYPE_COLOR: Record<VocQuestionType, string> = {
  scale_1_7:       "bg-blue-100 text-blue-700",
  multiple_choice: "bg-purple-100 text-purple-700",
  select_all:      "bg-violet-100 text-violet-700",
  open_ended:      "bg-gray-100 text-gray-600",
};

// ── Question Card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  q: VocQuestion;
  idx: number;
  total: number;
  onChange: (q: VocQuestion) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QuestionCard({ q, idx, total, onChange, onDelete, onMoveUp, onMoveDown }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  function set<K extends keyof VocQuestion>(k: K, v: VocQuestion[K]) {
    onChange({ ...q, [k]: v });
  }

  function setType(t: VocQuestionType) {
    onChange({
      ...q, type: t,
      t2bB2b:         t === "scale_1_7",
      segmentationVar:t === "multiple_choice" || t === "select_all",
      options:        (t === "multiple_choice" || t === "select_all") && q.options.length === 0
        ? ["", "", ""] : q.options,
    });
  }

  function setOption(i: number, v: string) {
    const opts = [...q.options]; opts[i] = v; set("options", opts);
  }
  function addOption() { set("options", [...q.options, ""]); }
  function removeOption(i: number) { set("options", q.options.filter((_, j) => j !== i)); }

  const hasBanner = q.type === "multiple_choice" || q.type === "select_all";
  const hasOptions = q.type === "multiple_choice" || q.type === "select_all";

  return (
    <div className="border border-gray-100 rounded-xl bg-white p-4">
      {/* Compact header row */}
      <div className="flex items-start gap-3">
        <span className="text-xs font-bold text-gray-400 mt-2.5 shrink-0 w-5">{idx + 1}</span>
        <div className="flex-1 min-w-0">
          <textarea
            rows={2}
            value={q.text}
            onChange={e => set("text", e.target.value)}
            placeholder="Question text…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-none"
          />
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <select
              value={q.type}
              onChange={e => setType(e.target.value as VocQuestionType)}
              className="text-xs border border-gray-200 rounded-full px-2.5 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-seafoam bg-white">
              {Q_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Q_TYPE_COLOR[q.type]}`}>
              {VOC_GOOGLE_FORM_TYPE_LABELS[q.type]}
            </span>
            {q.bannerCut && <span className="text-xs bg-teal-50 text-teal-700 border border-teal-200 px-2 py-0.5 rounded-full">Banner Cut</span>}
            {q.t2bB2b && <span className="text-xs bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-full">T2B/B2B</span>}
            {q.segmentationVar && <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">Seg. Var</span>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onMoveUp} disabled={idx === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs px-1" title="Move up">↑</button>
          <button onClick={onMoveDown} disabled={idx === total - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-20 text-xs px-1" title="Move down">↓</button>
          <button onClick={() => setExpanded(p => !p)} className="text-xs text-seafoam hover:text-navy border border-seafoam/30 rounded-full px-2 py-0.5 ml-1">
            {expanded ? "▲" : "▼"}
          </button>
          <button onClick={onDelete} className="text-red-300 hover:text-red-500 text-xs ml-1" title="Delete">✕</button>
        </div>
      </div>

      {/* Expanded settings */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-4">

          {/* Options (MC / select_all) */}
          {hasOptions && (
            <div>
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wide block mb-2">Answer Options</label>
              <div className="space-y-2">
                {q.options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      value={opt}
                      onChange={e => setOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam"
                    />
                    <button onClick={() => removeOption(i)} className="text-red-300 hover:text-red-500 text-xs px-1">✕</button>
                  </div>
                ))}
                <button onClick={addOption} className="text-xs text-seafoam border border-seafoam/40 rounded-full px-3 py-1 hover:border-seafoam transition-colors">
                  + Add Option
                </button>
              </div>
            </div>
          )}

          {/* Banner cut */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={q.bannerCut}
                onChange={e => set("bannerCut", e.target.checked)}
                className="rounded"
              />
              Use as banner cut variable (question text becomes the banner label)
            </label>
          </div>

          {/* Scale-specific */}
          {q.type === "scale_1_7" && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.t2bB2b}
                  onChange={e => set("t2bB2b", e.target.checked)}
                  className="rounded"
                />
                Calculate T2B (6-7) and B2B (1-2) in Phase 2 analysis
              </label>
            </div>
          )}

          {/* MC/SA-specific */}
          {hasBanner && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={q.segmentationVar}
                  onChange={e => set("segmentationVar", e.target.checked)}
                  className="rounded"
                />
                Use as segmentation variable for cross-tab banner cuts
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Column Mapping UI ─────────────────────────────────────────────────────────

interface MappingUIProps {
  questions:       VocQuestion[];
  csvHeaders:      string[];
  mapping:         ColumnMapping;
  onMappingChange: (m: ColumnMapping) => void;
  onConfirm:       () => void;
  totalRows:       number;
}

function MappingUI({ questions, csvHeaders, mapping, onMappingChange, onConfirm, totalRows }: MappingUIProps) {
  const allMapped = questions.every(q => !!mapping[q.id]);
  return (
    <div className="bg-white rounded-xl border border-teal-200 p-5 mt-4">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h4 className="font-semibold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>
            Column Mapping — {totalRows} Responses Detected
          </h4>
          <p className="text-xs text-gray-400 mt-0.5">Verify that each question maps to the correct CSV column.</p>
        </div>
        <button
          onClick={onConfirm}
          className="bg-teal-500 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-teal-600 transition-colors">
          Confirm Mapping &amp; Calculate Stats
        </button>
      </div>
      <div className="space-y-2.5">
        {questions.map(q => (
          <div key={q.id} className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-navy font-medium truncate">{q.text || "(no question text)"}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Q_TYPE_COLOR[q.type]}`}>
                {VOC_QUESTION_TYPE_LABELS[q.type]}
              </span>
            </div>
            <div className="shrink-0">
              <select
                value={mapping[q.id] ?? ""}
                onChange={e => onMappingChange({ ...mapping, [q.id]: e.target.value || null })}
                className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-400 bg-white max-w-xs">
                <option value="">— Not mapped —</option>
                {csvHeaders.map(h => <option key={h} value={h}>{h.length > 60 ? h.slice(0, 60) + "…" : h}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
      {!allMapped && (
        <p className="text-xs text-amber-500 font-medium mt-3">
          Some questions are not mapped — their stats will be skipped.
        </p>
      )}
    </div>
  );
}

// ── Stats Summary ─────────────────────────────────────────────────────────────

function StatsSummary({ quant, questions }: { quant: VocQuantData; questions: VocQuestion[] }) {
  const scaleQs = questions.filter(q => q.type === "scale_1_7" && quant.questionStats[q.id]);
  const mcQs    = questions.filter(q => (q.type === "multiple_choice" || q.type === "select_all") && quant.questionStats[q.id]);
  const oeQs    = questions.filter(q => q.type === "open_ended" && quant.questionStats[q.id]);
  return (
    <div className="bg-teal-50 border border-teal-200 rounded-xl p-5 mt-4">
      <p className="text-sm font-semibold text-navy mb-3">
        {quant.totalResponses} responses processed
      </p>
      {scaleQs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Rating Scales</p>
          <div className="space-y-2">
            {scaleQs.map(q => {
              const s = quant.questionStats[q.id];
              if (!s) return null;
              return (
                <div key={q.id} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                  <p className="text-xs text-navy font-medium mb-1 leading-snug">{q.text}</p>
                  <div className="flex gap-4 flex-wrap">
                    <span className="text-sm font-bold text-green-600">T2B: {s.t2b}%</span>
                    <span className="text-sm text-gray-500">Mean: {s.mean}</span>
                    <span className="text-sm font-bold text-red-400">B2B: {s.b2b}%</span>
                    <span className="text-xs text-gray-400">n={s.totalResponded}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {mcQs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Frequency Breakdowns</p>
          <div className="space-y-2">
            {mcQs.map(q => {
              const s = quant.questionStats[q.id];
              if (!s?.frequencies) return null;
              const sorted = Object.entries(s.frequencies).sort(([,a],[,b]) => b - a).slice(0, 4);
              return (
                <div key={q.id} className="bg-white rounded-lg px-4 py-3 border border-gray-100">
                  <p className="text-xs text-navy font-medium mb-1 leading-snug">{q.text} <span className="text-gray-400">(n={s.totalResponded})</span></p>
                  <div className="flex gap-3 flex-wrap">
                    {sorted.map(([opt, cnt]) => (
                      <span key={opt} className="text-xs text-gray-600">
                        <span className="font-semibold text-navy">{s.percentages?.[opt] ?? 0}%</span> {opt}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {Object.keys(quant.bannerCuts).length > 0 && (
        <p className="text-xs text-teal-700 font-medium">
          Banner cut tables calculated for {Object.keys(quant.bannerCuts).length} segmentation variable(s).
        </p>
      )}
      {oeQs.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {oeQs.reduce((n, q) => n + (quant.questionStats[q.id]?.totalResponded ?? 0), 0)} open-ended responses captured for thematic analysis.
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props { order: Order; onBack: () => void; }

export default function VoCDetail({ order: initialOrder, onBack }: Props) {
  const sd          = (initialOrder.service_data ?? {}) as Record<string, unknown>;
  const rawNote     = initialOrder.analyst_note ?? "";
  const hasUpload   = rawNote.includes("contact-list:");
  const contactPath = hasUpload ? rawNote.split("contact-list:")[1]?.trim() ?? null : null;
  const contactFile = contactPath ? contactPath.split("/").slice(1).join("/") : null;

  const [order,    setOrder]  = useState(initialOrder);
  const [phase,    setPhase]  = useState<1 | 2>((sd.voc_phase as 1 | 2) ?? 1);
  const [questions,setQs]     = useState<VocQuestion[]>((sd.voc_question_map as VocQuestion[]) ?? []);
  const [draft,    setDraft]  = useState<Record<string, string>>(
    (initialOrder.ai_draft as Record<string, string>) ?? {}
  );
  const [meta,     setMeta]   = useState<MetaMap>(() =>
    initMeta(initialOrder.analyst_commentary as Record<string, unknown> | null)
  );
  const [note,     setNote]   = useState((sd.voc_closing_note as string) ?? "");
  const [quant,    setQuant]  = useState<VocQuantData | null>((sd.voc_quant_data as VocQuantData) ?? null);
  const [mapping,  setMapping]= useState<ColumnMapping>((sd.voc_column_mapping as ColumnMapping) ?? {});
  const [parsedCSV,setParsed] = useState<ParsedCSV | null>(null);
  const [mappingReady, setMappingReady] = useState(false);
  const [statsReady,   setStatsReady]   = useState(!!quant);
  const [uploadMode,   setUploadMode]   = useState<"upload" | "paste">("upload");
  const [pasteText,    setPasteText]    = useState("");

  const [genQs,      setGenQs]     = useState(false);
  const [genQsErr,   setGenQsErr]  = useState<string | null>(null);
  const [genPhase2,  setGenP2]     = useState(false);
  const [genIdx,     setGenIdx]    = useState(-1);
  const [genFailed,  setGenFailed] = useState<Record<string, string>>({});
  const [retrying,   setRetrying]  = useState<Record<string, boolean>>({});
  const [regening,   setRegening]  = useState<Record<string, boolean>>({});
  const [regenErr,   setRegenErr]  = useState<Record<string, string | undefined>>({});
  const [editingKey, setEditingKey]= useState<string | null>(null);
  const [editBuf,    setEditBuf]   = useState("");
  const [saving,     setSaving]    = useState(false);
  const [saveMsg,    setSaveMsg]   = useState<string | null>(null);
  const [autoSaved,  setAutoSaved] = useState(false);
  const [dlDocx,     setDlDocx]    = useState(false);
  const [sending,    setSending]   = useState(false);
  const [sendMsg,    setSendMsg]   = useState<string | null>(null);
  const [dlLink,     setDlLink]    = useState<string | null>(null);
  const [dlLinkLoad, setDlLinkLoad]= useState(false);

  const metaTimer = useRef<NodeJS.Timeout | null>(null);
  const noteTimer = useRef<NodeJS.Timeout | null>(null);
  const qsTimer   = useRef<NodeJS.Timeout | null>(null);

  const lockedCount = AI_SECTIONS.filter(s => meta[s.key]?.locked).length;
  const allLocked   = lockedCount === AI_SECTIONS.length;
  const hasDraft    = Object.keys(draft).length > 0;
  const svcType     = getEffectiveServiceType(order.service_type);
  const tagColor    = SERVICE_TAG_COLORS[svcType] ?? "bg-gray-100 text-gray-500";
  const qLabels     = getQuestionLabels("voice_of_customer_survey");

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
      service_data: { ...sd, voc_closing_note: n, voc_phase: phase },
    }), 2000);
  }

  function schedQs(qs: VocQuestion[]) {
    if (qsTimer.current) clearTimeout(qsTimer.current);
    qsTimer.current = setTimeout(() => persist({
      service_data: { ...sd, voc_question_map: qs, voc_phase: phase },
    }), 2000);
  }

  function updateQuestion(idx: number, q: VocQuestion) {
    const next = questions.map((old, i) => i === idx ? q : old);
    setQs(next); schedQs(next);
  }

  function addQuestion() {
    const next = [...questions, newQuestion(questions.length)];
    setQs(next); schedQs(next);
  }

  function deleteQuestion(idx: number) {
    const next = questions.filter((_, i) => i !== idx);
    setQs(next); schedQs(next);
  }

  function moveQuestion(idx: number, dir: -1 | 1) {
    const next = [...questions];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setQs(next); schedQs(next);
  }

  async function generateQuestions() {
    setGenQs(true); setGenQsErr(null);
    try {
      const res  = await fetch("/api/generate-voc-questions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setQs(data.questions as VocQuestion[]);
    } catch (e) {
      setGenQsErr(e instanceof Error ? e.message : "Generation failed");
    } finally { setGenQs(false); }
  }

  async function markPhase1Complete() {
    if (!confirm("Mark Phase 1 complete and unlock Phase 2 — Analysis?")) return;
    const newPhase = 2;
    setPhase(2);
    await persist({
      service_data: { ...sd, voc_phase: newPhase, voc_question_map: questions },
    });
  }

  // Shared processing — file upload always uses parseCSV (forceCSV=true).
  // Paste auto-detects: if the first line has a colon before any comma (e.g. "Overall satisfaction: 6/7"),
  // it's narrative "Label: value" format → parseNarrativeResponses. Otherwise → parseCSV.
  function processCSVText(text: string, forceCSV = false) {
    let parsed;
    if (forceCSV) {
      parsed = parseCSV(text);
    } else {
      const firstLine = text.trimStart().split("\n")[0]?.trim() ?? "";
      const colonIdx  = firstLine.indexOf(":");
      const isNarrative = colonIdx > 0 && !firstLine.slice(0, colonIdx).includes(",");
      parsed = isNarrative ? parseNarrativeResponses(text) : parseCSV(text);
    }
    if (parsed.headers.length === 0) return;
    const autoMap = autoMapColumns(questions, parsed.headers);
    setParsed(parsed);
    setMapping(autoMap);
    setMappingReady(true);
    setStatsReady(false);
  }

  function handleCSVUpload(file: File) {
    const reader = new FileReader();
    reader.onload = e => processCSVText(e.target?.result as string, true);
    reader.readAsText(file);
  }

  function confirmMapping() {
    if (!parsedCSV) return;
    const calculated = calculateStats(parsedCSV, questions, mapping);
    setQuant(calculated);
    setStatsReady(true);
    setMappingReady(false);
    persist({
      service_data: {
        ...sd, voc_quant_data: calculated, voc_column_mapping: mapping,
        voc_phase: phase, voc_question_map: questions,
      },
    });
  }

  async function generatePhase2() {
    if (!quant) { alert("Upload and process the CSV first."); return; }
    setGenP2(true); setGenIdx(-1);
    for (let i = 0; i < AI_SECTIONS.length; i++) {
      const s = AI_SECTIONS[i];
      setGenIdx(i);
      setGenFailed(prev => { const n = { ...prev }; delete n[s.key]; return n; });
      try {
        const res = await fetch("/api/generate-voc-section", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: order.id, sectionKey: s.key, quantData: quant, questionMap: questions,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setDraft(prev => ({ ...prev, [s.key]: data.content as string }));
      } catch (e) {
        setGenFailed(prev => ({ ...prev, [s.key]: e instanceof Error ? e.message : "Failed" }));
      }
    }
    setGenP2(false); setGenIdx(-1);
  }

  async function retrySection(key: string) {
    setGenFailed(prev => { const n = { ...prev }; delete n[key]; return n; });
    setRetrying(prev => ({ ...prev, [key]: true }));
    try {
      const res = await fetch("/api/generate-voc-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, sectionKey: key, quantData: quant, questionMap: questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Retry failed");
      setDraft(prev => ({ ...prev, [key]: data.content as string }));
    } catch (e) {
      setGenFailed(prev => ({ ...prev, [key]: e instanceof Error ? e.message : "Retry failed" }));
    } finally { setRetrying(prev => ({ ...prev, [key]: false })); }
  }

  async function regenerateSection(key: string) {
    setRegening(p => ({ ...p, [key]: true }));
    setRegenErr(p => ({ ...p, [key]: undefined }));
    try {
      const res = await fetch("/api/generate-voc-section", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id, sectionKey: key,
          quantData: quant, questionMap: questions,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDraft(p => ({ ...p, [key]: data.content as string }));
      flashSaved();
    } catch (e) { setRegenErr(p => ({ ...p, [key]: e instanceof Error ? e.message : "Failed" })); }
    finally { setRegening(p => ({ ...p, [key]: false })); }
  }

  function lockSection(key: string) {
    const u = { ...meta, [key]: { ...meta[key], locked: true } };
    setMeta(u); setEditingKey(null); persist({ analyst_commentary: u });
  }

  function unlockSection(key: string) {
    const u = { ...meta, [key]: { ...meta[key], locked: false } };
    setMeta(u); persist({ analyst_commentary: u });
  }

  async function saveReport() {
    setSaving(true); setSaveMsg(null);
    const st = order.status === "new" ? "in_progress" : order.status;
    await fetch("/api/update-order-status", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: order.id, ai_draft: draft, analyst_commentary: meta, status: st,
        service_data: { ...sd, voc_closing_note: note, voc_phase: phase, voc_question_map: questions, voc_quant_data: quant, voc_column_mapping: mapping },
      }),
    });
    setOrder(p => ({ ...p, status: st as Order["status"] }));
    setSaveMsg("All changes saved."); setTimeout(() => setSaveMsg(null), 3000); setSaving(false);
  }

  async function downloadDocx() {
    setDlDocx(true);
    try {
      const ap = Object.fromEntries(AI_SECTIONS.map(s => [s.key, meta[s.key]?.callout ?? ""]));
      const res = await fetch("/api/generate-voc-pdf", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, analystNote: note, aiDraft: draft, analystPerspectives: ap, questionMap: questions, quantData: quant }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error ?? "Failed"); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `SeaGlassInsights-${order.business_name.replace(/[^a-zA-Z0-9]/g, "")}-VoiceOfCustomerReport.docx`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setOrder(p => ({ ...p, status: "delivered" }));
      setSendMsg(`Report sent to ${order.email}`);
    } catch (e) { setSendMsg(`Error: ${e instanceof Error ? e.message : "Unknown"}`); }
    finally { setSending(false); setTimeout(() => setSendMsg(null), 6000); }
  }

  async function fetchDlLink() {
    if (!contactPath || dlLink) return;
    setDlLinkLoad(true);
    try {
      const res  = await fetch(`/api/get-contact-list-url?path=${encodeURIComponent(contactPath)}`);
      const data = await res.json();
      if (res.ok && data.url) setDlLink(data.url as string);
    } catch { /* non-blocking */ }
    finally { setDlLinkLoad(false); }
  }

  // ── Renders an AI section ───────────────────────────────────────────────────
  function renderAISection(key: string, label: string, sectionNum: number) {
    const m         = meta[key] ?? { notes: "", locked: false, callout: "" };
    const content   = draft[key] ?? "";
    const isEditing = editingKey === key;
    const isFailed  = !!genFailed[key];
    const isRetrying= !!retrying[key];
    const isRegening= !!regening[key];

    return (
      <div key={key} className="border-t border-gray-100 py-5 first:border-0 first:pt-0">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full shrink-0">
            Section {sectionNum}
          </span>
          <h5 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>{label}</h5>
          {m.locked && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Locked</span>}
        </div>

        <div className="flex items-center gap-2 mb-3 justify-end">
          {!m.locked && !isEditing && content && !isFailed && !isRetrying && (
            <button onClick={() => { setEditBuf(content); setEditingKey(key); }}
              className="text-xs text-seafoam hover:text-navy border border-seafoam/40 rounded-full px-3 py-1 transition-colors font-medium">
              Edit
            </button>
          )}
          {m.locked
            ? <button onClick={() => unlockSection(key)} className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Unlock</button>
            : content && !isFailed && !isRetrying && (
                <button onClick={() => lockSection(key)}
                  className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">
                  Lock Section
                </button>
              )
          }
        </div>

        {isRetrying ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
            <div className="w-4 h-4 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            Retrying…
          </div>
        ) : isFailed ? (
          <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-3">{genFailed[key]}</p>
            <button onClick={() => retrySection(key)}
              className="text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-4 py-2 rounded-full transition-colors">
              ↺ Retry this section
            </button>
          </div>
        ) : isEditing ? (
          <div className="mb-3">
            <textarea rows={12} value={editBuf} onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed"
              autoFocus />
            <div className="flex gap-2 mt-2">
              <button onClick={() => {
                const u = { ...draft, [key]: editBuf };
                setDraft(u); setEditingKey(null); persist({ ai_draft: u });
              }} className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition-colors">
                Apply
              </button>
              <button onClick={() => setEditingKey(null)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancel</button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{content}</p>
        ) : (
          <p className="text-sm text-gray-300 italic mb-3">Generate analysis to populate this section.</p>
        )}

        {/* Analyst Perspective callout */}
        <div className="mb-3 border-l-4 border-navy/60 pl-4 py-3 bg-slate-50 rounded-r-lg">
          <label className="block mb-2" style={{ fontFamily: "'Montserrat', system-ui, sans-serif", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", color: "#0A2F61", textTransform: "uppercase" }}>
            Analyst Perspective
          </label>
          <textarea rows={3} value={m.callout}
            onChange={e => { const u = { ...meta, [key]: { ...m, callout: e.target.value } }; setMeta(u); schedMeta(u); }}
            placeholder="Your expert interpretation of what this finding means for this client…"
            disabled={m.locked}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-navy/20 resize-y placeholder-gray-300 bg-white disabled:bg-gray-50 disabled:text-gray-400"
          />
          <p className="text-xs text-gray-400 mt-1">Optional — appears in report with navy accent if filled.</p>
        </div>

        {/* Analyst notes + regen */}
        {!m.locked && (
          <div className="pt-2 border-t border-gray-50 space-y-2">
            <textarea rows={2} value={m.notes}
              onChange={e => { const u = { ...meta, [key]: { ...m, notes: e.target.value } }; setMeta(u); schedMeta(u); }}
              placeholder="Direction for regenerating this section…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300" />
            {regenErr[key] && <p className="text-red-500 text-xs">{regenErr[key]}</p>}
            <button onClick={() => regenerateSection(key)} disabled={isRegening}
              className="inline-flex items-center gap-1.5 text-xs bg-navy text-white font-semibold px-4 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50">
              {isRegening ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Regenerating…</> : "↺ Regenerate"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const intakeAnswers = [order.q1, order.q2, order.q3, order.q4, order.q5, order.q6, order.q7];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-navy transition-colors">← All Orders</button>
        <div className="h-4 w-px bg-gray-200" />
        <h2 className="text-navy text-2xl font-bold" style={{ fontFamily: "Georgia, serif" }}>{order.business_name}</h2>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${tagColor}`}>{SERVICE_DISPLAY_NAMES[svcType]}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_COLORS[order.status] ?? STATUS_COLORS.new}`}>{order.status.replace("_", " ")}</span>
        {autoSaved && <span className="text-xs text-green-500 font-medium ml-auto">✓ Auto-saved</span>}
      </div>

      {/* Phase indicator */}
      <div className="flex items-center mb-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        {([1, 2] as const).map(p => (
          <div key={p} className={`flex-1 flex items-center gap-2 px-5 py-3.5 ${phase === p ? "bg-teal-50 border-b-2 border-teal-400" : "bg-white"} ${p === 2 ? "border-l border-gray-100" : ""}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${phase > p ? "bg-green-400 text-white" : phase === p ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
              {phase > p ? "✓" : p}
            </span>
            <div>
              <p className={`text-xs font-semibold ${phase >= p ? "text-navy" : "text-gray-400"}`}>Phase {p}</p>
              <p className={`text-xs ${phase >= p ? "text-gray-500" : "text-gray-300"}`}>
                {p === 1 ? "Survey Design" : `Analysis${phase < 2 ? " — locked" : ""}`}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Customer info */}
      <div className="bg-white rounded-xl border border-gray-100 px-6 py-4 mb-6 flex flex-wrap gap-6 text-sm">
        <div><span className="text-gray-400">Customer</span><p className="font-semibold text-navy mt-0.5">{order.customer_name}</p></div>
        <div><span className="text-gray-400">Email</span><p className="font-semibold text-navy mt-0.5">{order.email}</p></div>
        <div><span className="text-gray-400">Submitted</span><p className="font-semibold text-navy mt-0.5">{new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p></div>
        <div><span className="text-gray-400">Order ID</span><p className="font-mono text-xs text-gray-400 mt-0.5">{order.id.slice(0, 8)}…</p></div>
      </div>

      {/* Contact list */}
      {contactPath && (
        <div className="bg-white rounded-xl border border-teal-200 px-6 py-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Contact List Uploaded</p>
              <p className="text-sm text-navy font-medium truncate">{contactFile ?? contactPath}</p>
            </div>
            {dlLink
              ? <a href={dlLink} target="_blank" rel="noopener noreferrer" className="text-xs bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-4 py-1.5 rounded-full hover:bg-teal-100 transition-colors shrink-0">⬇ Download</a>
              : <button onClick={fetchDlLink} disabled={dlLinkLoad} className="text-xs bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-4 py-1.5 rounded-full hover:bg-teal-100 transition-colors shrink-0 disabled:opacity-50">
                  {dlLinkLoad ? "Loading…" : "Get Download Link"}
                </button>
            }
          </div>
        </div>
      )}

      {/* Intake answers */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h3 className="text-navy font-semibold mb-4" style={{ fontFamily: "Georgia, serif" }}>Intake Answers</h3>
        <div className="space-y-4">
          {qLabels.map((q, i) => {
            const a = intakeAnswers[i];
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

      {/* ── PHASE 1 ─────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 ${phase === 1 ? "border-teal-200" : "border-gray-100"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase > 1 ? "bg-green-400 text-white" : "bg-teal-400 text-white"}`}>
              {phase > 1 ? "✓" : "1"}
            </span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 1 — Survey Design</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={generateQuestions} disabled={genQs}
              className="bg-navy text-white font-semibold text-sm px-4 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50">
              {genQs ? "Drafting questions…" : questions.length ? "Re-draft Questions" : "AI Draft Questions"}
            </button>
            <button onClick={addQuestion}
              className="bg-seafoam text-navy font-semibold text-sm px-4 py-2 rounded-full hover:opacity-90 transition-colors">
              + Add Question
            </button>
          </div>
        </div>

        {genQs && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <div className="w-4 h-4 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            Analyzing intake and drafting survey questions…
          </div>
        )}
        {genQsErr && <p className="text-red-500 text-sm mb-4">{genQsErr}</p>}

        {questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id} q={q} idx={i} total={questions.length}
                onChange={nq => updateQuestion(i, nq)}
                onDelete={() => deleteQuestion(i)}
                onMoveUp={() => moveQuestion(i, -1)}
                onMoveDown={() => moveQuestion(i, 1)}
              />
            ))}
          </div>
        ) : !genQs && (
          <p className="text-sm text-gray-400 italic py-4">
            Click "AI Draft Questions" to generate an initial set, or "Add Question" to build manually.
          </p>
        )}

        {questions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3 font-medium">
              Google Forms preview — {questions.length} question{questions.length !== 1 ? "s" : ""}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-500 font-mono whitespace-pre-wrap leading-relaxed mb-4 max-h-60 overflow-y-auto">
              {questions.map((q, i) => {
                const tl: Record<string, string> = { scale_1_7: "Linear Scale 1–7", multiple_choice: "Multiple Choice", select_all: "Checkboxes", open_ended: "Paragraph" };
                let out = `${i+1}. ${q.text || "(no text)"}\n   [${tl[q.type] ?? q.type}]`;
                if ((q.type === "multiple_choice" || q.type === "select_all") && q.options.length)
                  out += "\n" + q.options.map(o => `   • ${o}`).join("\n");
                return out;
              }).join("\n\n")}
            </div>
            {phase === 1 && (
              <button onClick={markPhase1Complete}
                className="bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-teal-600 transition-colors">
                ✓ Phase 1 Complete — Unlock Phase 2 Analysis
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── PHASE 2 ─────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 transition-opacity ${phase === 1 ? "border-gray-100 opacity-40 pointer-events-none" : "border-teal-200"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase === 2 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>2</span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              Phase 2 — Analysis{phase === 1 ? " (Locked)" : ""}
            </h3>
          </div>
          {phase === 2 && (
            <button onClick={generatePhase2} disabled={genPhase2 || !statsReady}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!statsReady ? "Process CSV data first" : ""}>
              {genPhase2 ? "Generating…" : "Generate All Sections"}
            </button>
          )}
        </div>

        {phase === 2 && (
          <>
            {/* Section 1 — Data Upload */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full shrink-0">Section 1</span>
                <h5 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>Response Data</h5>
                {statsReady && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Processed</span>}
              </div>

              {/* Mode toggle */}
              <div className="inline-flex rounded-full border border-gray-200 p-0.5 mb-4 bg-gray-50">
                <button
                  onClick={() => setUploadMode("upload")}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${uploadMode === "upload" ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                  Upload CSV
                </button>
                <button
                  onClick={() => setUploadMode("paste")}
                  className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${uploadMode === "paste" ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                  Paste Responses
                </button>
              </div>

              {uploadMode === "upload" ? (
                <div>
                  <p className="text-xs text-gray-400 mb-3">Upload the Google Forms CSV export. Columns will be auto-mapped to your survey questions.</p>
                  <label className="inline-flex items-center gap-2 cursor-pointer bg-navy text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors">
                    <span>{statsReady ? "Re-upload CSV" : "Upload CSV"}</span>
                    <input type="file" accept=".csv" className="hidden" onChange={e => {
                      const f = e.target.files?.[0];
                      if (f) handleCSVUpload(f);
                      e.target.value = "";
                    }} />
                  </label>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 mb-3">Paste CSV text directly — e.g. copied from a Google Forms export or a spreadsheet. The first row must be column headers. Columns will be auto-mapped to your survey questions.</p>
                  <textarea
                    rows={6}
                    value={pasteText}
                    onChange={e => setPasteText(e.target.value)}
                    placeholder={"Timestamp,How satisfied were you overall?,How likely are you to recommend us?,…\n5/1/2025 10:22:34,6,7,Great service…"}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300 mb-3"
                  />
                  <button
                    onClick={() => { processCSVText(pasteText); setPasteText(""); }}
                    disabled={pasteText.trim().length === 0}
                    className="bg-navy text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-40">
                    Process Responses
                  </button>
                </div>
              )}

              {mappingReady && parsedCSV && (
                <MappingUI
                  questions={questions}
                  csvHeaders={parsedCSV.headers}
                  mapping={mapping}
                  onMappingChange={setMapping}
                  onConfirm={confirmMapping}
                  totalRows={parsedCSV.rows.length}
                />
              )}

              {statsReady && quant && (
                <StatsSummary quant={quant} questions={questions} />
              )}
            </div>

            {/* Generation progress */}
            {genPhase2 && (
              <div className="py-3 space-y-1.5 mb-4 bg-gray-50 rounded-xl px-4">
                {AI_SECTIONS.map((s, i) => {
                  const isDone   = !!draft[s.key] && i < genIdx;
                  const isActive = genIdx === i;
                  const isPend   = !isDone && !isActive;
                  return (
                    <div key={s.key} className="flex items-center gap-2.5">
                      {isDone    && <span className="text-green-500 text-xs shrink-0">✓</span>}
                      {isActive  && <div className="w-3 h-3 border-2 border-seafoam border-t-transparent rounded-full animate-spin shrink-0" />}
                      {isPend    && <span className="text-gray-200 text-xs shrink-0">○</span>}
                      <span className={`text-sm ${isDone ? "text-gray-400" : isActive ? "text-navy font-medium" : "text-gray-300"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Sections 2-5 */}
            {AI_SECTIONS.map((s, i) => renderAISection(s.key, s.label, i + 2))}

            {/* Analyst Note */}
            <div className="border-t-2 border-dashed border-teal-200 pt-5 mt-4">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
                Section {AI_SECTIONS.length + 2} — Analyst Note
              </label>
              <p className="text-xs text-gray-400 mb-2 leading-relaxed">Personal closing paragraph in your own voice. Auto-saved as you type.</p>
              <textarea rows={5} value={note}
                onChange={e => { setNote(e.target.value); schedNote(e.target.value); }}
                placeholder="Your personal closing note to the client…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300"
              />
            </div>

            {/* Actions */}
            <div className="pt-5 mt-4 border-t border-dashed border-seagreen/30 flex items-center gap-3 flex-wrap">
              <button onClick={saveReport} disabled={saving}
                className="bg-navy text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? "Saving…" : "Save Report"}
              </button>
              <button onClick={downloadDocx} disabled={!allLocked || dlDocx}
                className="bg-seagreen text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
                {dlDocx ? "Building…" : "⬇ Save as Word Document"}
              </button>
              <button onClick={sendReport} disabled={sending || order.status === "delivered" || !allLocked}
                className="bg-seafoam text-navy font-semibold text-sm px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity disabled:opacity-50">
                {sending ? "Sending…" : order.status === "delivered" ? "✓ Sent" : "✉ Send to Customer"}
              </button>
              {!allLocked && hasDraft && (
                <p className="text-xs text-amber-600 font-medium">
                  Lock all {AI_SECTIONS.length} sections to enable download and send ({lockedCount}/{AI_SECTIONS.length} locked)
                </p>
              )}
              {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
              {sendMsg && <span className={`text-sm font-medium ${sendMsg.startsWith("Error") ? "text-red-500" : "text-green-600"}`}>{sendMsg}</span>}
            </div>
          </>
        )}
      </div>

      {/* Order Actions */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 flex flex-wrap gap-3">
        <h3 className="w-full text-navy font-semibold mb-1" style={{ fontFamily: "Georgia, serif" }}>Order Actions</h3>
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
