"use client";
/**
 * Structured form input widgets shared across all service intake forms
 * and the dashboard manual order form.
 *
 * Design contract
 * ───────────────
 * • Each component owns its own internal state.
 * • It serialises that state to a human-readable string and calls
 *   onChange(string) whenever anything changes.
 * • The parent stores the serialised string in its q1/q2/… field, which
 *   is then saved to Supabase as-is and displayed verbatim in the
 *   dashboard "Intake Answers" panel.
 * • None of the components parse their value prop on mount — they always
 *   start blank. This is intentional: all service forms are fill-once flows.
 */

import { useState } from "react";

// ── Styling helpers ────────────────────────────────────────────────────────────

const inp  = "w-full rounded-lg border px-4 py-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-seafoam transition";
const inpOk  = "border-gray-300 bg-white";
const inpErr = "border-red-400 bg-red-50";
const lbl  = "block text-sm text-gray-700 mb-1 font-semibold";
const hint = "text-xs text-gray-400 mt-0.5 mb-2 leading-relaxed";
const errTxt = "text-red-500 text-xs mt-1";

function Err({ msg }: { msg?: string }) {
  return msg ? <p className={errTxt}>{msg}</p> : null;
}

// ── Shared option sets ─────────────────────────────────────────────────────────

export const BUSINESS_TYPES = [
  "Retail", "Restaurant / Food & Beverage", "Service Business",
  "Health / Wellness", "Professional Services", "Hospitality", "Other",
];

export const DURATION_OPTIONS = [
  "Less than 1 year", "1–2 years", "3–5 years", "6–10 years", "10+ years",
];

export const AGE_RANGES = ["Under 25", "25–34", "35–44", "45–54", "55–64", "65–74", "75+"];
export const INCOME_RANGES = ["Under $25k", "$25k–$50k", "$50k–$75k", "$75k–$100k", "$100k–$150k", "$150k–$250k", "$250k+"];

export const MARKETING_CHANNELS = [
  "Social Media", "Google / SEO", "Word of Mouth", "Email Marketing",
  "Print / Flyers", "Events", "Paid Ads", "None", "Other",
];

export const DECISION_TYPES = [
  "Expansion / new location", "New product or service", "Pricing strategy",
  "Entering a new market", "Competing against a new competitor",
  "General strategic planning", "Other",
];

export const SMA_PLATFORMS = [
  "Facebook", "Instagram", "TikTok", "YouTube", "LinkedIn", "Pinterest", "Other",
];

export const SMA_CHALLENGES = [
  "Growing followers", "Posting consistently", "Creating content",
  "Driving engagement", "Maintaining brand voice",
  "Converting followers to customers", "Other",
];

export const SS_INTERACTION_TYPES = [
  "Retail purchase", "Service appointment", "Food / beverage order",
  "Inquiry / consultation", "Other",
];

export const SS_SCORECARD_DIMS = [
  "First Impression", "Physical Environment", "Staff Engagement",
  "Core Experience", "Purchase Process", "Digital Touchpoints", "Lasting Impression",
];

export const VOC_COLLECTION_METHODS = [
  "Past purchases", "Email signups", "Loyalty program",
  "In-store list", "Events", "Other",
];

export const AI_TOOLS = [
  "ChatGPT", "Claude", "Gemini", "Copilot", "Perplexity", "Not sure yet", "Other",
];

export const AI_TASKS = [
  "Writing social media posts", "Responding to reviews", "Drafting emails",
  "Creating promotions", "Writing product descriptions",
  "Customer service responses", "Blog or website content", "Other",
];

export const AI_TONES = [
  "Friendly and casual", "Professional and formal", "Local and personal",
  "Fun and playful", "Other",
];

// ── SelectWithOther ────────────────────────────────────────────────────────────
// A <select> where choosing "Other" reveals a text field.

interface SelectWithOtherProps {
  label: string;
  hint?: string;
  options: string[];
  placeholder?: string;
  value?: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}

export function SelectWithOther({
  label, hint: hintText, options, placeholder = "Select one…",
  onChange, error, required,
}: SelectWithOtherProps) {
  const [selected, setSelected] = useState("");
  const [specify,  setSpecify]  = useState("");

  function update(sel: string, spec: string) {
    setSelected(sel); setSpecify(spec);
    if (!sel) { onChange(""); return; }
    if (sel === "Other") {
      onChange(spec.trim() ? `Other: ${spec.trim()}` : "");
    } else {
      onChange(sel);
    }
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <select
        value={selected}
        onChange={e => update(e.target.value, specify)}
        className={`${inp} ${error ? inpErr : inpOk} bg-white`}
        style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      {selected === "Other" && (
        <input
          type="text"
          value={specify}
          onChange={e => update("Other", e.target.value)}
          placeholder="Please specify…"
          className={`${inp} ${inpOk} mt-2`}
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        />
      )}
      <Err msg={error} />
    </div>
  );
}

