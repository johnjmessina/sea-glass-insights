"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

// VOC has 5 phases: 1=Design, 2=Contacts, 3=Sent/Collecting, 4=Analysis, 5=Draft
type VocPhase = 1 | 2 | 3 | 4 | 5;

interface SurveyContact {
  id:           string;
  name:         string | null;
  email:        string;
  token:        string;
  sent_at:      string | null;
  completed_at: string | null;
}

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

const PHASE_LABELS: Record<VocPhase, string> = {
  1: "Survey Design",
  2: "Contacts",
  3: "Collecting",
  4: "Analysis",
  5: "Draft Report",
};

// ── Question Card ─────────────────────────────────────────────────────────────

interface QuestionCardProps {
  q: VocQuestion;
  idx: number;
  total: number;
  isSyndicated?: boolean;
  onChange: (q: VocQuestion) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function QuestionCard({ q, idx, total, isSyndicated, onChange, onDelete, onMoveUp, onMoveDown }: QuestionCardProps) {
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

  const hasBanner  = q.type === "multiple_choice" || q.type === "select_all";
  const hasOptions = q.type === "multiple_choice" || q.type === "select_all";

  return (
    <div className={`border rounded-xl bg-white p-4 ${isSyndicated ? "border-teal-200 bg-teal-50/30" : "border-gray-100"}`}>
      {isSyndicated && (
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-semibold text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full">Syndicated</span>
          <span className="text-xs text-teal-500">Standard across all VOC surveys</span>
        </div>
      )}
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
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={q.bannerCut} onChange={e => set("bannerCut", e.target.checked)} className="rounded" />
              Use as banner cut variable
            </label>
          </div>
          {q.type === "scale_1_7" && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={q.t2bB2b} onChange={e => set("t2bB2b", e.target.checked)} className="rounded" />
                Calculate T2B (6-7) and B2B (1-2) in analysis
              </label>
            </div>
          )}
          {hasBanner && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input type="checkbox" checked={q.segmentationVar} onChange={e => set("segmentationVar", e.target.checked)} className="rounded" />
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
          <p className="text-xs text-gray-400 mt-0.5">Verify each question maps to the correct CSV column.</p>
        </div>
        <button onClick={onConfirm} className="bg-teal-500 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-teal-600 transition-colors">
          Confirm &amp; Calculate Stats
        </button>
      </div>
      <div className="space-y-2.5">
        {questions.map(q => (
          <div key={q.id} className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-navy font-medium truncate">{q.text || "(no question text)"}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${Q_TYPE_COLOR[q.type]}`}>{VOC_QUESTION_TYPE_LABELS[q.type]}</span>
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
      {!allMapped && <p className="text-xs text-amber-500 font-medium mt-3">Some questions unmapped — their stats will be skipped.</p>}
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
      <p className="text-sm font-semibold text-navy mb-3">{quant.totalResponses} responses processed</p>
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
        <p className="text-xs text-teal-700 font-medium">Banner cuts for {Object.keys(quant.bannerCuts).length} segmentation variable(s).</p>
      )}
      {oeQs.length > 0 && (
        <p className="text-xs text-gray-500 mt-1">
          {oeQs.reduce((n, q) => n + (quant.questionStats[q.id]?.totalResponded ?? 0), 0)} open-ended responses for thematic analysis.
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props { order: Order; onBack: () => void; }

export default function VoCDetail({ order: initialOrder, onBack }: Props) {
  const sd = (initialOrder.service_data ?? {}) as Record<string, unknown>;

  // Derive stored phase — map old 1/2 values to new 5-phase scale
  function getStoredPhase(): VocPhase {
    const raw = sd.voc_phase as number | undefined;
    if (!raw) return 1;
    // Old system: 1=design, 2=analysis. New: 1=design, 2=contacts, 3=collecting, 4=analysis, 5=draft
    if (raw === 2) return 5; // old Phase 2 maps to Phase 5 (draft report)
    return Math.min(Math.max(raw, 1), 5) as VocPhase;
  }

  const [order,    setOrder]  = useState(initialOrder);
  const [phase,    setPhase]  = useState<VocPhase>(getStoredPhase());
  const [questions,setQs]     = useState<VocQuestion[]>((sd.voc_question_map as VocQuestion[]) ?? []);
  const [draft,    setDraft]  = useState<Record<string, string>>((initialOrder.ai_draft as Record<string, string>) ?? {});
  const [meta,     setMeta]   = useState<MetaMap>(() => initMeta(initialOrder.analyst_commentary as Record<string, unknown> | null));
  const [note,     setNote]   = useState((sd.voc_closing_note as string) ?? "");
  const [quant,    setQuant]  = useState<VocQuantData | null>((sd.voc_quant_data as VocQuantData) ?? null);
  const [mapping,  setMapping]= useState<ColumnMapping>((sd.voc_column_mapping as ColumnMapping) ?? {});
  const [parsedCSV,setParsed] = useState<ParsedCSV | null>(null);
  const [mappingReady, setMappingReady] = useState(false);
  const [statsReady,   setStatsReady]   = useState(!!quant);
  const [uploadMode,   setUploadMode]   = useState<"upload" | "paste">("upload");
  const [pasteText,    setPasteText]    = useState("");

  // Phase 2/3: contacts
  const [contacts,       setContacts]       = useState<SurveyContact[]>([]);
  const [contactsLoaded, setContactsLoaded] = useState(false);
  const [csvContactText, setCsvContactText] = useState("");
  const [csvContactMode, setCsvContactMode] = useState<"upload" | "paste">("upload");
  const [uploadingCsv,   setUploadingCsv]   = useState(false);
  const [uploadErr,      setUploadErr]       = useState<string | null>(null);
  const [sendingEmails,  setSendingEmails]   = useState(false);
  const [sendResult,     setSendResult]      = useState<{ sent: number; failed: string[] } | null>(null);
  const [sendErr,        setSendErr]         = useState<string | null>(null);

  // Phase 4: load responses from DB
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [loadResErr,       setLoadResErr]        = useState<string | null>(null);

  const [genQs,      setGenQs]     = useState(false);
  const [genQsErr,   setGenQsErr]  = useState<string | null>(null);
  const [genPhase5,  setGenP5]     = useState(false);
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

  async function advanceTo(nextPhase: VocPhase) {
    setPhase(nextPhase);
    await persist({ service_data: { ...sd, voc_phase: nextPhase, voc_question_map: questions } });
  }

  // ── Phase 2: load contacts from Supabase ─────────────────────────────────

  async function loadContacts() {
    if (contactsLoaded) return;
    try {
      const res  = await fetch(`/api/voc/survey-status?orderId=${order.id}`);
      const data = await res.json();
      if (res.ok) setContacts(data.contacts ?? []);
    } catch { /* ignore */ }
    setContactsLoaded(true);
  }

  useEffect(() => {
    if (phase >= 2) loadContacts();
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleContactCsvUpload(csvText: string) {
    setUploadingCsv(true); setUploadErr(null);
    try {
      const res  = await fetch("/api/voc/upload-contacts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, csvText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setContacts(data.contacts ?? []);
      setCsvContactText("");
    } catch (e) { setUploadErr(e instanceof Error ? e.message : "Upload failed"); }
    finally { setUploadingCsv(false); }
  }

  function handleContactFileUpload(file: File) {
    const reader = new FileReader();
    reader.onload = e => handleContactCsvUpload(e.target?.result as string);
    reader.readAsText(file);
  }

  async function sendSurveyEmails() {
    if (!confirm(`Send survey emails to ${contacts.filter(c => !c.sent_at).length} contacts?`)) return;
    setSendingEmails(true); setSendErr(null); setSendResult(null);
    try {
      const res  = await fetch("/api/voc/send-survey", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Send failed");
      setSendResult({ sent: data.sent, failed: data.failed ?? [] });
      // Refresh contacts
      const sr  = await fetch(`/api/voc/survey-status?orderId=${order.id}`);
      const sd2 = await sr.json();
      if (sr.ok) setContacts(sd2.contacts ?? []);
      // Advance to Phase 3
      await advanceTo(3);
    } catch (e) { setSendErr(e instanceof Error ? e.message : "Send failed"); }
    finally { setSendingEmails(false); }
  }

  // ── Phase 4: load responses from DB ──────────────────────────────────────

  async function loadResponsesFromDB() {
    if (!questions.length) { setLoadResErr("No questions found — design your survey first."); return; }
    setLoadingResponses(true); setLoadResErr(null);
    try {
      const res  = await fetch("/api/voc/load-responses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, questions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const q = data.quant as VocQuantData;
      setQuant(q); setStatsReady(true);
      persist({ service_data: { ...sd, voc_quant_data: q, voc_phase: phase, voc_question_map: questions } });
    } catch (e) { setLoadResErr(e instanceof Error ? e.message : "Failed to load responses"); }
    finally { setLoadingResponses(false); }
  }

  // Manual CSV fallback (Phase 4)
  function processCSVText(text: string, forceCSV = false) {
    if (forceCSV) {
      const parsed = parseCSV(text);
      if (parsed.headers.length === 0) return;
      const autoMap = autoMapColumns(questions, parsed.headers);
      setParsed(parsed); setMapping(autoMap); setMappingReady(true); setStatsReady(false);
      return;
    }
    const firstLine   = text.trimStart().split("\n")[0]?.trim() ?? "";
    const colonIdx    = firstLine.indexOf(":");
    const isNarrative = colonIdx > 0 && !firstLine.slice(0, colonIdx).includes(",");
    const parsed      = isNarrative ? parseNarrativeResponses(text) : parseCSV(text);
    if (parsed.headers.length === 0) return;
    const autoMap = autoMapColumns(questions, parsed.headers);
    if (isNarrative) {
      applyStats(parsed, autoMap);
    } else {
      setParsed(parsed); setMapping(autoMap); setMappingReady(true); setStatsReady(false);
    }
  }

  function applyStats(parsed: ParsedCSV, map: ColumnMapping) {
    const calculated = calculateStats(parsed, questions, map);
    setQuant(calculated); setStatsReady(true); setMappingReady(false);
    persist({ service_data: { ...sd, voc_quant_data: calculated, voc_column_mapping: map, voc_phase: phase, voc_question_map: questions } });
  }

  function handleCSVUpload(file: File) {
    const reader = new FileReader();
    reader.onload = e => processCSVText(e.target?.result as string, true);
    reader.readAsText(file);
  }

  function confirmMapping() {
    if (!parsedCSV) return;
    applyStats(parsedCSV, mapping);
  }

  // ── Phase 5: AI section generation ───────────────────────────────────────

  async function generatePhase5() {
    if (!quant) { alert("Load response data first."); return; }
    setGenP5(true); setGenIdx(-1);
    for (let i = 0; i < AI_SECTIONS.length; i++) {
      const s = AI_SECTIONS[i];
      setGenIdx(i);
      setGenFailed(prev => { const n = { ...prev }; delete n[s.key]; return n; });
      try {
        const res = await fetch("/api/generate-voc-section", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id, sectionKey: s.key, quantData: quant, questionMap: questions }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed");
        setDraft(prev => ({ ...prev, [s.key]: data.content as string }));
      } catch (e) {
        setGenFailed(prev => ({ ...prev, [s.key]: e instanceof Error ? e.message : "Failed" }));
      }
    }
    setGenP5(false); setGenIdx(-1);
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
        body: JSON.stringify({ orderId: order.id, sectionKey: key, quantData: quant, questionMap: questions }),
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
      a.download = `SeaGlassInsights-${order.business_name.replace(/[^a-zA-Z0-9]/g, "")}-VoiceOfCustomerReport.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e instanceof Error ? e.message : "Failed"); }
    finally { setDlDocx(false); }
  }

  // ── Renders an AI section (Phase 5) ────────────────────────────────────────
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
          <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full shrink-0">Section {sectionNum}</span>
          <h5 className="font-bold text-navy text-sm" style={{ fontFamily: "Georgia, serif" }}>{label}</h5>
          {m.locked && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">✓ Locked</span>}
        </div>
        <div className="flex items-center gap-2 mb-3 justify-end">
          {!m.locked && !isEditing && content && !isFailed && !isRetrying && (
            <button onClick={() => { setEditBuf(content); setEditingKey(key); }} className="text-xs text-seafoam hover:text-navy border border-seafoam/40 rounded-full px-3 py-1 transition-colors font-medium">Edit</button>
          )}
          {m.locked
            ? <button onClick={() => unlockSection(key)} className="text-xs text-gray-400 hover:text-orange-500 transition-colors">Unlock</button>
            : content && !isFailed && !isRetrying && (
                <button onClick={() => lockSection(key)} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-full px-3 py-1.5 transition-colors font-semibold">Lock Section</button>
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
            <button onClick={() => retrySection(key)} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 font-semibold px-4 py-2 rounded-full transition-colors">↺ Retry</button>
          </div>
        ) : isEditing ? (
          <div className="mb-3">
            <textarea rows={12} value={editBuf} onChange={e => setEditBuf(e.target.value)}
              className="w-full border border-seafoam rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-seafoam resize-y leading-relaxed" autoFocus />
            <div className="flex gap-2 mt-2">
              <button onClick={() => { const u = { ...draft, [key]: editBuf }; setDraft(u); setEditingKey(null); persist({ ai_draft: u }); }}
                className="text-xs bg-seafoam text-navy font-semibold px-4 py-1.5 rounded-full hover:opacity-90 transition-colors">Apply</button>
              <button onClick={() => setEditingKey(null)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">Cancel</button>
            </div>
          </div>
        ) : content ? (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-3">{content}</p>
        ) : (
          <p className="text-sm text-gray-300 italic mb-3">Generate analysis to populate this section.</p>
        )}

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
  const sentCount      = contacts.filter(c => c.sent_at).length;
  const completedCount = contacts.filter(c => c.completed_at).length;

  const phases: VocPhase[] = [1, 2, 3, 4, 5];

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

      {/* Phase indicator — 5 phases */}
      <div className="flex items-center mb-6 bg-white rounded-xl border border-gray-100 overflow-hidden">
        {phases.map((p, i) => (
          <div key={p} className={`flex-1 flex items-center gap-2 px-3 py-3.5 ${phase === p ? "bg-teal-50 border-b-2 border-teal-400" : "bg-white"} ${i > 0 ? "border-l border-gray-100" : ""}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${phase > p ? "bg-green-400 text-white" : phase === p ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
              {phase > p ? "✓" : p}
            </span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold leading-tight ${phase >= p ? "text-navy" : "text-gray-400"}`}>{PHASE_LABELS[p]}</p>
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

      {/* ── PHASE 1: Survey Design ───────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 ${phase === 1 ? "border-teal-200" : "border-gray-100"} ${phase > 1 ? "opacity-75" : ""}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase > 1 ? "bg-green-400 text-white" : "bg-teal-400 text-white"}`}>
              {phase > 1 ? "✓" : "1"}
            </span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 1 — Survey Design</h3>
          </div>
          {phase === 1 && (
            <div className="flex gap-2 flex-wrap">
              <button onClick={generateQuestions} disabled={genQs}
                className="bg-navy text-white font-semibold text-sm px-4 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50">
                {genQs ? "Drafting…" : questions.length ? "Re-draft Questions" : "AI Draft Questions"}
              </button>
              <button onClick={addQuestion}
                className="bg-seafoam text-navy font-semibold text-sm px-4 py-2 rounded-full hover:opacity-90 transition-colors">
                + Add Question
              </button>
            </div>
          )}
        </div>

        {phase === 1 && genQs && (
          <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
            <div className="w-4 h-4 border-2 border-seafoam border-t-transparent rounded-full animate-spin" />
            Analyzing intake and drafting survey questions…
          </div>
        )}
        {phase === 1 && genQsErr && <p className="text-red-500 text-sm mb-4">{genQsErr}</p>}

        {/* Syndicated vs business-specific indicator */}
        {questions.length > 0 && (
          <div className="mb-3 flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400 shrink-0" />
              First 3 = syndicated (standard across all VOC surveys)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
              Remaining = business-specific
            </span>
          </div>
        )}

        {questions.length > 0 ? (
          <div className="space-y-3">
            {questions.map((q, i) => (
              <QuestionCard
                key={q.id} q={q} idx={i} total={questions.length}
                isSyndicated={i < 3}
                onChange={nq => updateQuestion(i, nq)}
                onDelete={() => deleteQuestion(i)}
                onMoveUp={() => moveQuestion(i, -1)}
                onMoveDown={() => moveQuestion(i, 1)}
              />
            ))}
          </div>
        ) : !genQs && phase === 1 && (
          <p className="text-sm text-gray-400 italic py-4">
            Click "AI Draft Questions" to generate an initial set (3 syndicated + 2 business-specific), or add manually.
          </p>
        )}

        {phase === 1 && questions.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3 font-medium">
              Survey preview — {questions.length} question{questions.length !== 1 ? "s" : ""}
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
            <button onClick={() => advanceTo(2)}
              className="bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-teal-600 transition-colors">
              ✓ Finalize Questions — Upload Contacts →
            </button>
          </div>
        )}

        {phase > 1 && questions.length > 0 && (
          <p className="text-sm text-gray-400 mt-2">{questions.length} questions finalized.</p>
        )}
      </div>

      {/* ── PHASE 2: Contact List ────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 transition-opacity ${phase < 2 ? "border-gray-100 opacity-40 pointer-events-none" : phase === 2 ? "border-teal-200" : "border-gray-100 opacity-75"}`}>
        <div className="flex items-center gap-2 mb-5">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase > 2 ? "bg-green-400 text-white" : phase === 2 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
            {phase > 2 ? "✓" : "2"}
          </span>
          <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 2 — Contact List</h3>
        </div>

        {phase >= 2 && (
          <>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Upload a CSV of respondents (needs a column with "email" in the header; a "name" column is optional). Each contact will receive a unique survey link.
            </p>

            {/* Upload mode toggle */}
            <div className="inline-flex rounded-full border border-gray-200 p-0.5 mb-4 bg-gray-50">
              <button onClick={() => setCsvContactMode("upload")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${csvContactMode === "upload" ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                Upload CSV
              </button>
              <button onClick={() => setCsvContactMode("paste")}
                className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${csvContactMode === "paste" ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                Paste CSV
              </button>
            </div>

            {csvContactMode === "upload" ? (
              <div>
                <label className="inline-flex items-center gap-2 cursor-pointer bg-navy text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors">
                  <span>{uploadingCsv ? "Uploading…" : contacts.length ? "Re-upload CSV" : "Upload Contact CSV"}</span>
                  <input type="file" accept=".csv" className="hidden" disabled={uploadingCsv} onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) handleContactFileUpload(f);
                    e.target.value = "";
                  }} />
                </label>
              </div>
            ) : (
              <div>
                <textarea rows={5} value={csvContactText} onChange={e => setCsvContactText(e.target.value)}
                  placeholder={"name,email\nJane Smith,jane@example.com\nJohn Doe,john@example.com"}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-seafoam resize-y mb-3 placeholder-gray-300" />
                <button onClick={() => { handleContactCsvUpload(csvContactText); }} disabled={uploadingCsv || !csvContactText.trim()}
                  className="bg-navy text-white font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-40">
                  {uploadingCsv ? "Uploading…" : "Upload Contacts"}
                </button>
              </div>
            )}

            {uploadErr && <p className="text-red-500 text-sm mt-3">{uploadErr}</p>}

            {/* Contact list preview */}
            {contacts.length > 0 && (
              <div className="mt-5 border border-teal-200 rounded-xl overflow-hidden">
                <div className="bg-teal-50 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy">{contacts.length} contact{contacts.length !== 1 ? "s" : ""} ready</p>
                  <div className="flex gap-3 text-xs text-gray-500">
                    <span>{sentCount} sent</span>
                    <span>{completedCount} completed</span>
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Name</th>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Email</th>
                        <th className="text-left px-4 py-2 text-gray-400 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map(c => (
                        <tr key={c.id} className="border-t border-gray-100">
                          <td className="px-4 py-2 text-gray-600">{c.name ?? "—"}</td>
                          <td className="px-4 py-2 text-gray-600">{c.email}</td>
                          <td className="px-4 py-2">
                            {c.completed_at
                              ? <span className="text-green-600 font-semibold">Completed</span>
                              : c.sent_at
                                ? <span className="text-teal-600">Sent</span>
                                : <span className="text-gray-400">Pending</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {contacts.length > 0 && phase === 2 && (
              <div className="mt-4">
                <button onClick={sendSurveyEmails} disabled={sendingEmails}
                  className="bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50">
                  {sendingEmails ? "Sending emails…" : `Send Survey to ${contacts.filter(c => !c.sent_at).length} Contact${contacts.filter(c => !c.sent_at).length !== 1 ? "s" : ""} →`}
                </button>
                {sendErr && <p className="text-red-500 text-sm mt-2">{sendErr}</p>}
                {sendResult && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    ✓ Sent to {sendResult.sent} contact{sendResult.sent !== 1 ? "s" : ""}.
                    {sendResult.failed.length > 0 && ` ${sendResult.failed.length} failed: ${sendResult.failed.join(", ")}`}
                  </p>
                )}
              </div>
            )}

            {phase === 3 && contacts.length > 0 && (
              <p className="text-sm text-teal-700 font-medium mt-4">
                ✓ Survey sent. Responses are being collected automatically.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── PHASE 3: Collecting Responses ───────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 transition-opacity ${phase < 3 ? "border-gray-100 opacity-40 pointer-events-none" : phase === 3 ? "border-teal-200" : "border-gray-100 opacity-75"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase > 3 ? "bg-green-400 text-white" : phase === 3 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
              {phase > 3 ? "✓" : "3"}
            </span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 3 — Collecting Responses</h3>
          </div>
          {phase === 3 && (
            <button onClick={async () => { await loadContacts(); }}
              className="text-xs bg-teal-50 text-teal-700 border border-teal-200 font-semibold px-4 py-1.5 rounded-full hover:bg-teal-100 transition-colors">
              ↻ Refresh
            </button>
          )}
        </div>

        {phase >= 3 && (
          <>
            {/* Response counter */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-navy" style={{ fontFamily: "Georgia, serif" }}>{contacts.length}</p>
                <p className="text-xs text-gray-400 mt-1">Total Sent</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-teal-700" style={{ fontFamily: "Georgia, serif" }}>{completedCount}</p>
                <p className="text-xs text-gray-400 mt-1">Completed</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-gray-500" style={{ fontFamily: "Georgia, serif" }}>
                  {contacts.length > 0 ? Math.round((completedCount / contacts.length) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-400 mt-1">Response Rate</p>
              </div>
            </div>

            {completedCount > 0 && phase === 3 && (
              <button onClick={() => advanceTo(4)}
                className="bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-teal-600 transition-colors">
                Trigger Analysis with {completedCount} Response{completedCount !== 1 ? "s" : ""} →
              </button>
            )}
            {completedCount === 0 && (
              <p className="text-sm text-gray-400 italic">Waiting for respondents to complete the survey…</p>
            )}
          </>
        )}
      </div>

      {/* ── PHASE 4: Analysis / Load Data ───────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 transition-opacity ${phase < 4 ? "border-gray-100 opacity-40 pointer-events-none" : phase === 4 ? "border-teal-200" : "border-gray-100 opacity-75"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase > 4 ? "bg-green-400 text-white" : phase === 4 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>
              {phase > 4 ? "✓" : "4"}
            </span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>Phase 4 — Compute Statistics</h3>
          </div>
        </div>

        {phase >= 4 && (
          <>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed">
              Load the collected responses from the database and compute quantitative statistics. You can also import an external CSV if you collected responses elsewhere.
            </p>

            <div className="flex gap-3 flex-wrap mb-4">
              <button onClick={loadResponsesFromDB} disabled={loadingResponses}
                className="bg-teal-500 text-white font-semibold text-sm px-5 py-2 rounded-full hover:bg-teal-600 transition-colors disabled:opacity-50">
                {loadingResponses ? "Loading…" : `Load ${completedCount > 0 ? completedCount + " " : ""}Responses from Database`}
              </button>
            </div>

            {loadResErr && <p className="text-red-500 text-sm mb-3">{loadResErr}</p>}

            {/* CSV fallback */}
            <details className="mb-4">
              <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600 font-medium">Import external CSV instead</summary>
              <div className="mt-3 pl-4 border-l-2 border-gray-100">
                <div className="inline-flex rounded-full border border-gray-200 p-0.5 mb-3 bg-gray-50">
                  <button onClick={() => setUploadMode("upload")}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${uploadMode === "upload" ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    Upload CSV
                  </button>
                  <button onClick={() => setUploadMode("paste")}
                    className={`text-xs font-semibold px-4 py-1.5 rounded-full transition-colors ${uploadMode === "paste" ? "bg-white text-navy shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
                    Paste Responses
                  </button>
                </div>
                {uploadMode === "upload" ? (
                  <div>
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
                    <textarea rows={5} value={pasteText} onChange={e => setPasteText(e.target.value)}
                      placeholder={"Timestamp,How satisfied were you overall?,How likely are you to recommend us?\n5/1/2025 10:22:34,6,7"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-xs text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-seafoam resize-y placeholder-gray-300 mb-3" />
                    <button onClick={() => { processCSVText(pasteText); setPasteText(""); }}
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
              </div>
            </details>

            {statsReady && quant && <StatsSummary quant={quant} questions={questions} />}

            {statsReady && phase === 4 && (
              <button onClick={() => advanceTo(5)} className="mt-4 bg-teal-500 text-white font-semibold text-sm px-6 py-2.5 rounded-full hover:bg-teal-600 transition-colors">
                Generate Report Draft →
              </button>
            )}
          </>
        )}
      </div>

      {/* ── PHASE 5: Draft Report ────────────────────────────────────────── */}
      <div className={`bg-white rounded-xl border mb-6 p-6 transition-opacity ${phase < 5 ? "border-gray-100 opacity-40 pointer-events-none" : "border-teal-200"}`}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${phase === 5 ? "bg-teal-400 text-white" : "bg-gray-200 text-gray-400"}`}>5</span>
            <h3 className="text-navy font-semibold" style={{ fontFamily: "Georgia, serif" }}>
              Phase 5 — Report Draft{phase < 5 ? " (Locked)" : ""}
            </h3>
          </div>
          {phase === 5 && (
            <button onClick={generatePhase5} disabled={genPhase5 || !statsReady}
              className="bg-seafoam text-navy font-semibold text-sm px-5 py-2 rounded-full hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!statsReady ? "Load response data first" : ""}>
              {genPhase5 ? "Generating…" : "Generate All Sections"}
            </button>
          )}
        </div>

        {phase === 5 && (
          <>
            {/* Generation progress */}
            {genPhase5 && (
              <div className="py-3 space-y-1.5 mb-4 bg-gray-50 rounded-xl px-4">
                {AI_SECTIONS.map((s, i) => {
                  const isDone   = !!draft[s.key] && i < genIdx;
                  const isActive = genIdx === i;
                  const isPend   = !isDone && !isActive;
                  return (
                    <div key={s.key} className="flex items-center gap-2.5">
                      {isDone   && <span className="text-green-500 text-xs shrink-0">✓</span>}
                      {isActive && <div className="w-3 h-3 border-2 border-seafoam border-t-transparent rounded-full animate-spin shrink-0" />}
                      {isPend   && <span className="text-gray-200 text-xs shrink-0">○</span>}
                      <span className={`text-sm ${isDone ? "text-gray-400" : isActive ? "text-navy font-medium" : "text-gray-300"}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Sections */}
            {AI_SECTIONS.map((s, i) => renderAISection(s.key, s.label, i + 1))}

            {/* Analyst Note */}
            <div className="border-t-2 border-dashed border-teal-200 pt-5 mt-4">
              <label className="block text-xs font-semibold text-navy uppercase tracking-wide mb-1">
                Analyst Note
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
                {dlDocx ? "Building…" : "⬇ Download PDF Report"}
              </button>
              {!allLocked && hasDraft && (
                <p className="text-xs text-amber-600 font-medium">
                  Lock all {AI_SECTIONS.length} sections to enable download ({lockedCount}/{AI_SECTIONS.length} locked)
                </p>
              )}
              {saveMsg && <span className="text-green-600 text-sm font-medium">{saveMsg}</span>}
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
