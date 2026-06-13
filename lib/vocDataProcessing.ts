// ── Voice of Customer — CSV parsing and statistics ───────────────────────────

import type {
  VocQuestion, VocQuantData, VocQuestionStat,
  BannerCuts, BannerCutCell, ParsedCSV, ColumnMapping,
} from "./vocTypes";

// ── CSV parser ────────────────────────────────────────────────────────────────

export function parseCSV(text: string): ParsedCSV {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const allLines   = normalized.split("\n");
  const lines      = allLines.filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  function parseLine(line: string): string[] {
    const result: string[] = [];
    let current  = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim()); current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = parseLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
    return row;
  }).filter(r => Object.values(r).some(v => v.length > 0));

  return { headers, rows };
}

// ── Narrative response parser ─────────────────────────────────────────────────
// Handles pasted unstructured text in "Label: value" format, where responses
// are separated by blank lines, ---, or === delimiters.
// "Overall satisfaction: 6/7" → column "Overall satisfaction", value "6"
// "Customer type: Regular local member" → column "Customer type", value "Regular local member"

export function parseNarrativeResponses(text: string): ParsedCSV {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Split into per-respondent blocks
  const blocks = normalized
    .split(/\n{2,}|(?:^|\n)[-=]{3,}(?:\n|$)/)
    .map(b => b.trim())
    .filter(b => b.includes(":"));

  const keyOrder: string[] = [];
  const keySet   = new Set<string>();
  const rows: Record<string, string>[] = [];

  for (const block of blocks) {
    const row: Record<string, string> = {};
    for (const rawLine of block.split("\n")) {
      const line  = rawLine.trim();
      const colon = line.indexOf(":");
      if (colon < 1) continue;
      const label    = line.slice(0, colon).trim();
      const rawValue = line.slice(colon + 1).trim();
      if (!label || !rawValue) continue;

      // Strip "X/N" or "X out of N" → keep just the leading integer
      const scoreMatch = /^(\d+)\s*\/\s*\d+/.exec(rawValue)
                      ?? /^(\d+)\s+out\s+of\s+\d+/i.exec(rawValue);
      const value = scoreMatch ? scoreMatch[1] : rawValue;

      row[label] = value;
      if (!keySet.has(label)) { keySet.add(label); keyOrder.push(label); }
    }
    if (Object.keys(row).length > 0) rows.push(row);
  }

  return { headers: keyOrder, rows };
}

// ── Column auto-mapping ───────────────────────────────────────────────────────

export function autoMapColumns(questions: VocQuestion[], csvHeaders: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();

  function norm(s: string): string {
    return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  }

  function score(qText: string, header: string): number {
    const nq = norm(qText);
    const nh = norm(header);
    if (nq === nh) return 100;
    if (nh.includes(nq.slice(0, 30)) || nq.includes(nh.slice(0, 30))) return 80;
    const qWords = nq.split(" ").filter(w => w.length > 3);
    const hSet   = new Set(nh.split(" "));
    const hits   = qWords.filter(w => hSet.has(w)).length;
    return qWords.length > 0 ? (hits / qWords.length) * 60 : 0;
  }

  for (const q of questions) {
    let best = 15; // threshold
    let bestH: string | null = null;
    for (const h of csvHeaders) {
      if (used.has(h)) continue;
      const s = score(q.text, h);
      if (s > best) { best = s; bestH = h; }
    }
    mapping[q.id] = bestH;
    if (bestH) used.add(bestH);
  }
  return mapping;
}

// ── Statistics calculation ────────────────────────────────────────────────────

