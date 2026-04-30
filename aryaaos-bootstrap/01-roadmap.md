# AryaaOS — revised 4-week roadmap

ADHD-tuned, omnibox-centric. Honest time: **~80-120h of your active attention over 4 weeks.** Everything else delegated to Claude Code (on your laptop), Claude for Chrome (browser tasks), or me (artifacts in chat).

## Phase 0 — Foundations (Day 1, ~2h of your time, mostly batched)

**You (one sitting)**: credit card + phone in front of you, ~90 min.
- Approve account creations driven by Claude for Chrome (see `04-claude-for-chrome-prompts.md` §A).
- OAuth grants: Microsoft 365 (Layer 1), Google, Odoo, GitHub, Granola, Wispr Flow.

**Claude for Chrome does**:
- Sign up: Convex, Anthropic Console, Vercel, Voyage AI, Gemini API, OpenAI (Whisper), Wispr Flow Windows, Granola, Sentry.
- Generate API keys, paste into a 1Password (or text file) staging vault.
- Create GitHub repo `awish4u-jpg/aryaaos` (private, empty).
- Add CNAME on GoDaddy: `aryaaos` → `cname.vercel-dns.com`.
- Create OneDrive folder `Layer 1/AryaaOS/` with subfolders: `Files`, `Backups`, `Exports`.

**Claude Code (on your laptop)** — installed once, you give one command:
- `npx create-next-app@latest aryaaos --ts --tailwind --app --src-dir`
- Initialize Convex, Auth, Sentry from Day 1.
- Push first commit.

**Decision review (you, ~15 min)**:
- Approve schema v1 (file `02-convex-schema.ts`). Push back if anything looks wrong.

✅ **Phase 0 done when**: you log in at `aryaaos.casaaria.in` via Microsoft SSO and see "Welcome, Awish."

---

## Phase 1 — Thin slice + foundations (Days 2-4, ~2h/day)

The classy minimum: omnibox + inbox + one mode toggle.

### Day 2: Schema + auth + thin slice

- Convex schema deployed (v1 from `02-convex-schema.ts`).
- Microsoft SSO (Layer 1 tenant) live.
- One protected page `/app` with sidebar skeleton: Inbox / Layer 1 / Personal / Ideas / Modes switcher.
- **Backups Day 2**: nightly Convex export → OneDrive `AryaaOS/Backups/yyyy-mm-dd.json`.
- **Sentry Day 2**: errors flow to Sentry from first deploy.

### Day 3: Omnibox v0 — capture-only

- Floating bar (Cmd+K / Ctrl+K) opens omnibox.
- Text input → saves to Inbox as raw note. No classification yet.
- Mic button: triggers Whisper API recording → transcribes → fills input.
- Wispr Flow tested separately — confirm system-wide dictation works.

### Day 4: Pages + rich text

- BlockNote editor wired to Convex.
- Pages have: title, icon, parent (nullable), order, `org`, `private`, AI summary placeholder, embeddings field (empty for now).
- Slash commands: `/heading`, `/todo`, `/code`, `/image`, `/database`.
- Sidebar drag-to-reorder; right-click menu (rename, duplicate, delete, move).

✅ **Phase 1 done when**: you talk into the omnibox on your phone, the transcript lands in Inbox, and you can open a real page on desktop.

---

## Phase 2 — Omnibox classifier + databases (Days 5-9, ~2-3h/day)

The omnibox earns its keep.

### Day 5: Databases (table + kanban only — v1 cut)

- Notion-style typed databases. Fields: text, number, select, multi-select, date, person, relation, file, AI.
- Two views only: **table** + **kanban**. (Calendar/gallery/list deferred to post-launch.)
- Inline cell editing.
- Seed databases: Pipeline, Vendors, Clients, Tasks, Meetings, Ideas.

### Day 6: Omnibox classifier — the deep one

This is the big day. Spec in `03-omnibox-spec.md`.

- Background Convex action runs Claude (Sonnet 4.6) on every Inbox item.
- Claude has tools: `classify_to_pillar`, `link_to_proposal`, `link_to_client`, `link_to_vendor`, `create_task`, `create_subtask`, `delegate_to_teammate`, `schedule_followup`, `draft_email`, `update_odoo_record`, `generate_image`, `create_reminder`, `park_idea`.
- Output: a **proposed action card** stored in `omnibox_actions` table, status `pending`.
- UI surfaces cards in a "Review queue" panel (collapsed by default — non-intrusive).

