# Changelog

A running log of everything built for Sea Glass Insights.

---

## Site & Pages

### Core Pages
- Home page with hero, services overview, and CTA sections
- Services page listing all seven research services
- About page with John's photo and bio, blog coming soon notice
- Contact page
- Privacy policy page
- Header and footer on all pages
- Desktop navigation
- Mobile hamburger menu
- Mobile responsiveness pass across all pages

### Service Landing Pages
Each service has a public-facing landing page with an intake form and Stripe payment integration.

| Service | Route |
|---|---|
| Market Intelligence Report (MIR) | `/services/market-intelligence-report` |
| Social Media Audit | `/services/social-media-audit` |
| Secret Shopping | `/services/secret-shopping` |
| Deep Dive Report | `/services/deep-dive-report` |
| Synthetic Survey Report | `/services/synthetic-survey-report` |
| Voice of Customer Survey | `/services/voice-of-customer-survey` |
| AI Starter Kit | `/services/ai-starter-kit` |

Secret Shopping intake form uses a 3-step Continue/Back flow with progress indicator (Step 1 of 3) to prevent state loss on multi-select and address fields.

AI Starter Kit landing page checklist updated with specificity line: "Every prompt is written specifically for your business type, your tone, and your real use cases — not generic templates you could find anywhere online."

### Bundles Page
- `/bundles` landing page with four bundle packages
- Starter Intelligence
- The Field Report
- Market & Mind
- Complete Shopper Experience

---

## Dashboard

### Order Management
- Multi-service order support — each order tagged with service type
- Service type color-coded tags on all order list rows
- Archive and delete order functionality (archived orders hidden from default view)
- Manual order creation for all seven service types with structured intake forms

### Report Generation

**Market Intelligence Report (MIR)**
- AI draft generation via Claude API
- Sectioned narrative output
- docx download with branded cover page, Navy/Teal/Sand color scheme, Cormorant Garamond and Montserrat fonts

**Social Media Audit**
- Report generation with live web search integration
- docx download matching MIR branding

**Secret Shopping**
- Scorecard with 7 weighted dimensions (First Impression, Physical Environment, Staff Engagement, Core Experience, Purchase Process, Digital Touchpoints, Lasting Impression)
- Per-dimension yes/no and 1–5 rating questions
- Weighted total score out of 100 with rating band (Exceptional / Strong / Average / Below Average / Critical)
- Stepped scorecard entry — one dimension at a time with progress indicator (Section 1 of 7) and Continue/Back navigation
- AI narrative generation for all 7 dimensions plus Summary & Recommendations
- Section-by-section narrative review with Edit, Lock, Unlock, and Regenerate controls
- Analyst Notes field on every narrative section
- Analyst Notes always visible on Summary & Recommendations (even when locked)
- Stepped narrative review — one section at a time with Back/Continue navigation
- Section-level Back/Continue throughout the full order view (Visit Overview → Scorecard → Observations → Narratives → Summary → Analyst Note)
- Lock count correctly tracks 7 narratives + summary separately
- docx download with cover page, Visit Overview table, Experience Scorecard table, Analyst Observations, all narrative sections, Summary & Recommendations with analyst notes, and personal Analyst Note closing
- All in-memory state (unsaved within the 2s debounce window) passed directly to docx generator — report always reflects current screen state

**Deep Dive Report**
- Section-by-section AI generation to avoid serverless timeout limits
- 9 sections: Executive Summary, Business Snapshot, Customer Segments, Competitive Intelligence, Market Context & Trend Analysis, Decision-Specific Analysis, Extended Recommendations, Priority Action Framework, Expanded Analyst Interpretation
- Each section has Edit, Lock, Unlock, Regenerate, and Analyst Notes controls
- Analyst Perspective callout per section (optional; appears in docx with navy accent border)
- Generate All button with per-section progress display and per-section retry on failure
- docx download — all 9 sections plus Analyst Note closing

**Synthetic Survey Report**
- Section-by-section AI generation (7 sections)
- Research Question Framework, Customer Personas, Persona Response Simulation, Thematic Analysis, Directional Recommendations, Methodology Disclosure, Honest Limitations Statement
- Each section has Edit, Lock, Unlock, Regenerate, and Analyst Notes controls
- Analyst Perspective callout per section
- Generate All button with per-section progress and retry
- docx download — all 7 sections plus Analyst Note closing

**Voice of Customer Survey**
- Phase 1: AI-generated survey design — question map editor with per-question type (scale 1–7, multiple choice, select all, open-ended), banner cut variable toggle, T2B/B2B flag, segmentation variable flag
- Phase 2: Quantitative data upload — CSV file upload or manual text paste (auto-detected by format)
- Pasted narrative responses parsed from "Label: value" format; "X/7" scores stripped to bare integer
- Column auto-mapping from CSV headers to question map
- MappingUI confirmation for CSV uploads; bypassed for narrative paste (direct to stats)
- T2B/B2B calculations, frequency distributions, mean scores, banner cut cross-tabulations
- 4 AI-generated narrative sections: Quantitative Summary, Thematic Analysis, Visual Findings Summary, Analyst Interpretation & Recommendations
- Analyst Perspective callout per narrative section
- docx download — quantitative tables, all 4 narrative sections, Analyst Note closing

**AI Starter Kit**
- Section-by-section AI generation (9 AI sections + 1 human-only)
- Business Type Analysis, AI Best Practices Introduction, 6 custom prompts (marketing copy, review responses, social media captions, customer email, promotional brainstorm, business-specific custom prompt), Real Use Case Examples
- Custom prompts use prompt---instructions delimiter: prompt text rendered in a distinct styled box in both dashboard and docx
- Revision Notes section: human-only textarea (no AI generation)
- Each AI section has Edit, Lock, Unlock, Regenerate, and Analyst Notes controls
- No Analyst Perspective callouts (prompts are the deliverable)
- Generate All button with per-section progress and retry
- docx download — all sections with custom prompts in teal-bordered Courier New styled box, Analyst Note closing

**All Services**
- Markdown formatting symbols (##, **, *, __, _, backticks) stripped from all docx output — plain text only in Word documents

**Business Pulse**
- Two-page 4×6 print-ready PDF generator
- Updated intro copy
- Checkmark rendering fixes
- AI Starter Kit pricing updated to $99 / $79 add-on

---

## Database

- Supabase migration: `service_type` column on orders table
- Supabase migration: `service_data` JSONB column for per-service structured intake data
- Supabase migration: `is_archived` boolean column for order archiving
