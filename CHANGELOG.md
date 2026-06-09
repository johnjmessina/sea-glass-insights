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
