// ── Voice of Customer Survey — shared type definitions ───────────────────────

export type VocQuestionType = "scale_1_7" | "multiple_choice" | "select_all" | "open_ended";

export const VOC_QUESTION_TYPE_LABELS: Record<VocQuestionType, string> = {
  scale_1_7:       "1-7 Scale",
  multiple_choice: "Multiple Choice",
  select_all:      "Select All That Apply",
  open_ended:      "Open-Ended",
};

export const VOC_GOOGLE_FORM_TYPE_LABELS: Record<VocQuestionType, string> = {
  scale_1_7:       "Linear Scale 1–7",
  multiple_choice: "Multiple Choice",
  select_all:      "Checkboxes (Select All That Apply)",
  open_ended:      "Paragraph",
};

export interface VocQuestion {
  id:              string;
  text:            string;
  type:            VocQuestionType;
  options:         string[];           // MC / select_all answer options
  bannerCut:       boolean;            // use this question as a banner cut variable; question text is the label
  t2bB2b:          boolean;            // scale_1_7 only: flag T2B/B2B for reporting
  segmentationVar: boolean;            // MC / select_all only: use as cross-tab banner
}

// ── Calculated statistics ─────────────────────────────────────────────────────

export interface VocQuestionStat {
  questionId:    string;
  questionText:  string;
  type:          VocQuestionType;
  totalResponded:number;
  // scale_1_7
  mean?:         number;
  t2b?:          number;   // Top 2 Box %, 0-100
  b2b?:          number;   // Bottom 2 Box %, 0-100
  distribution?: Record<string, number>; // "1" → count … "7" → count
  // multiple_choice / select_all
  frequencies?:  Record<string, number>;
  percentages?:  Record<string, number>;
}

export interface BannerCutCell {
  count:        number;
  mean?:        number;
  t2b?:         number;
  b2b?:         number;
  frequencies?: Record<string, number>;
  percentages?: Record<string, number>;
}

// bannerCuts[segQuestionId][segValue][targetQuestionId] = BannerCutCell
export type BannerCuts = Record<string, Record<string, Record<string, BannerCutCell>>>;

export interface VocQuantData {
  totalResponses:    number;
  questionStats:     Record<string, VocQuestionStat>;   // questionId → stats
  bannerCuts:        BannerCuts;
  openEndedResponses:Record<string, string[]>;           // questionId → responses
  segVarNames:       Record<string, string>;             // questionId → questionText
}

// ── CSV parsing ───────────────────────────────────────────────────────────────

export interface ParsedCSV {
  headers: string[];
  rows:    Record<string, string>[];
}

// questionId → CSV column header (null = unmapped)
export type ColumnMapping = Record<string, string | null>;
