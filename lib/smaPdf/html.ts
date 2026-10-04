// ── SMA report → self-contained HTML (printed to PDF by ./render.ts) ──────────
// Matches the MIR/DDR design system: Georgia/Gelasio font, navy/teal/white
// palette, named @page sections with navy header bars, cover page, TOC, footer.

import { gelasio } from "../mirPdf/fontAssets";
import logoAssets from "../logoAssets";

const NAVY      = "#0A2F61";
const TEAL      = "#00CED1";
const CREAM     = "#F4EADA";
const WHITE     = "#FFFFFF";
const INK       = "#1C1C1C";
const GRAY      = "#6B7280";
const ROW_TINT  = "#E8EDF4";

type Obj = Record<string, unknown>;

export type SmaOrderInfo = {
  business_name: string;
  customer_name?: string | null;
  location?: string | null;
  created_at: string;
};

export type SmaSectionId =
  | "profile_setup_review"
  | "content_quality_scoring"
  | "performance_metrics"
  | "platform_utilization_review"
  | "overall_presence_score"
  | "analyst_note";

// Legacy section IDs that may appear in older draft JSON — mapped to new IDs
const LEGACY_MAP: Record<string, SmaSectionId> = {
  posting_consistency_analysis: "performance_metrics",
  engagement_assessment:        "performance_metrics",
  brand_consistency_evaluation: "performance_metrics",
};

export const SMA_SECTIONS: { id: SmaSectionId; title: string }[] = [
  { id: "profile_setup_review",      title: "Profile & Setup Review" },
  { id: "content_quality_scoring",   title: "Content Quality Scoring" },
  { id: "performance_metrics",       title: "Performance Metrics" },
  { id: "platform_utilization_review", title: "Platform Utilization Review" },
  { id: "overall_presence_score",    title: "Overall Presence Score" },
  { id: "analyst_note",              title: "Analyst Note" },
];

export type BuildOptions = {
  only?: SmaSectionId;
  pageNumbers?: Partial<Record<SmaSectionId, number>>;
};

// ── Helpers ────────────────────────────────────────────────────────────────

const MONTHS = ["January","February","March","April","May","June",
  "July","August","September","October","November","December"];