// ── CheckboxGroupWithOther ─────────────────────────────────────────────────────
// Select-all-that-apply checkboxes where "Other" reveals a specify field.

interface CheckboxGroupProps {
  label: string;
  hint?: string;
  options: string[];
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  otherPlaceholder?: string;
}

export function CheckboxGroupWithOther({
  label, hint: hintText, options, onChange, error, required,
  otherPlaceholder = "Please specify…",
}: CheckboxGroupProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [specify, setSpecify] = useState("");

  function serialize(c: Set<string>, spec: string): string {
    const parts = [...c].filter(x => x !== "Other");
    const otherPart = c.has("Other") && spec.trim() ? `Other: ${spec.trim()}` : null;
    if (otherPart) parts.push(otherPart);
    return parts.join(", ");
  }

  function toggle(opt: string) {
    const next = new Set(checked);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    setChecked(next);
    onChange(serialize(next, specify));
  }

  function updateSpecify(val: string) {
    setSpecify(val);
    onChange(serialize(checked, val));
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="grid grid-cols-2 gap-2">
        {options.map(opt => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={checked.has(opt)}
              onChange={() => toggle(opt)}
              className="w-4 h-4 rounded accent-seafoam cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-navy transition-colors">{opt}</span>
          </label>
        ))}
      </div>
      {checked.has("Other") && (
        <input
          type="text"
          value={specify}
          onChange={e => updateSpecify(e.target.value)}
          placeholder={otherPlaceholder}
          className={`${inp} ${inpOk} mt-2`}
          style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
        />
      )}
      <Err msg={error} />
    </div>
  );
}

// ── AgeIncomeCheckboxes ────────────────────────────────────────────────────────
// Age-range + income-range checkboxes + open lifestyle/problem textarea.

interface AgeIncomeProps {
  label: string;
  hint?: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}