export function calculateStats(
  parsed:    ParsedCSV,
  questions: VocQuestion[],
  mapping:   ColumnMapping,
): VocQuantData {
  const questionStats:      Record<string, VocQuestionStat> = {};
  const openEndedResponses: Record<string, string[]>        = {};
  const segVarNames:        Record<string, string>          = {};

  for (const q of questions) {
    const col = mapping[q.id];
    if (!col) continue;
    const raw = parsed.rows.map(r => (r[col] ?? "").trim());

    if (q.type === "scale_1_7") {
      const nums = raw.map(v => parseInt(v)).filter(n => !isNaN(n) && n >= 1 && n <= 7);
      const dist: Record<string, number> = {};
      for (let i = 1; i <= 7; i++) dist[String(i)] = 0;
      nums.forEach(n => { dist[String(n)]++; });
      const sum = nums.reduce((a, b) => a + b, 0);
      const t2b = nums.filter(n => n >= 6).length;
      const b2b = nums.filter(n => n <= 2).length;
      questionStats[q.id] = {
        questionId: q.id, questionText: q.text, type: q.type,
        totalResponded: nums.length,
        mean: nums.length > 0 ? Math.round((sum / nums.length) * 10) / 10 : 0,
        t2b:  nums.length > 0 ? Math.round((t2b / nums.length) * 100) : 0,
        b2b:  nums.length > 0 ? Math.round((b2b / nums.length) * 100) : 0,
        distribution: dist,
      };

    } else if (q.type === "multiple_choice" || q.type === "select_all") {
      const freq: Record<string, number> = {};
      const valid = raw.filter(v => v.length > 0);
      for (const v of valid) {
        const choices = q.type === "select_all"
          ? v.split(/[;,]/).map(s => s.trim()).filter(Boolean)
          : [v];
        for (const c of choices) freq[c] = (freq[c] || 0) + 1;
      }
      const total = valid.length;
      const pcts: Record<string, number> = {};
      for (const [k, cnt] of Object.entries(freq))
        pcts[k] = total > 0 ? Math.round((cnt / total) * 100) : 0;
      questionStats[q.id] = {
        questionId: q.id, questionText: q.text, type: q.type,
        totalResponded: total, frequencies: freq, percentages: pcts,
      };
      if (q.segmentationVar) segVarNames[q.id] = q.text;

    } else if (q.type === "open_ended") {
      const responses = raw.filter(v => v.length > 3);
      openEndedResponses[q.id] = responses;
      questionStats[q.id] = {
        questionId: q.id, questionText: q.text, type: q.type,
        totalResponded: responses.length,
      };
    }
  }

  // Banner cuts: for each segmentation variable, cross-tab against scale questions
  const bannerCuts: BannerCuts = {};
  const segVars = questions.filter(q => q.segmentationVar && mapping[q.id]);
  const scaleQs = questions.filter(q => q.type === "scale_1_7" && mapping[q.id]);

  for (const sv of segVars) {
    const svCol = mapping[sv.id]!;
    bannerCuts[sv.id] = {};
    const segVals = [...new Set(parsed.rows.map(r => (r[svCol] ?? "").trim()).filter(Boolean))];

    for (const segVal of segVals) {
      const filtered = parsed.rows.filter(r => (r[svCol] ?? "").trim() === segVal);
      bannerCuts[sv.id][segVal] = {};

      for (const tq of scaleQs) {
        if (tq.id === sv.id) continue;
        const tCol = mapping[tq.id];
        if (!tCol) continue;
        const nums = filtered.map(r => parseInt(r[tCol] ?? "")).filter(n => !isNaN(n) && n >= 1 && n <= 7);
        if (nums.length === 0) continue;
        const sum = nums.reduce((a, b) => a + b, 0);
        const t2b = nums.filter(n => n >= 6).length;
        const b2b = nums.filter(n => n <= 2).length;
        bannerCuts[sv.id][segVal][tq.id] = {
          count: filtered.length,
          mean:  Math.round((sum / nums.length) * 10) / 10,
          t2b:   Math.round((t2b / nums.length) * 100),
          b2b:   Math.round((b2b / nums.length) * 100),
        };
      }
    }
  }

  return { totalResponses: parsed.rows.length, questionStats, bannerCuts, openEndedResponses, segVarNames };
}

// ── AI-prompt formatters ──────────────────────────────────────────────────────