### Day 7: Confirmation card UI + action tiers

- Card shows: input, Claude's interpretation, proposed actions (diff style), confidence.
- Three tiers wired:
  - **Silent** (auto-applied): tagging, filing, summarising, embedding.
  - **Card** (one-tap accept): create/update Odoo record, draft email, generate image.
  - **Hard confirm** (explicit Yes button + 3-sec delay): send email, delete, calls that cost money.
- **Bulk review** mode: process queue in batch.

### Day 8: Modes (Stage / Default / Solo)

- Top-bar mode switcher, persists per device.
- **Stage**: only the active project visible — for screen-sharing.
- **Default**: hides `private: true` records (financial, family, health).
- **Solo**: shows everything.
- Mode flag included in every Convex query — server-side filtering, not just CSS.

### Day 9: Search + linking

- Convex full-text search across pages, rows, blocks, inbox items, ideas.
- `@`-mention picker in any text field.
- Backlinks panel on every page.
- Embeddings populated in background (re-embed only on content-hash change).

✅ **Phase 2 done when**: voice into omnibox, Claude proposes an Odoo update + a delegated subtask + a follow-up reminder, you tap Accept, all three apply.

---

## Phase 3 — Layer 1 personalization + integrations (Days 10-16, ~3h/day)

### Day 10-11: Design system

- Apply Layer 1 design tokens (palette, typography, radii) to Tailwind config.
- Update shadcn components for Layer 1 brand.
- Light + dark mode in same palette logic.

### Day 12-13: Odoo integration (the work-side spine)

- Connector: read deals, contacts, vendors, products from Odoo via XML-RPC / REST.
- Mirror to Convex `clients`, `vendors`, `pipeline_deals`, `products` tables (read-only first).
- Two-way write: omnibox actions can create/update Odoo records via confirmation card.
- Webhook receiver: Odoo push → AryaaOS update.

### Day 14: Microsoft Graph integration (Layer 1 tenant)

- Outlook calendar pull → Meetings DB.
- Outlook drafts: `draft_email` tool writes to Drafts folder, you send from Outlook.
- OneDrive: file uploads in AryaaOS mirror to `Layer 1/AryaaOS/Files/`.
- SharePoint: read-only project folder mirror (no two-way sync in v1).

### Day 15: Google + Granola

- Google Calendar pull (personal) → Meetings DB.
- Calendar reconciliation: dedupe events that appear in both Outlook and Google.
- Granola sync: meeting notes auto-flow into Meetings DB. Action items extracted into Tasks.

### Day 16: Templates + dashboard

- Templates: project tracker, vendor record, meeting note, proposal kickoff, pipeline deal, **idea card** (with status: active/parked/untouched + "build on it" button).
- Custom dashboard:
  - Active pipeline deals (Layer 1)
  - Active projects with status
  - Today's calendar (reconciled)
  - Inbox count + 1-tap "review queue"
  - Daily flow widget (8am brief / 2pm nudge / 9pm review)
  - Mode switcher
  - Recent pages

✅ **Phase 3 done when**: you open AryaaOS in the morning and the dashboard shows you the right things without you searching for them.

---

## Phase 4 — AI agents + Nano Banana (Days 17-22, ~3h/day)

### Day 17: Claude in the gutter

- Right-side collapsible chat panel on every page.
- Page content auto-included in context.
- Per-page chat history.
- Slash commands inside: `/summarise`, `/find-action-items`, `/draft-email`, `/generate-boq-row`.

### Day 18-19: Custom agents

Five system-prompt-defined agents, all callable from the page-level chat panel:

1. **ProposalAgent** — loads Layer 1 proposal-builder skill, reads Vendor DB, Pipeline DB, prior proposals.
2. **VendorAgent** — knows your vendor preferences and pricing patterns; can search via Firecrawl for live datasheets.
3. **MeetingAgent** — processes Granola transcripts; extracts action items; links to projects; drafts follow-ups.
4. **PipelineAgent** — analyses Odoo pipeline; suggests next actions; drafts updates.
5. **PersonalAgent** — knows family context, health, sports interests, weekly schedule. **Only available in Solo mode.**