export function AgeIncomeCheckboxes({ label, hint: hintText, onChange, error, required }: AgeIncomeProps) {
  const [ages,    setAges]    = useState<Set<string>>(new Set());
  const [incomes, setIncomes] = useState<Set<string>>(new Set());
  const [text,    setText]    = useState("");

  function serialize(a: Set<string>, i: Set<string>, t: string): string {
    const parts: string[] = [];
    if (a.size) parts.push(`Age range: ${[...a].join(", ")}`);
    if (i.size) parts.push(`Income: ${[...i].join(", ")}`);
    if (t.trim()) parts.push(t.trim());
    return parts.join(". ");
  }

  function toggleAge(opt: string) {
    const next = new Set(ages);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    setAges(next);
    onChange(serialize(next, incomes, text));
  }

  function toggleIncome(opt: string) {
    const next = new Set(incomes);
    next.has(opt) ? next.delete(opt) : next.add(opt);
    setIncomes(next);
    onChange(serialize(ages, next, text));
  }

  function updateText(val: string) {
    setText(val);
    onChange(serialize(ages, incomes, val));
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="space-y-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Age range (select all that apply)</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {AGE_RANGES.map(a => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={ages.has(a)} onChange={() => toggleAge(a)} className="w-4 h-4 rounded accent-seafoam cursor-pointer" />
                <span className="text-sm text-gray-700">{a}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Income range (select all that apply)</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1.5">
            {INCOME_RANGES.map(i => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={incomes.has(i)} onChange={() => toggleIncome(i)} className="w-4 h-4 rounded accent-seafoam cursor-pointer" />
                <span className="text-sm text-gray-700">{i}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Lifestyle, habits, and problem they have</p>
          <textarea
            rows={3}
            value={text}
            onChange={e => updateText(e.target.value)}
            placeholder="e.g. Values quality over price, wants a community feel, struggling to find consistent local businesses they can trust…"
            className={`${inp} ${inpOk} resize-y`}
            style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
          />
        </div>
      </div>
      <Err msg={error} />
    </div>
  );
}

// ── CompetitorFields ───────────────────────────────────────────────────────────
// 1–3 competitor inputs. Competitor 1 is required; 2 and 3 are optional.
// withDescription adds a one-line description field per competitor (Deep Dive).
// withLocation adds a location field per competitor (Deep Dive).

interface CompetitorFieldsProps {
  label: string;
  hint?: string;
  onChange: (v: string) => void;
  error?: string;
  withDescription?: boolean;
  withLocation?: boolean;
}

interface CompetitorEntry { name: string; location: string; desc: string; }
const EMPTY_COMP: CompetitorEntry = { name: "", location: "", desc: "" };

export function CompetitorFields({
  label, hint: hintText, onChange, error, withDescription, withLocation,
}: CompetitorFieldsProps) {
  const [comps, setComps] = useState<[CompetitorEntry, CompetitorEntry, CompetitorEntry]>([
    { ...EMPTY_COMP }, { ...EMPTY_COMP }, { ...EMPTY_COMP },
  ]);

  function serialize(cs: CompetitorEntry[]): string {
    const parts = cs
      .map((c, i) => {
        if (!c.name.trim()) return null;
        let line = `${i + 1}. ${c.name.trim()}`;
        if (withLocation && c.location.trim()) line += ` (${c.location.trim()})`;
        if (withDescription && c.desc.trim()) line += ` — ${c.desc.trim()}`;
        return line;
      })
      .filter(Boolean);
    return parts.join("\n");
  }

  function update(i: number, field: keyof CompetitorEntry, val: string) {
    const next = comps.map((c, idx) => idx === i ? { ...c, [field]: val } : c) as typeof comps;
    setComps(next);
    onChange(serialize(next));
  }

  const configs = [
    { required: true,  requiredLabel: "required" },
    { required: false, requiredLabel: "optional — recommended" },
    { required: false, requiredLabel: "optional" },
  ];

  return (
    <div>
      <label className={lbl}>{label} <span className="text-red-500">*</span></label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="space-y-4">
        {configs.map(({ required: req, requiredLabel }, i) => (
          <div key={i} className={`border rounded-lg p-4 ${req ? "border-gray-300" : "border-gray-200 bg-gray-50/40"}`}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Competitor {i + 1}
              {!req && <span className="ml-2 text-gray-400 normal-case font-normal tracking-normal">({requiredLabel})</span>}
              {req && <span className="text-red-500 ml-1">*</span>}
            </p>
            <div className="space-y-2">
              <input
                type="text"
                value={comps[i].name}
                onChange={e => update(i, "name", e.target.value)}
                placeholder={`e.g. ${i === 0 ? "Starbucks on Main St" : i === 1 ? "The Grind (new indie shop)" : "Bagel shop with coffee counter"}`}
                className={`${inp} ${inpOk}`}
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              />
              {withLocation && (
                <input
                  type="text"
                  value={comps[i].location}
                  onChange={e => update(i, "location", e.target.value)}
                  placeholder="City or address (optional)"
                  className={`${inp} ${inpOk}`}
                  style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
                />
              )}
              {withDescription && (
                <input
                  type="text"
                  value={comps[i].desc}
                  onChange={e => update(i, "desc", e.target.value)}
                  placeholder="One-line description of what makes them a competitor (optional)"
                  className={`${inp} ${inpOk}`}
                  style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
                />
              )}
            </div>
          </div>
        ))}
      </div>
      <Err msg={error} />
    </div>
  );
}

// ── PlatformCheckboxesWithHandles ─────────────────────────────────────────────
// SMA: each checked platform reveals a handle/URL input.

interface PlatformCheckboxesProps {
  label: string;
  hint?: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}

export function PlatformCheckboxesWithHandles({ label, hint: hintText, onChange, error, required }: PlatformCheckboxesProps) {
  const [checked,  setChecked]  = useState<Set<string>>(new Set());
  const [handles,  setHandles]  = useState<Record<string, string>>({});
  const [otherPlat, setOtherPlat] = useState("");

  function serialize(c: Set<string>, h: Record<string, string>, other: string): string {
    const parts: string[] = [];
    for (const plat of SMA_PLATFORMS) {
      if (!c.has(plat)) continue;
      if (plat === "Other") {
        const val = other.trim();
        if (val) parts.push(`Other: ${val}`);
      } else {
        const handle = (h[plat] ?? "").trim();
        parts.push(handle ? `${plat}: ${handle}` : plat);
      }
    }
    return parts.join(", ");
  }

  function togglePlatform(plat: string) {
    const next = new Set(checked);
    next.has(plat) ? next.delete(plat) : next.add(plat);
    setChecked(next);
    onChange(serialize(next, handles, otherPlat));
  }

  function updateHandle(plat: string, val: string) {
    const next = { ...handles, [plat]: val };
    setHandles(next);
    onChange(serialize(checked, next, otherPlat));
  }

  function updateOther(val: string) {
    setOtherPlat(val);
    onChange(serialize(checked, handles, val));
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="space-y-3">
        {SMA_PLATFORMS.map(plat => (
          <div key={plat}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={checked.has(plat)} onChange={() => togglePlatform(plat)} className="w-4 h-4 rounded accent-seafoam cursor-pointer" />
              <span className="text-sm text-gray-700 font-medium">{plat}</span>
            </label>
            {checked.has(plat) && plat !== "Other" && (
              <input
                type="text"
                value={handles[plat] ?? ""}
                onChange={e => updateHandle(plat, e.target.value)}
                placeholder={`@handle or URL for ${plat} (optional)`}
                className={`${inp} ${inpOk} mt-1.5 ml-6`}
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              />
            )}
            {checked.has(plat) && plat === "Other" && (
              <input
                type="text"
                value={otherPlat}
                onChange={e => updateOther(e.target.value)}
                placeholder="Platform name and handle or URL"
                className={`${inp} ${inpOk} mt-1.5 ml-6`}
                style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
              />
            )}
          </div>
        ))}
      </div>
      <Err msg={error} />
    </div>
  );
}

// ── SMACompetitorFields ────────────────────────────────────────────────────────
// Two competitor sets, each with name + optional social handle.

interface SMACompetitorFieldsProps {
  label: string;
  hint?: string;
  onChange: (v: string) => void;
  error?: string;
}

export function SMACompetitorFields({ label, hint: hintText, onChange, error }: SMACompetitorFieldsProps) {
  const [c1name, setC1Name] = useState(""); const [c1handle, setC1Handle] = useState("");
  const [c2name, setC2Name] = useState(""); const [c2handle, setC2Handle] = useState("");

  function serialize(n1: string, h1: string, n2: string, h2: string): string {
    const parts: string[] = [];
    if (n1.trim()) parts.push(`1. ${n1.trim()}${h1.trim() ? ` (${h1.trim()})` : ""}`);
    if (n2.trim()) parts.push(`2. ${n2.trim()}${h2.trim() ? ` (${h2.trim()})` : ""}`);
    return parts.join("\n");
  }

  function upd(fn: (v: string) => void, val: string, others: [string, string, string, string]) {
    fn(val); onChange(serialize(...others));
  }

  return (
    <div>
      <label className={lbl}>{label}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="space-y-4">
        {[
          { n: c1name, setN: setC1Name, h: c1handle, setH: setC1Handle, idx: 1 },
          { n: c2name, setN: setC2Name, h: c2handle, setH: setC2Handle, idx: 2 },
        ].map(({ n, setN, h, setH, idx }) => (
          <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50/40">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Competitor {idx} <span className="text-gray-400 normal-case font-normal tracking-normal">(optional)</span>
            </p>
            <div className="space-y-2">
              <input type="text" value={n}
                onChange={e => { setN(e.target.value); onChange(serialize(idx === 1 ? e.target.value : c1name, idx === 1 ? h : c1handle, idx === 2 ? e.target.value : c2name, idx === 2 ? h : c2handle)); }}
                placeholder="Business name" className={`${inp} ${inpOk}`} style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }} />
              <input type="text" value={h}
                onChange={e => { setH(e.target.value); onChange(serialize(idx === 1 ? n : c1name, idx === 1 ? e.target.value : c1handle, idx === 2 ? n : c2name, idx === 2 ? e.target.value : c2handle)); }}
                placeholder="Social handle or page URL (optional)" className={`${inp} ${inpOk}`} style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }} />
            </div>
          </div>
        ))}
      </div>
      <Err msg={error} />
    </div>
  );
}

