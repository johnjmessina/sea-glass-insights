# Roadmap

Current to-do list organized by priority.

---

## Active Priorities

**Report Design**
- Social Media Audit docx: make more visual and dynamic (charts, callouts, visual hierarchy)
- Global design pass across all docx templates for consistency — specific elements:
  - Executive Summary as a visual scorecard
  - Customer Segments as profile cards
  - Competitive Intelligence as a comparison table
  - Priority Action Framework as a visual tiered grid
  - Key metrics as visual callouts
  - Consistent visual design language across MIR, SMA, SS, DDR, SSR, VoC, and AI Starter Kit

**Business Pulse**
- Rethink the three-observation format — replace or supplement with a before-visit observation category and a second TBD category

**Website**
- Copy editing pass across all pages
- Remaining mobile responsiveness issues

**Business Operations**
- Business card rebuild and Moo order
- End-to-end payment to dashboard flow test with a real customer submission

---

## Back Burner

- Blog setup
- VOC Google Forms integration
- AI Starter Kit content refinement
- Additional Synthetic Survey bundle pairings

---

## Done

**All seven service report generators built and tested**
- Market Intelligence Report — AI generation, docx download
- Social Media Audit — AI generation with live web search, docx download
- Secret Shopping — scorecard + AI narratives, docx download
- Deep Dive Report — 9-section generation, docx download
- Synthetic Survey Report — 7-section generation, docx download
- Voice of Customer Survey — Phase 1 survey design + Phase 2 quant analysis + AI narratives, docx download
- AI Starter Kit — 9-section generation with custom prompt box rendering, docx download
- Markdown stripping across all docx generators (##, **, bullet/numbered lists, blockquotes, fenced code blocks)
- Send to Customer button removed from all service order views

**Voice of Customer Survey**
- Phase 1: question map editor with per-question type, banner cut toggle, T2B/B2B flag, segmentation variable flag
- Phase 2: CSV upload and manual text paste with auto-format detection
- Narrative paste parser: extracts scores from "X/7" format, segments from "Label: value" blocks
- Column mapping UI for CSV; bypassed for narrative paste
- Quantitative stats: T2B/B2B, distributions, means, banner cut cross-tabs

**Secret Shopping dashboard**
- Continue/Back navigation throughout order view
- Scorecard scores passing to docx and narrative generation
- Lock count showing 7/7 correctly
- Analyst Note on Summary & Recommendations section

**Dashboard infrastructure**
- Multi-service order support with color-coded service type tags
- Archive and delete order functionality
- Manual order creation for all seven service types
- Section-by-section generation pattern with 55s timeout race (avoids serverless limits)
- Per-section Edit, Lock, Unlock, Regenerate, and Analyst Notes controls across all services
- Analyst Perspective callout system (SSR, DDR, SMA, VoC)

**Site & landing pages**
- All seven service landing pages with intake forms and Stripe integration
- Bundles page with four bundle packages
- Core pages: Home, Services, About, Contact, Privacy Policy
- Mobile responsiveness pass