Each appears as a selector in the chat panel.

### Day 20: Nano Banana / Gemini image gen

- Image generation tool wired to omnibox + agents.
- Five use cases:
  - Proposal hero/cover images
  - Vendor mood boards
  - Personal creative scratchpad
  - Social/post drafts
  - **Presentation slide images** (sized for 16:9, transparent BG option)
- Generated images stored in Convex file storage + mirrored to OneDrive.

### Day 21: ADHD daily flow

- **8am brief** (UI card on dashboard): today's calendar + top 3 inbox items + 1 follow-up that's slipping.
- **2pm nudge** (UI banner): "Important tasks you haven't moved today: [list]." Dismissible.
- **9pm review** (UI card): "Inbox at X items. Anything to capture?"
- **Focus mode**: single-task view + Pomodoro. Opt-in only.
- **No streaks, no red badges, no email.** UI nudges only.

### Day 22: Skills loader

- Convex cron pulls skills from a private skills repo nightly (you can populate later).
- Agents auto-load relevant skills based on context.

✅ **Phase 4 done when**: you draft a real proposal section using ProposalAgent, generate the cover with Nano Banana, and attach a Granola meeting transcript — all from inside AryaaOS.

---

## Phase 5 — Mobile + polish (Days 23-28, ~2h/day)

### Day 23: PWA

- Manifest + service worker (was scaffolded Day 2; now polished).
- iOS home-screen install tested.
- Offline read; queued writes.

### Day 24: Mobile omnibox

- Quick-capture mode: minimal page editor with voice input prominent.
- Triggered from PWA shortcut.

### Day 25: Reminders engine

- Natural language → reminder via omnibox ("remind me Thursday to follow up with Zydus").
- UI nudges only (no email).
- Surfaces in dashboard + as a notification card when due.

### Day 26: Cmd+K command bar

- Global command bar — actions, navigation, search, omnibox.
- Single keyboard shortcut for everything.

### Day 27: Monitoring + cost guards

- Sentry alerts for errors above threshold.
- UptimeRobot ping on `aryaaos.casaaria.in`.
- Per-day Anthropic spend logging in Convex; hard cap at $10/day, $200/month.
- Per-day Gemini spend logging; cap at $5/day.

### Day 28: Polish + admin docs

- README with admin tasks (rotate keys, restore backup, mode defaults).
- Final UX sweep: loading states, empty states, error states.
- One-week shadow period: use AryaaOS daily, log friction in a `Friction Log` page.

✅ **Phase 5 done when**: you've used AryaaOS for one full week as default workspace. Notion/SharePoint usage drops noticeably.

---

## Beyond week 4 — backlog (priority order)

- Two-way SharePoint sync (after one-way proves itself)
- Calendar/gallery/list views on databases
- Custom blocks: BoQ table, vendor card, gantt
- Native mobile app via Capacitor
- Camera capture: receipts, business cards, document scan
- Family read-only views (PIN-protected)
- AI workflow recorder (watches you work, learns patterns)

---

## Cost estimate (revised, monthly after launch)

| Service | Cost | Notes |
|---|---|---|
| Convex (paid tier) | $25-50 | Hits paid tier in Phase 2, not week 3 |
| Anthropic API | $50-150 | Sonnet for drafting, Haiku for tagging/classifying — 3-5x cheaper than all-Sonnet |
| Gemini API (Nano Banana) | $5-20 | Per-image cost low |
| Vercel | $0 | Free tier covers personal |
| Voyage AI embeddings | $5-15 | Debounced re-embed on content-hash change |
| Wispr Flow | $12-15 | Subscription |
| Granola | $14-18 | Subscription |
| OpenAI (Whisper fallback) | $5-10 | Mobile-only, low volume |
| Sentry | $0 | Free tier |
| GoDaddy domain | already owned | — |
| **Total** | **~$110-280/mo** | After year one, you've broken even on Notion + ad-hoc tooling |

## Hard caps to set Day 1

- **Anthropic**: $200/mo cap on console; $10/day soft cap in code.
- **Gemini**: $50/mo cap; $5/day soft cap.
- **Convex**: alert at 80% of paid-tier limits.