function fmtDate(str: string): string {
  const d = new Date(str);
  if (isNaN(d.getTime())) return String(str || "");
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function text(v: unknown): string {
  const s = String(v ?? "")
    .replace(/\*{2,3}([^*\n]+)\*{2,3}/g, "$1")
    .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1$2")
    .replace(/`([^`\n]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
  return esc(s);
}

function paragraphs(v: unknown, cls = ""): string {
  return String(v ?? "").split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p${cls ? ` class="${cls}"` : ""}>${text(p)}</p>`).join("");
}

const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const obj = (v: unknown): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});

function narrativeSection(content: unknown): string {
  if (typeof content === "string") return paragraphs(content);
  const c = content as Obj;
  if (!c || typeof c !== "object" || Array.isArray(c)) return "";
  const keys = Object.keys(c);
  if (!keys.length) return "";
  return keys.map(k => {
    const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return `<div class="subsection">
      <h3 class="subsection-head">${esc(label)}</h3>
      ${paragraphs((c as Obj)[k])}
    </div>`;
  }).join("");
}

function scoreBand(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 45) return "Needs Work";
  return "Critical";
}

function bandColor(score: number): string {
  if (score >= 75) return "#059669";
  if (score >= 60) return "#8FADC8";
  return "#DC6B6B";
}

function extractScore(content: unknown): number | null {
  const c = obj(content);
  const candidates = [
    c.score, c.overall_score, c.total_score, c.rating, c.overall_rating,
    c.section_score, c.audit_score,
  ];
  for (const v of candidates) {
    const n = Number(v);
    if (!isNaN(n) && n >= 0) return Math.min(100, n <= 10 ? n * 10 : n);
  }
  return null;
}

function scoreHero(score: number, label: string): string {
  const band  = scoreBand(score);
  const color = bandColor(score);
  return `
  <div class="sma-score-hero">
    <div class="sma-score-left">
      <div class="sma-score-label">${esc(label)}</div>
      <div class="sma-score-number" style="color:${color}">${score}</div>
      <div class="sma-score-denom">/100</div>
      <div class="sma-score-band" style="background:${color}">${esc(band)}</div>
    </div>
    <div class="sma-score-bar-wrap">
      <div class="sma-score-bar-track">
        <div class="sma-score-bar-fill" style="width:${score}%;background:${color}"></div>
      </div>
      <div class="sma-score-scale">0 &nbsp;&mdash;&nbsp; Needs Work &nbsp;&mdash;&nbsp; Fair &nbsp;&mdash;&nbsp; Good &nbsp;&mdash;&nbsp; 100</div>
    </div>
  </div>`;
}

// ── Social Media Logo SVGs ─────────────────────────────────────────────────

const PLATFORM_LOGOS: Record<string, string> = {
  instagram: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="ig" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#f09433"/><stop offset="25%" style="stop-color:#e6683c"/>
      <stop offset="50%" style="stop-color:#dc2743"/><stop offset="75%" style="stop-color:#cc2366"/>
      <stop offset="100%" style="stop-color:#bc1888"/>
    </linearGradient></defs>
    <rect width="24" height="24" rx="5.5" fill="url(#ig)"/>
    <path d="M12 7.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9zm0 7.4a2.9 2.9 0 110-5.8 2.9 2.9 0 010 5.8z" fill="white"/>
    <circle cx="16.7" cy="7.3" r="1.05" fill="white"/>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4" stroke="white" stroke-width="1.5" fill="none"/>
  </svg>`,

  facebook: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#1877F2"/>
    <path d="M16.5 12H14v8h-3.5v-8H9V9h1.5V7.5C10.5 5.6 11.6 4.5 13.5 4.5c.8 0 1.7.1 2.5.2V8h-1.5c-.8 0-1 .4-1 1V9H16l-.5 3z" fill="white"/>
  </svg>`,

  tiktok: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#000000"/>
    <path d="M17.5 6.5c-1 0-1.9-.6-2.3-1.5H13v9.3c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .5.1V10c-.2 0-.4-.1-.5-.1C8.8 9.9 7 11.7 7 13.8s1.8 3.9 3.9 3.9 3.9-1.8 3.9-3.9V9.2c.8.5 1.7.8 2.7.8V7.6c-.3-.1-.6-.1-1-.1h.1-.1.1z" fill="white"/>
    <path d="M17.5 7.6v1.4c-1 0-1.9-.3-2.7-.8v5.6c0 2.2-1.8 3.9-3.9 3.9S7 16 7 13.8s1.8-3.9 3.9-3.9c.2 0 .4 0 .5.1v1.4c-.2-.1-.4-.1-.5-.1-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2V5h2.2c.4.9 1.3 1.5 2.3 1.5h.1z" fill="#EE1D52"/>
    <path d="M14.8 9V7.6c-1 0-1.9-.6-2.3-1.5H10.2v9.2c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.2 0 .4 0 .5.1V11c-.2 0-.4-.1-.5-.1C5.8 10.9 4 12.7 4 14.8s1.8 3.9 3.9 3.9 3.9-1.8 3.9-3.9V8.2c.8.5 1.7.8 2.7.8" fill="#69C9D0"/>
  </svg>`,

  twitter: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#000000"/>
    <path d="M18.5 5h-2.5L12 9.5 8.5 5H4l5.5 7.5L4 19h2.5L11 14l4.5 5H20l-5.5-7.5L18.5 5zM16.3 17.5l-9.6-13h2l9.6 13h-2z" fill="white"/>
  </svg>`,

  pinterest: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#E60023"/>
    <path d="M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.8-.1-2 .1-2.8.2-.8 1.5-6.3 1.5-6.3s-.4-.8-.4-1.9c0-1.8 1-3.1 2.3-3.1 1.1 0 1.6.8 1.6 1.8 0 1.1-.7 2.7-1.1 4.2-.3 1.2.6 2.2 1.8 2.2 2.2 0 3.7-2.8 3.7-6.2 0-2.6-1.8-4.5-4.4-4.5-3.1 0-4.9 2.3-4.9 4.7 0 .9.3 1.8.8 2.3.1.1.1.2.1.4-.1.3-.2 1-.3 1.1 0 .2-.1.2-.3.1-1.7-.8-2.7-3.3-2.7-5.3 0-4.3 3.1-8.3 9.1-8.3 4.8 0 8.5 3.4 8.5 7.9 0 4.7-3 8.5-7 8.5-1.4 0-2.7-.7-3.1-1.6l-.9 3.3c-.3 1.2-1.1 2.6-1.7 3.5.6.2 1.3.3 2 .3 5.5 0 10-4.5 10-10S17.5 2 12 2z" fill="white"/>
  </svg>`,

  youtube: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#FF0000"/>
    <path d="M21.5 7.5s-.2-1.5-.9-2.1c-.8-.9-1.8-.9-2.2-.9C15.8 4.3 12 4.3 12 4.3s-3.8 0-6.4.2c-.4 0-1.4.1-2.2.9-.7.7-.9 2.1-.9 2.1S2.2 9.2 2.2 11v1.6c0 1.8.2 3.5.2 3.5s.2 1.5.9 2.1c.8.9 2 .8 2.5.9C7.3 19.3 12 19.3 12 19.3s3.8 0 6.4-.2c.4 0 1.4-.1 2.2-.9.7-.7.9-2.1.9-2.1s.2-1.8.2-3.5V11c0-1.8-.2-3.5-.2-3.5zM9.9 14.7V8.9l6 2.9-6 2.9z" fill="white"/>
  </svg>`,

  linkedin: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#0A66C2"/>
    <path d="M7.2 10H4.8v9H7.2V10zM6 8.7C5.2 8.7 4.5 8 4.5 7.2 4.5 6.4 5.2 5.7 6 5.7s1.5.7 1.5 1.5-.7 1.5-1.5 1.5zM20 19h-2.4v-4.4c0-.9 0-2-1.2-2-1.3 0-1.4 1-1.4 2V19H12.5V10H15v1.1h.1c.3-.6 1.2-1.3 2.4-1.3 2.6 0 3 1.7 3 3.9V19z" fill="white"/>
  </svg>`,

  yelp: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="24" rx="4" fill="#D32323"/>
    <path d="M12.7 13.4l-1.6 1c-.3.2-.7.1-.9-.2l-3.5-5.8c-.2-.4-.1-.9.4-1.1l.1-.1c.4-.2.9 0 1.1.4l4.5 5.1c.3.3.2.5-.1.7zM14.8 12l-1.8-.6c-.4-.1-.6-.5-.4-.9l2.3-6.4c.1-.4.6-.7 1-.5l.2.1c.4.2.6.6.4 1l-1.7 7zm1.5 3.2c-.1.4-.5.7-1 .5l-7.1-1.6c-.4-.1-.7-.5-.5-1v-.1c.1-.4.5-.6 1-.5l7.2 1.6c.4.1.7.5.5.9l-.1.2zM12.6 16l.4 1.9c.1.5-.2.9-.7 1l-.2.1c-.5.1-1-.2-1-.7l-.2-1.9c-.1-.5.3-.9.7-.9h.3c.5-.1.8.2.7.5z" fill="white"/>
    <path d="M10.6 13l-1.9.2c-.5 0-.9-.3-.9-.8v-.2c0-.5.3-.9.8-.9l1.9-.1c.5 0 .9.4.9.9-.1.5-.4.9-.8.9z" fill="white"/>
  </svg>`,
};

function platformLogo(platformKey: string, size = 20): string {
  const key = platformKey.toLowerCase();
  const svg = PLATFORM_LOGOS[key];
  if (!svg) return "";
  return `<span class="platform-logo" style="width:${size}pt;height:${size}pt;display:inline-flex;vertical-align:middle;flex-shrink:0">${svg}</span>`;
}

function platformColor(platformKey: string): string {
  const colors: Record<string, string> = {
    instagram: "#E1306C",
    facebook:  "#1877F2",
    tiktok:    "#000000",
    twitter:   "#000000",
    pinterest: "#E60023",
    youtube:   "#FF0000",
    linkedin:  "#0A66C2",
    yelp:      "#D32323",
  };
  return colors[platformKey.toLowerCase()] ?? NAVY;
}

// ── Section Renderers ──────────────────────────────────────────────────────

// Profile & Setup Review — visual snapshot layout
function profileSetupSection(content: unknown): string {
  const c = obj(content);

  // Look for per-platform profile status
  const platformKeys = Object.keys(c).filter(k =>
    /instagram|facebook|tiktok|twitter|linkedin|pinterest|youtube|yelp/i.test(k)
  );

  // Try to find takeaways and actions at top level
  const takeaways = arr(c.key_takeaways ?? c.takeaways ?? c.highlights ?? []);
  const actions   = arr(c.action_items ?? c.recommended_actions ?? c.actions ?? c.priorities ?? []);
  const summary   = c.summary ?? c.overview ?? c.executive_summary ?? null;

  let html = "";

  // Summary blurb
  if (summary) {
    html += `<p class="section-summary">${text(summary)}</p>`;
  }

  // Platform status cards
  if (platformKeys.length) {
    html += `<div class="profile-grid">${platformKeys.map(k => {
      const p = obj(c[k]);
      const color  = platformColor(k);
      const logo   = platformLogo(k, 22);
      const name   = k.charAt(0).toUpperCase() + k.slice(1);

      // Status fields
      const status     = p.status ?? p.profile_status ?? p.account_status ?? null;
      const followers  = p.followers ?? p.follower_count ?? p.following_count ?? null;
      const handle     = p.handle ?? p.username ?? p.url ?? p.profile_url ?? null;
      const bio        = p.bio ?? p.bio_complete ?? null;
      const photo      = p.profile_photo ?? p.profile_picture ?? p.avatar ?? null;
      const pinned     = p.pinned_post ?? p.featured ?? null;
      const verified   = p.verified ?? null;
      const highlights = arr(p.highlights ?? p.notes ?? p.flags ?? []);

      const statusVal  = String(status ?? "").toLowerCase();
      const isActive   = /active|good|complete|set up|ready|strong|verified/i.test(statusVal);
      const isWarning  = /partial|incomplete|missing|needs|improve/i.test(statusVal);
      const statusColor = isActive ? "#059669" : isWarning ? "#D97706" : GRAY;
      const statusBg   = isActive ? "#ECFDF5" : isWarning ? "#FFFBEB" : "#F9FAFB";
      const statusIcon = isActive ? "✓" : isWarning ? "⚠" : "–";

      const renderField = (label: string, val: unknown) => {
        if (val === null || val === undefined || String(val).trim() === "") return "";
        return `<div class="profile-field">
          <span class="profile-field-label">${esc(label)}</span>
          <span class="profile-field-value">${text(val)}</span>
        </div>`;
      };

      // Collect extra keys that aren't already covered
      const coveredKeys = new Set(["status","profile_status","account_status","followers","follower_count",
        "following_count","handle","username","url","profile_url","bio","bio_complete","profile_photo",
        "profile_picture","avatar","pinned_post","featured","verified","highlights","notes","flags",
        "score","rating"]);
      const extraKeys = Object.keys(p).filter(pk => !coveredKeys.has(pk));

      return `<div class="profile-card" style="border-top:3pt solid ${color}">
        <div class="profile-card-header">
          ${logo}
          <div class="profile-card-name" style="color:${color}">${esc(name)}</div>
          ${status ? `<div class="profile-status-badge" style="color:${statusColor};background:${statusBg};border:1pt solid ${statusColor}40">
            ${statusIcon} ${text(status)}
          </div>` : ""}
        </div>
        ${handle ? renderField("Handle", handle) : ""}
        ${followers !== null ? renderField("Followers", followers) : ""}
        ${bio !== null ? renderField("Bio", typeof bio === "boolean" ? (bio ? "Complete" : "Incomplete") : bio) : ""}
        ${photo !== null ? renderField("Profile Photo", typeof photo === "boolean" ? (photo ? "Present" : "Missing") : photo) : ""}
        ${verified !== null ? renderField("Verified", typeof verified === "boolean" ? (verified ? "Yes" : "No") : verified) : ""}
        ${pinned !== null ? renderField("Pinned Post", typeof pinned === "boolean" ? (pinned ? "Yes" : "None") : pinned) : ""}
        ${extraKeys.map(pk => renderField(pk.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), p[pk])).join("")}
        ${highlights.length ? `<ul class="profile-card-notes">${highlights.map(h => `<li>${text(h)}</li>`).join("")}</ul>` : ""}
      </div>`;
    }).join("")}</div>`;
  }

  // Takeaways + Actions two-column
  if (takeaways.length || actions.length) {
    html += `<div class="takeaway-row">
      ${takeaways.length ? `<div class="takeaway-box">
        <div class="takeaway-box-title">Key Takeaways</div>
        <ul class="takeaway-list">${takeaways.map(t => `<li>${text(t)}</li>`).join("")}</ul>
      </div>` : ""}
      ${actions.length ? `<div class="takeaway-box action-box">
        <div class="takeaway-box-title">Priority Actions</div>
        <ol class="action-list">${actions.map(a => `<li>${text(a)}</li>`).join("")}</ol>
      </div>` : ""}
    </div>`;
  }

  // Fallback if no structured data
  if (!platformKeys.length && !takeaways.length && !actions.length) {
    html += narrativeSection(content);
  }

  return html;
}

// Content Quality Scoring — visual scorecard with dimension bars
function contentQualitySection(content: unknown): string {
  const c     = obj(content);
  const score = extractScore(content);

  // Find per-dimension scores
  const dims: unknown[] = Array.isArray(c.dimensions) ? c.dimensions
    : Array.isArray(c.criteria) ? c.criteria
    : Array.isArray(c.categories) ? c.categories
    : Array.isArray(c.scores) ? c.scores
    : [];

  // Individual criteria that may be in flat keys
  const scoreCriteriaKeys = Object.keys(c).filter(k =>
    /quality|visual|caption|consistency|originality|relevance|call|cta|hook|value|creativity|engagement|brand/i.test(k)
    && typeof c[k] === "number"
  );

  let html = "";

  // Score hero
  if (score !== null) {
    html += scoreHero(score, "Content Quality Score");
  }

  // Visual scorecard — dimension bars
  const allDims: Array<{name: string; score: number; notes?: string}> = [];

  if (dims.length) {
    dims.forEach((d, i) => {
      const g = obj(d);
      const n = String(g.category ?? g.dimension ?? g.name ?? g.criterion ?? `Dimension ${i + 1}`);
      const s = Math.min(100, Number(g.score ?? g.value ?? g.rating ?? 0) <= 10
        ? Number(g.score ?? g.value ?? g.rating ?? 0) * 10
        : Number(g.score ?? g.value ?? g.rating ?? 0));
      const notes = String(g.notes ?? g.description ?? g.comment ?? "");
      allDims.push({ name: n, score: s, notes: notes || undefined });
    });
  } else if (scoreCriteriaKeys.length) {
    scoreCriteriaKeys.forEach(k => {
      const s = Math.min(100, Number(c[k]) <= 10 ? Number(c[k]) * 10 : Number(c[k]));
      allDims.push({ name: k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()), score: s });
    });
  }

  if (allDims.length) {
    html += `<div class="scorecard">
      <div class="scorecard-header">
        <span class="scorecard-col-label">Criterion</span>
        <span class="scorecard-col-score">Score</span>
        <span class="scorecard-col-bar"></span>
        <span class="scorecard-col-rating">Rating</span>
      </div>
      ${allDims.map((d, i) => {
        const color = bandColor(d.score);
        return `<div class="scorecard-row ${i % 2 ? "even" : ""}">
          <div class="scorecard-criterion">
            <span class="scorecard-name">${esc(d.name)}</span>
            ${d.notes ? `<span class="scorecard-notes">${esc(d.notes)}</span>` : ""}
          </div>
          <div class="scorecard-score" style="color:${color}"><strong>${d.score}</strong><span class="scorecard-denom">/100</span></div>
          <div class="scorecard-bar-wrap"><div class="scorecard-bar-track"><div class="scorecard-bar-fill" style="width:${d.score}%;background:${color}"></div></div></div>
          <div class="scorecard-rating"><span class="band-badge" style="background:${color}20;color:${color};border:1pt solid ${color}40">${scoreBand(d.score)}</span></div>
        </div>`;
      }).join("")}
    </div>`;
  }

  // Prose prose content (exclude score/dimension fields)
  const skipKeys = new Set(["score","overall_score","total_score","rating","dimensions","criteria","categories","scores","category_scores",...scoreCriteriaKeys]);
  const remainingKeys = Object.keys(c).filter(k => !skipKeys.has(k));
  if (remainingKeys.length) {
    html += `<div style="margin-top:16pt">${remainingKeys.map(k => {
      const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return `<div class="subsection"><h3 class="subsection-head">${esc(label)}</h3>${paragraphs(c[k])}</div>`;
    }).join("")}</div>`;
  }

  if (!score && !allDims.length && !remainingKeys.length) {
    html += narrativeSection(content);
  }

  return html;
}

// Performance Metrics — three score cards: posting, engagement, brand consistency
function performanceMetricsSection(content: unknown): string {
  const c = obj(content);

  // Support new structured format { posting: {...}, engagement: {...}, brand: {...} }
  // OR legacy separate section objects merged together
  const sub = {
    posting:    obj(c.posting    ?? c.posting_consistency ?? c.posting_consistency_analysis ?? {}),
    engagement: obj(c.engagement ?? c.engagement_assessment ?? {}),
    brand:      obj(c.brand      ?? c.brand_consistency ?? c.brand_consistency_evaluation ?? {}),
  };

  const metricCards = [
    { key: "posting",    label: "Posting Consistency", icon: "📅", data: sub.posting },
    { key: "engagement", label: "Engagement",          icon: "💬", data: sub.engagement },
    { key: "brand",      label: "Brand Consistency",   icon: "🎨", data: sub.brand },
  ];

  // Check if we have any actual structured data in the subs
  const hasStructuredSubs = metricCards.some(m => Object.keys(m.data).length > 0);

  let html = "";

  if (hasStructuredSubs) {
    html += `<div class="metric-cards">${metricCards.map(m => {
      const score  = extractScore(m.data);
      const color  = score !== null ? bandColor(score) : NAVY;
      const fields = Object.keys(m.data).filter(k => !["score","overall_score","rating"].includes(k));

      // Key observations and actions
      const obs  = arr(m.data.observations ?? m.data.highlights ?? m.data.key_points ?? []);
      const acts = arr(m.data.actions ?? m.data.recommendations ?? m.data.improvements ?? []);

      return `<div class="metric-card" style="border-top:3pt solid ${color}">
        <div class="metric-card-header">
          <span class="metric-card-icon">${m.icon}</span>
          <span class="metric-card-title" style="color:${color}">${esc(m.label)}</span>
          ${score !== null ? `<span class="metric-score" style="color:${color}">${score}<span class="metric-denom">/100</span></span>` : ""}
        </div>
        ${score !== null ? `<div class="metric-bar-track"><div class="metric-bar-fill" style="width:${score}%;background:${color}"></div></div>
          <div class="metric-band"><span class="band-badge" style="background:${color}20;color:${color};border:1pt solid ${color}40">${scoreBand(score)}</span></div>` : ""}
        ${obs.length ? `<ul class="metric-obs">${obs.map(o => `<li>${text(o)}</li>`).join("")}</ul>` : ""}
        ${acts.length ? `<div class="metric-actions-label">Actions</div><ol class="metric-acts">${acts.map(a => `<li>${text(a)}</li>`).join("")}</ol>` : ""}
        ${!obs.length && !acts.length && fields.length ? fields.map(k => {
          const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          return `<div class="profile-field"><span class="profile-field-label">${esc(label)}</span><span class="profile-field-value">${text(m.data[k])}</span></div>`;
        }).join("") : ""}
      </div>`;
    }).join("")}</div>`;
  } else {
    // Fallback: scoreHero + narrative per sub-key, or plain narrative
    const topScore = extractScore(content);
    if (topScore !== null) html += scoreHero(topScore, "Performance Score");
    html += narrativeSection(content);
  }

  return html;
}

// Overall Presence Score
function overallPresenceSection(content: unknown): string {
  const c     = obj(content);
  const score = extractScore(content);

  const dims: unknown[] = Array.isArray(c.dimensions) ? c.dimensions
    : Array.isArray(c.scores) ? c.scores
    : Array.isArray(c.category_scores) ? c.category_scores
    : [];

  const hero = score !== null ? scoreHero(score, "Overall Social Media Presence Score") : "";
  const dimTable = dims.length ? `
    <table class="sma-dim-table">
      <thead><tr><th>Category</th><th style="text-align:center">Score</th><th>Rating</th><th>Bar</th></tr></thead>
      <tbody>${dims.map((d, i) => {
        const g     = obj(d);
        const dName = String(g.category ?? g.dimension ?? g.name ?? g.label ?? `Category ${i + 1}`);
        const dScore = Math.min(100, Number(g.score ?? g.value ?? 0) <= 10 ? Number(g.score ?? g.value ?? 0) * 10 : Number(g.score ?? g.value ?? 0));
        const color  = bandColor(dScore);
        return `<tr class="${i % 2 ? "even" : ""}">
          <th scope="row">${esc(dName)}</th>
          <td style="text-align:center"><strong style="color:${color}">${dScore}</strong></td>
          <td><span class="band-badge" style="background:${color}20;color:${color};border:1pt solid ${color}40">${esc(scoreBand(dScore))}</span></td>
          <td class="bar-cell"><div class="bar-track"><div class="bar-fill" style="width:${dScore}%;background:${color}"></div></div></td>
        </tr>`;
      }).join("")}</tbody>
    </table>` : "";

  const remainingKeys = Object.keys(c).filter(k =>
    !["score","overall_score","total_score","rating","overall_rating","dimensions","scores","category_scores"].includes(k)
  );
  const prose = remainingKeys.length ? remainingKeys.map(k => {
    const label = k.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    return `<div class="subsection"><h3 class="subsection-head">${esc(label)}</h3>${paragraphs(c[k])}</div>`;
  }).join("") : (score === null ? narrativeSection(content) : "");

  return hero + dimTable + (dimTable ? `<div style="margin-top:16pt">${prose}</div>` : prose);
}

// Platform Utilization Review
function platformSection(content: unknown): string {
  const c = obj(content);
  const platformKeys = Object.keys(c).filter(k =>
    /instagram|facebook|tiktok|twitter|linkedin|pinterest|youtube|yelp/i.test(k)
  );
  if (platformKeys.length >= 2) {
    return `<div class="platform-grid">${platformKeys.map(k => {
      const p     = obj(c[k]);
      const score = extractScore(c[k]);
      const color = score !== null ? bandColor(score) : platformColor(k);
      const logo  = platformLogo(k, 20);
      return `<div class="platform-card" style="border-top:3pt solid ${color}">
        <div class="platform-card-header">
          ${logo}
          <div class="platform-name" style="color:${color}">${esc(k.charAt(0).toUpperCase() + k.slice(1))}</div>
        </div>
        ${score !== null ? `<div class="platform-score" style="color:${color}">${score}<span class="platform-denom">/100</span></div>
          <div class="bar-track" style="margin:4pt 0 8pt"><div class="bar-fill" style="width:${score}%;background:${color}"></div></div>` : ""}
        ${Object.keys(p).filter(pk => !["score","rating"].includes(pk)).map(pk => {
          const label = pk.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
          return `<div class="platform-field"><span class="platform-field-label">${esc(label)}</span>${text(p[pk])}</div>`;
        }).join("")}
      </div>`;
    }).join("")}</div>` + (c.summary || c.overall_summary ? `<div style="margin-top:14pt">${paragraphs(c.summary ?? c.overall_summary)}</div>` : "");
  }
  return narrativeSection(content);
}

function analystNote(note: string, icon: string): string {
  return `
    ${note.trim() ? `<div class="note">${paragraphs(note)}</div>` : ""}
    <div class="signature">
      <div class="sig-name">John Messina</div>
      <div class="sig-title">Founder, Sea Glass Insights</div>
    </div>
    <div class="brand-footer">
      <img src="data:image/png;base64,${icon}" alt="">
      <div>
        <div class="brand-name">Sea Glass Insights</div>
        <div class="brand-meta">seaglassinsights.com &nbsp;|&nbsp; john@seaglassinsights.com</div>
      </div>
    </div>`;
}

// ── CSS ────────────────────────────────────────────────────────────────────

function fontFaces(): string {
  const face = (data: string, weight: number, style: string) =>
    `@font-face{font-family:"Gelasio";src:url(data:font/woff2;base64,${data}) format("woff2");font-weight:${weight};font-style:${style};}`;
  return face(gelasio.regular, 400, "normal") + face(gelasio.italic, 400, "italic") +
         face(gelasio.bold, 700, "normal") + face(gelasio.boldItalic, 700, "italic");
}

function pageRules(): string {
  const chrome = (name: string) => `
    @top-center {
      content: "${name.toUpperCase()}";
      background: ${NAVY}; color: ${WHITE};
      font: 700 9pt Georgia, "Gelasio", serif; letter-spacing: 1.5pt;
      text-align: left; vertical-align: middle;
      padding-left: 12pt; margin-top: 0.4in; margin-bottom: 0.22in;
    }
    @bottom-left {
      content: "Sea Glass Insights  |  Confidential";
      font: 8.5pt Georgia, "Gelasio", serif; color: ${GRAY};
      vertical-align: top; padding-top: 0.28in;
    }
    @bottom-right {
      content: "Page " counter(page);
      font: 8.5pt Georgia, "Gelasio", serif; color: ${GRAY};
      vertical-align: top; padding-top: 0.28in;
    }`;
  return [
    `@page { size: Letter; margin: 1in; }`,
    `@page cover { margin: 1in; }`,
    `@page contents { ${chrome("Contents")} }`,
    ...SMA_SECTIONS.map(s => `@page ${s.id} { ${chrome(s.title)} }`),
  ].join("\n");
}

const CSS = `
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; }
body {
  font-family: Georgia, "Gelasio", serif; font-size: 11pt; line-height: 1.5; color: ${INK};
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}
p { margin: 0 0 8pt; }
h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
.keep, .card, .subsection { break-inside: avoid; page-break-inside: avoid; }

section.page { break-before: page; page-break-before: always; }
section.page:first-child { break-before: auto; page-break-before: auto; }
${SMA_SECTIONS.map(s => `section.sec-${s.id} { page: ${s.id}; }`).join("\n")}
section.cover { page: cover; }
section.contents { page: contents; }

.section-title {
  font-size: 16pt; font-weight: 700; color: ${NAVY}; margin: 0 0 14pt;
  padding-bottom: 6pt; border-bottom: 2pt solid ${TEAL};
}
.section-summary { font-size: 11.5pt; color: ${INK}; margin-bottom: 16pt; line-height: 1.6; }

/* Cover */
.cover-inner { height: 9in; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover-logo { width: 5in; margin-top: 1.5in; }
.cover-type { font-size: 9pt; font-weight: 700; color: ${TEAL}; letter-spacing: 3pt; text-transform: uppercase; margin: 0.65in 0 0; }
.cover-rule { width: 1.2in; height: 3pt; background: ${TEAL}; margin: 20pt auto; }
.cover-business { font-size: 28pt; font-weight: 700; color: ${NAVY}; margin: 0; line-height: 1.2; }
.cover-sub { font-size: 11pt; color: ${GRAY}; margin-top: 12pt; }
.cover-confidential { margin-top: auto; font-size: 8pt; color: ${GRAY}; font-style: italic; }

/* Contents */
.toc { list-style: none; margin: 8pt 0 0; padding: 0; }
.toc li { display: flex; align-items: baseline; padding: 9pt 0; font-size: 12pt; color: ${NAVY}; }
.toc .toc-num { color: ${TEAL}; font-weight: 700; width: 28pt; }
.toc .toc-dots { flex: 1; border-bottom: 1pt dotted ${GRAY}; margin: 0 8pt; transform: translateY(-3pt); }
.toc .toc-page { font-weight: 700; min-width: 18pt; text-align: right; }

/* Subsections */
.subsection { margin-bottom: 14pt; }
.subsection-head { font-size: 12pt; font-weight: 700; color: ${NAVY}; margin: 0 0 6pt; padding-bottom: 4pt; border-bottom: 1pt solid ${TEAL}; }

/* Score Hero */
.sma-score-hero { display: flex; align-items: flex-start; gap: 24pt; padding: 18pt 20pt; background: ${ROW_TINT}; border-radius: 4pt; border-top: 4pt solid ${TEAL}; margin-bottom: 20pt; }
.sma-score-left { min-width: 100pt; }
.sma-score-label { font-size: 8.5pt; font-weight: 700; color: ${GRAY}; letter-spacing: 1.5pt; text-transform: uppercase; margin-bottom: 4pt; }
.sma-score-number { font-size: 48pt; font-weight: 700; line-height: 1; }
.sma-score-denom { font-size: 14pt; color: ${GRAY}; margin-top: -4pt; }
.sma-score-band { display: inline-block; margin-top: 8pt; padding: 3pt 10pt; border-radius: 12pt; color: ${WHITE}; font-size: 10pt; font-weight: 700; }
.sma-score-bar-wrap { flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 6pt; }
.sma-score-bar-track { height: 12pt; background: #E0E0E0; border-radius: 6pt; overflow: hidden; }
.sma-score-bar-fill { height: 100%; border-radius: 6pt; }
.sma-score-scale { font-size: 8pt; color: ${GRAY}; }

/* Dimension table */
table { border-collapse: collapse; width: 100%; }
.sma-dim-table thead th { background: ${NAVY}; color: ${WHITE}; font-size: 8.5pt; letter-spacing: 1pt; text-transform: uppercase; text-align: left; padding: 8pt 10pt; }
.sma-dim-table tbody th { background: ${NAVY}; color: ${WHITE}; text-align: left; font-weight: 700; padding: 9pt 10pt; border-top: 1pt solid rgba(255,255,255,0.15); width: 34%; }
.sma-dim-table tbody td { padding: 9pt 10pt; background: ${WHITE}; border-bottom: 1px solid #E0E0E0; }
.sma-dim-table tbody tr.even td { background: ${ROW_TINT}; }
.sma-dim-table tbody tr.even th { background: ${ROW_TINT}; color: ${NAVY}; }
.band-badge { display: inline-block; padding: 2pt 8pt; border-radius: 10pt; font-size: 9pt; font-weight: 700; }
.bar-cell { width: 100pt; }
.bar-track { height: 8pt; background: #E0E0E0; border-radius: 4pt; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 4pt; }

/* Platform Logo */
.platform-logo svg { width: 100%; height: 100%; }

/* Profile Setup Cards */
.profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 16pt; }
.profile-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; padding: 12pt 14pt; break-inside: avoid; }
.profile-card-header { display: flex; align-items: center; gap: 8pt; margin-bottom: 10pt; flex-wrap: wrap; }
.profile-card-name { font-size: 13pt; font-weight: 700; flex: 1; }
.profile-status-badge { font-size: 8.5pt; font-weight: 700; padding: 2pt 8pt; border-radius: 10pt; white-space: nowrap; }
.profile-field { font-size: 10pt; margin-bottom: 5pt; display: flex; gap: 6pt; align-items: baseline; }
.profile-field-label { font-weight: 700; color: ${NAVY}; text-transform: uppercase; font-size: 7.5pt; letter-spacing: 0.8pt; white-space: nowrap; min-width: 70pt; }
.profile-field-value { color: ${INK}; }
.profile-card-notes { margin: 8pt 0 0; padding-left: 14pt; font-size: 9.5pt; color: ${GRAY}; }
.profile-card-notes li { margin-bottom: 3pt; }

/* Takeaways + Actions */
.takeaway-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14pt; margin-top: 16pt; }
.takeaway-box { background: ${ROW_TINT}; border-radius: 4pt; padding: 14pt; break-inside: avoid; }
.action-box { background: #EEF7F0; }
.takeaway-box-title { font-size: 9pt; font-weight: 700; color: ${NAVY}; text-transform: uppercase; letter-spacing: 1.2pt; margin-bottom: 8pt; }
.takeaway-list, .action-list { margin: 0; padding-left: 16pt; }
.takeaway-list li, .action-list li { font-size: 10.5pt; margin-bottom: 5pt; color: ${INK}; line-height: 1.4; }

/* Content Quality Scorecard */
.scorecard { border: 1pt solid #E0E0E0; border-radius: 4pt; overflow: hidden; margin-bottom: 16pt; }
.scorecard-header { display: grid; grid-template-columns: 1fr 60pt 120pt 80pt; gap: 8pt; padding: 7pt 12pt; background: ${NAVY}; }
.scorecard-col-label, .scorecard-col-score, .scorecard-col-rating { font-size: 8pt; font-weight: 700; color: ${WHITE}; text-transform: uppercase; letter-spacing: 1pt; }
.scorecard-row { display: grid; grid-template-columns: 1fr 60pt 120pt 80pt; gap: 8pt; padding: 9pt 12pt; align-items: center; background: ${WHITE}; border-bottom: 1pt solid #F0F0F0; break-inside: avoid; }
.scorecard-row.even { background: ${ROW_TINT}; }
.scorecard-criterion { display: flex; flex-direction: column; gap: 2pt; }
.scorecard-name { font-size: 10.5pt; font-weight: 700; color: ${NAVY}; }
.scorecard-notes { font-size: 8.5pt; color: ${GRAY}; font-style: italic; }
.scorecard-score { font-size: 14pt; text-align: center; }
.scorecard-denom { font-size: 9pt; color: ${GRAY}; }
.scorecard-bar-wrap { }
.scorecard-bar-track { height: 8pt; background: #E0E0E0; border-radius: 4pt; overflow: hidden; }
.scorecard-bar-fill { height: 100%; border-radius: 4pt; }
.scorecard-rating { }

/* Performance Metric Cards */
.metric-cards { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12pt; margin-bottom: 16pt; }
.metric-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; padding: 12pt 14pt; break-inside: avoid; }
.metric-card-header { display: flex; align-items: center; gap: 6pt; margin-bottom: 8pt; }
.metric-card-icon { font-size: 16pt; }
.metric-card-title { font-size: 11pt; font-weight: 700; flex: 1; }
.metric-score { font-size: 22pt; font-weight: 700; line-height: 1; }
.metric-denom { font-size: 10pt; color: ${GRAY}; }
.metric-bar-track { height: 7pt; background: #E0E0E0; border-radius: 4pt; overflow: hidden; margin-bottom: 4pt; }
.metric-bar-fill { height: 100%; border-radius: 4pt; }
.metric-band { margin-bottom: 8pt; }
.metric-obs { margin: 8pt 0 0; padding-left: 14pt; font-size: 9.5pt; color: ${INK}; }
.metric-obs li { margin-bottom: 3pt; }
.metric-actions-label { font-size: 8pt; font-weight: 700; color: ${NAVY}; text-transform: uppercase; letter-spacing: 1pt; margin-top: 8pt; margin-bottom: 4pt; }
.metric-acts { margin: 0; padding-left: 14pt; font-size: 9.5pt; color: ${INK}; }
.metric-acts li { margin-bottom: 3pt; }

/* Platform Grid (Utilization) */
.platform-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12pt; margin-bottom: 16pt; }
.platform-card { background: ${WHITE}; border: 1pt solid #E0E0E0; border-radius: 4pt; padding: 12pt 14pt; break-inside: avoid; }
.platform-card-header { display: flex; align-items: center; gap: 8pt; margin-bottom: 8pt; }
.platform-name { font-size: 13pt; font-weight: 700; }
.platform-score { font-size: 24pt; font-weight: 700; line-height: 1; margin-bottom: 4pt; }
.platform-denom { font-size: 12pt; color: ${GRAY}; }
.platform-field { font-size: 10pt; margin-bottom: 4pt; }
.platform-field-label { font-weight: 700; color: ${NAVY}; text-transform: uppercase; font-size: 8pt; letter-spacing: 1pt; display: block; margin-bottom: 1pt; }

/* Analyst Note */
.note p { font-style: italic; font-size: 12pt; line-height: 1.6; color: ${INK}; margin-bottom: 12pt; }
.signature { margin-top: 26pt; padding-top: 10pt; border-top: 2pt solid ${NAVY}; width: 3in; }
.sig-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.sig-title { color: ${GRAY}; font-size: 10pt; }
.brand-footer { display: flex; align-items: center; gap: 12pt; margin-top: 48pt; padding: 14pt 16pt; background: ${WHITE}; border: 1pt solid ${CREAM}; border-top: 3pt solid ${TEAL}; border-radius: 4pt; }
.brand-footer img { width: 40pt; height: 40pt; object-fit: contain; }
.brand-name { font-weight: 700; color: ${NAVY}; font-size: 12pt; }
.brand-meta { color: ${GRAY}; font-size: 9.5pt; }
`;

// ── Document ───────────────────────────────────────────────────────────────

export function buildSmaReportHtml(
  order: SmaOrderInfo,
  draft: Obj,
  analystNoteText: string,
  opts: BuildOptions = {},
): string {
  // Parse any JSON-stringified values back to objects so section renderers
  // receive the structured data they expect. The dashboard normalizes objects
  // to strings for display; we reverse that here before building the PDF.
  const parsedDraft: Obj = {};
  for (const [k, v] of Object.entries(draft)) {
    if (typeof v === "string") {
      const trimmed = v.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try { parsedDraft[k] = JSON.parse(trimmed); continue; } catch { /* fall through */ }
      }
    }
    parsedDraft[k] = v;
  }

  // Merge any legacy section keys into the new structure
  const normalizedDraft: Obj = { ...parsedDraft };
  for (const [legacyKey, newId] of Object.entries(LEGACY_MAP)) {
    if (legacyKey in normalizedDraft && !(newId in normalizedDraft)) {
      normalizedDraft[newId] = normalizedDraft[legacyKey];
    }
  }

  const sectionBody = (id: SmaSectionId, content: unknown): string => {
    if (id === "profile_setup_review")      return profileSetupSection(content);
    if (id === "content_quality_scoring")   return contentQualitySection(content);
    if (id === "performance_metrics")       return performanceMetricsSection(content);
    if (id === "platform_utilization_review") return platformSection(content);
    if (id === "overall_presence_score")    return overallPresenceSection(content);
    if (id === "analyst_note")              return analystNote(analystNoteText, logoAssets.iconLogo);
    return narrativeSection(content);
  };

  const section = (id: SmaSectionId, title: string) => {
    const content = id === "analyst_note" ? null : normalizedDraft[id];
    return `
    <section class="page sec-${id}">
      <h1 class="section-title">${esc(title)}</h1>
      ${sectionBody(id, content)}
    </section>`;
  };

  let pages: string;
  if (opts.only) {
    const s = SMA_SECTIONS.find(x => x.id === opts.only)!;
    pages = section(s.id, s.title);
  } else {
    const nums = opts.pageNumbers ?? {};
    const cover = `
      <section class="page cover">
        <div class="cover-inner">
          <img class="cover-logo" src="data:image/png;base64,${logoAssets.coverLogo}" alt="Sea Glass Insights">
          <div class="cover-type">Social Media Audit</div>
          <div class="cover-rule"></div>
          <div class="cover-business">${esc(order.business_name)}</div>
          <div class="cover-sub">Prepared for ${esc(order.customer_name || order.business_name)}${order.location ? ` &nbsp;|&nbsp; ${esc(order.location)}` : ""} &nbsp;|&nbsp; ${esc(fmtDate(order.created_at))}</div>
          <div class="cover-confidential">Confidential. Prepared exclusively for ${esc(order.business_name)} by Sea Glass Insights. Not for distribution.</div>
        </div>
      </section>`;
    const contents = `
      <section class="page contents">
        <h1 class="section-title">Contents</h1>
        <ol class="toc">${SMA_SECTIONS.map((s, i) => `
          <li><span class="toc-num">${i + 1}</span><span>${esc(s.title)}</span><span class="toc-dots"></span><span class="toc-page">${nums[s.id] ?? ""}</span></li>`).join("")}
        </ol>
      </section>`;
    pages = cover + contents + SMA_SECTIONS.map(s => section(s.id, s.title)).join("");
  }

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>${esc(order.business_name)} | Social Media Audit</title>
<style>${fontFaces()}
${pageRules()}
${CSS}</style>
</head><body>${pages}</body></html>`;
}