export function formatQuantDataForAI(quant: VocQuantData, questions: VocQuestion[]): string {
  const lines: string[] = [`TOTAL RESPONSES: ${quant.totalResponses}`, ""];

  const scaleQs = questions.filter(q => q.type === "scale_1_7" && quant.questionStats[q.id]);
  const mcQs    = questions.filter(q => (q.type === "multiple_choice" || q.type === "select_all") && quant.questionStats[q.id]);

  if (scaleQs.length > 0) {
    lines.push("RATING QUESTIONS (1-7 Scale — higher is better):");
    for (const q of scaleQs) {
      const s = quant.questionStats[q.id];
      if (!s) continue;
      lines.push(`\n"${q.text}" (n=${s.totalResponded})`);
      lines.push(`  T2B (6+7): ${s.t2b}%  |  Mean: ${s.mean}  |  B2B (1+2): ${s.b2b}%`);
      if (s.distribution) {
        const d = Object.entries(s.distribution).map(([k, v]) => `${k}:${v}`).join(" | ");
        lines.push(`  Distribution: ${d}`);
      }
    }
    lines.push("");
  }

  if (mcQs.length > 0) {
    lines.push("MULTIPLE CHOICE / SELECT ALL QUESTIONS:");
    for (const q of mcQs) {
      const s = quant.questionStats[q.id];
      if (!s?.frequencies) continue;
      lines.push(`\n"${q.text}" (n=${s.totalResponded})`);
      const sorted = Object.entries(s.frequencies).sort(([, a], [, b]) => b - a);
      for (const [opt, cnt] of sorted)
        lines.push(`  ${opt}: ${cnt} (${s.percentages?.[opt] ?? 0}%)`);
    }
    lines.push("");
  }

  const segVarIds = Object.keys(quant.bannerCuts);
  if (segVarIds.length > 0 && scaleQs.length > 0) {
    lines.push("BANNER CUT TABLES (T2B% by segment):");
    for (const svId of segVarIds) {
      const sv = questions.find(q => q.id === svId);
      if (!sv) continue;
      const cuts    = quant.bannerCuts[svId];
      const tgtQs   = scaleQs.filter(q => q.id !== svId);
      lines.push(`\nSegmented by: "${sv.text}"`);
      lines.push(["Segment", ...tgtQs.map(q => q.text.slice(0, 22))].join(" | "));
      for (const [segVal, segData] of Object.entries(cuts)) {
        const row = [segVal.slice(0, 22)];
        for (const tq of tgtQs) {
          const cell = segData[tq.id];
          row.push(cell ? `T2B:${cell.t2b}% (n=${cell.count})` : "—");
        }
        lines.push(row.join(" | "));
      }
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function formatOpenEndedForAI(quant: VocQuantData, questions: VocQuestion[]): string {
  const lines: string[] = [];
  const oeQs = questions.filter(q => q.type === "open_ended");
  for (const q of oeQs) {
    const responses = quant.openEndedResponses[q.id] ?? [];
    if (responses.length === 0) continue;
    lines.push(`QUESTION: "${q.text}" (${responses.length} responses)`);
    responses.forEach((r, i) => lines.push(`[${i + 1}] ${r}`));
    lines.push("");
  }
  return lines.join("\n") || "(No open-ended responses available)";
}

export function formatQuestionMapForForms(questions: VocQuestion[]): string {
  const typeLabels: Record<string, string> = {
    scale_1_7:       "Linear Scale 1–7",
    multiple_choice: "Multiple Choice",
    select_all:      "Checkboxes (Select All That Apply)",
    open_ended:      "Paragraph",
  };
  return questions.map((q, i) => {
    let out = `${i + 1}. ${q.text}\n   [${typeLabels[q.type] ?? q.type}]`;
    if ((q.type === "multiple_choice" || q.type === "select_all") && q.options.length > 0)
      out += "\n" + q.options.map(o => `   • ${o}`).join("\n");
    return out;
  }).join("\n\n");
}