// ── AddressFields ──────────────────────────────────────────────────────────────
// Street / City / State / Zip grouped fields.

interface AddressFieldsProps {
  label: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
}

export function AddressFields({ label, onChange, error, required }: AddressFieldsProps) {
  const [street, setStreet] = useState("");
  const [city,   setCity]   = useState("");
  const [state,  setState]  = useState("");
  const [zip,    setZip]    = useState("");

  function serialize(s: string, c: string, st: string, z: string): string {
    const parts = [s.trim(), c.trim(), st.trim(), z.trim()].filter(Boolean);
    return parts.join(", ");
  }

  function up(setter: (v: string) => void, val: string, street_: string, city_: string, state_: string, zip_: string) {
    setter(val);
    onChange(serialize(street_, city_, state_, zip_));
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      <div className="space-y-2">
        <input type="text" value={street} onChange={e => up(setStreet, e.target.value, e.target.value, city, state, zip)}
          placeholder="Street address" className={`${inp} ${error ? inpErr : inpOk}`} style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }} />
        <div className="grid grid-cols-3 gap-2">
          <input type="text" value={city} onChange={e => up(setCity, e.target.value, street, e.target.value, state, zip)}
            placeholder="City" className={`${inp} ${error ? inpErr : inpOk}`} style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }} />
          <input type="text" value={state} onChange={e => up(setState, e.target.value, street, city, e.target.value, zip)}
            placeholder="State" className={`${inp} ${error ? inpErr : inpOk}`} style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }} />
          <input type="text" value={zip} onChange={e => up(setZip, e.target.value, street, city, state, e.target.value)}
            placeholder="ZIP" className={`${inp} ${error ? inpErr : inpOk}`} style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }} />
        </div>
      </div>
      <Err msg={error} />
    </div>
  );
}

// ── YesNoReveal ────────────────────────────────────────────────────────────────
// Yes/No toggle. "Yes" reveals children (passed as JSX).

interface YesNoRevealProps {
  label: string;
  hint?: string;
  onToggle: (yes: boolean) => void;
  children?: React.ReactNode;
  error?: string;
  required?: boolean;
}

export function YesNoReveal({ label, hint: hintText, onToggle, children, error, required }: YesNoRevealProps) {
  const [choice, setChoice] = useState<boolean | null>(null);

  function pick(yes: boolean) {
    setChoice(yes);
    onToggle(yes);
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="flex gap-3 mb-3">
        {[true, false].map(yes => (
          <button
            key={String(yes)}
            type="button"
            onClick={() => pick(yes)}
            className={`px-6 py-2.5 rounded-full text-sm font-semibold border transition-colors ${
              choice === yes
                ? yes ? "bg-green-500 text-white border-green-500" : "bg-gray-200 text-gray-700 border-gray-200"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {yes ? "Yes" : "No"}
          </button>
        ))}
      </div>
      {choice === true && children && (
        <div className="ml-4 border-l-2 border-green-200 pl-4 space-y-3">
          {children}
        </div>
      )}
      <Err msg={error} />
    </div>
  );
}

// ── NumberedTextFields ─────────────────────────────────────────────────────────
// N separate text fields that serialize to "1. ...\n2. ...\n..."

interface NumberedTextFieldsProps {
  label: string;
  hint?: string;
  count: number;
  placeholders?: string[];
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  rows?: number;
}

export function NumberedTextFields({
  label, hint: hintText, count, placeholders, onChange, error, required, rows = 2,
}: NumberedTextFieldsProps) {
  const [fields, setFields] = useState<string[]>(Array(count).fill(""));

  function serialize(fs: string[]): string {
    return fs
      .map((f, i) => ({ n: i + 1, v: f.trim() }))
      .filter(({ v }) => v)
      .map(({ n, v }) => `${n}. ${v}`)
      .join("\n");
  }

  function update(i: number, val: string) {
    const next = fields.map((f, idx) => idx === i ? val : f);
    setFields(next);
    onChange(serialize(next));
  }

  return (
    <div>
      <label className={lbl}>{label}{required && <span className="text-red-500 ml-1">*</span>}</label>
      {hintText && <p className={hint}>{hintText}</p>}
      <div className="space-y-2">
        {fields.map((f, i) => (
          <div key={i} className="flex gap-2 items-start">
            <span className="text-sm font-bold text-seafoam mt-3 w-5 shrink-0">{i + 1}.</span>
            <textarea
              rows={rows}
              value={f}
              onChange={e => update(i, e.target.value)}
              placeholder={placeholders?.[i] ?? `Question ${i + 1}…`}
              className={`${inp} ${error && i === 0 ? inpErr : inpOk} resize-y flex-1`}
              style={{ fontFamily: "'Montserrat', system-ui, sans-serif" }}
            />
          </div>
        ))}
      </div>
      <Err msg={error} />
    </div>
  );
}
