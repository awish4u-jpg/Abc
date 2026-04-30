# Day-by-day execution plan

Owner column legend:
- **You** — only you can do this. Phone, card, decisions, OAuth click-throughs.
- **CfC** — Claude for Chrome (drives the browser; you sit nearby)
- **CC** — Claude Code on your laptop (writes/runs code locally)
- **Me** — produced as artifacts in this chat (you paste into CC or CfC)

## Pre-Day-1 (do this evening, ~30 min)

| Task | Owner | Time |
|---|---|---|
| Install Claude Code on laptop. One terminal command. | You | 10 min |
| Confirm Wispr Flow Windows availability (visit wisprflow.ai) | You | 2 min |
| Confirm Odoo URL + DB + API key are ready and saved | You | 5 min |
| Create staging secrets note (1Password secure note) | You | 3 min |
| Read `00-index.md` and `01-roadmap.md`, push back on anything | You | 15 min |

If Wispr Windows is not available → tell me, we switch to Aqua Voice.

---

## Day 1 — Foundations (~3h of your time)

### Morning batch (~90 min)
| # | Task | Owner |
|---|---|---|
| 1 | Run prompts §A1-A10 in `04-claude-for-chrome-prompts.md` (account creation) | CfC + you for SMS |
| 2 | Run prompt §B1 (GoDaddy CNAME) | CfC + you to authenticate |
| 3 | Run prompts §C1-C4 (OAuth + Odoo + GitHub PAT) | CfC + you for OAuth approvals |

### Midday review (~30 min)
| # | Task | Owner |
|---|---|---|
| 4 | Read schema (`02-convex-schema.ts`). Push back on anything unclear. | You |
| 5 | Approve schema or request changes | You |

### Afternoon (~60 min)
| # | Task | Owner |
|---|---|---|
| 6 | Run prompts §D1-D4 (bulk-load secrets, OneDrive folder, Claude Project) | CfC |
| 7 | Open Claude Code. One command: `npx create-next-app@latest aryaaos --ts --tailwind --app --src-dir`. Tell CC to follow Day 2 of `01-roadmap.md`. | You + CC |
| 8 | CC scaffolds repo, initializes Convex, pastes schema, deploys to Vercel. | CC |
| 9 | Run §E1 smoke test. | CfC |

✅ End of Day 1: `aryaaos.casaaria.in` loads over HTTPS, you can sign in via Microsoft SSO, you see "Welcome, Awish."

---

## Day 2 — Schema + auth + first deploy (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes Microsoft SSO via NextAuth + Convex Auth adapter. | CC |
| 2 | CC writes `convex/cron.ts` for nightly OneDrive backup job. | CC |
| 3 | CC wires Sentry for both client + server. | CC |
| 4 | You test SSO from phone (PWA install attempt). | You |
| 5 | CC writes scaffolding for sidebar with Inbox / Layer 1 / Personal / Ideas / mode switcher. | CC |
| 6 | You check the dashboard renders on phone + desktop. Note friction. | You |

---

## Day 3 — Omnibox v0 (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC builds the floating omnibox UI per `03-omnibox-spec.md` §UI. | CC |
| 2 | CC wires text submit → `inboxItems` insert. | CC |
| 3 | CC adds Whisper API mic button (in-app fallback). | CC |
| 4 | You install Wispr Flow, test system-wide dictation in any text field. | You |
| 5 | You hit Ctrl+K, dictate via Wispr or in-app, hit enter, see item in Inbox. | You |

---

## Day 4 — Pages + rich text (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC installs BlockNote, wires to Convex `pages`. | CC |
| 2 | CC implements sidebar drag-to-reorder + right-click menu. | CC |
| 3 | CC adds slash commands: heading, todo, code, image, database. | CC |
| 4 | You create a real "Zydus humidity upgrade" page as a smoke test. | You |

✅ Phase 1 done.

---

## Day 5 — Databases (table + kanban) (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC builds typed-field DB editor. | CC |
| 2 | CC builds table view with inline cell editing. | CC |
| 3 | CC builds kanban view with drag-between-columns. | CC |
| 4 | CC seeds 6 databases: Pipeline, Vendors, Clients, Tasks, Meetings, Ideas. | CC |
| 5 | You add 3 real pipeline rows, 3 real client rows. | You |

---

## Day 6 — Omnibox classifier (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes `convex/omnibox/classify.ts` action calling Claude. | CC |
| 2 | CC writes the tool-use schema from `03-omnibox-spec.md`. | CC |
| 3 | CC writes the context-snapshot builder (recent pages, deals, etc.). | CC |
| 4 | CC implements Haiku-vs-Sonnet routing rule. | CC |
| 5 | You test 5 real inputs (mix of work, personal, ambiguous). | You |
| 6 | You provide feedback on classification quality. | You |
| 7 | Me — adjust classifier system prompt based on your feedback. | Me (in chat) |

---

## Day 7 — Confirmation cards + tiers (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC builds Review Queue panel. | CC |
| 2 | CC builds confirmation card component. | CC |
| 3 | CC implements tier mapping table from spec. | CC |
| 4 | CC implements 3-second hold gate for hard-confirm. | CC |
| 5 | CC implements Edit / Reject flows. | CC |
| 6 | You run 10 real omnibox inputs end-to-end. Note friction. | You |

---

## Day 8 — Modes (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC adds mode switcher to top bar. | CC |
| 2 | CC adds mode field to user record. | CC |
| 3 | CC adds mode-aware filters in every Convex query (server-side). | CC |
| 4 | CC adds Stage mode "active project picker" UI. | CC |
| 5 | You stress-test: can you screen-share without leaking financial/personal? | You |

---

## Day 9 — Search + linking (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC enables Convex full-text search on pages, rows, blocks, ideas. | CC |
| 2 | CC adds `@`-mention picker. | CC |
| 3 | CC adds backlinks panel. | CC |
| 4 | CC writes embedding generation cron (Voyage). | CC |
| 5 | You run a real search across a week of input. | You |

✅ Phase 2 done.

---

## Day 10-11 — Design system (~5h)

| # | Task | Owner |
|---|---|---|
| 1 | Me — produce Tailwind tokens for Layer 1 brand (palette, typography, radii). | Me |
| 2 | CC applies tokens to Tailwind config. | CC |
| 3 | CC updates shadcn/ui components for Layer 1 brand. | CC |
| 4 | CC implements light + dark mode in same palette. | CC |
| 5 | You eyeball every page; note anything off. | You |

---

## Day 12-13 — Odoo integration (~6h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes Odoo XML-RPC client in `convex/integrations/odoo.ts`. | CC |
| 2 | CC writes initial sync action: pull deals, contacts, vendors, products. | CC |
| 3 | CC mirrors to Convex `clients`, `vendors`, `pipelineDeals`. | CC |
| 4 | CC enables omnibox tools: `update_odoo_record`, `create_odoo_record`. | CC |
| 5 | CC writes Odoo webhook receiver (if Odoo supports outgoing webhooks; otherwise periodic poll). | CC |
| 6 | You verify a deal stage change in omnibox flows back to Odoo. | You |
| 7 | CfC — find Odoo record IDs for top 10 clients (run §R3). | CfC |

---

## Day 14 — Microsoft Graph (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes Graph client in `convex/integrations/microsoft.ts`. | CC |
| 2 | CC pulls Outlook calendar → `meetings` table. | CC |
| 3 | CC implements `draft_email` tool: writes to Outlook Drafts via Graph. | CC |
| 4 | CC mirrors uploaded files to OneDrive `Layer 1/AryaaOS/Files/`. | CC |
| 5 | CC reads Layer 1 SharePoint project folders (read-only). | CC |
| 6 | You verify a draft email appears in Outlook on your phone. | You |

---

## Day 15 — Google + Granola (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC adds Google Calendar pull. | CC |
| 2 | CC writes calendar reconciliation (dedup by `externalId`, prefer Outlook for Layer 1). | CC |
| 3 | CC integrates Granola — depending on what CfC found in §A9: API / webhook / Notion export polling. | CC |
| 4 | CC writes MeetingAgent action-item extractor. | CC |
| 5 | You hold one real meeting with Granola running, confirm transcript + action items flow into AryaaOS. | You |

---

## Day 16 — Templates + dashboard (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC builds template system + seeds 6 templates (project, vendor, meeting, proposal, deal, **idea**). | CC |
| 2 | CC builds the home dashboard with 6 widgets per `01-roadmap.md` Day 16. | CC |
| 3 | You use the dashboard for one full day, log friction. | You |

✅ Phase 3 done.

---

## Day 17 — Claude in the gutter (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC builds right-side collapsible chat panel. | CC |
| 2 | CC includes page content as context. | CC |
| 3 | CC stores per-page chat history. | CC |
| 4 | CC adds in-chat slash commands. | CC |

---

## Day 18-19 — Custom agents (~5h)

| # | Task | Owner |
|---|---|---|
| 1 | Me — draft system prompts for 5 agents (Proposal, Vendor, Meeting, Pipeline, Personal). | Me |
| 2 | CC creates agent registry + selector in chat panel. | CC |
| 3 | CC wires PersonalAgent gating (Solo mode only). | CC |
| 4 | You test each agent on a real task. | You |
| 5 | Me — refine prompts based on output quality. | Me |

---

## Day 20 — Nano Banana / Gemini (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes Gemini client in `convex/integrations/gemini.ts`. | CC |
| 2 | CC enables `generate_image` omnibox tool. | CC |
| 3 | CC builds image picker UI per use case. | CC |
| 4 | CC stores generated images in Convex storage + mirrors to OneDrive. | CC |
| 5 | You generate one cover for a real proposal, one slide image, one moodboard. | You |

---

## Day 21 — Daily flow (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes 8am brief generator (Convex cron). | CC |
| 2 | CC writes 2pm "not moved" nudge (looks at `tasks.lastMovedAt`). | CC |
| 3 | CC writes 9pm review prompt. | CC |
| 4 | CC builds Focus mode + Pomodoro. | CC |
| 5 | You live one day with the flow. Adjust nudge thresholds. | You |

---

## Day 22 — Skills loader (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes Convex cron pulling from a skills repo (you populate later). | CC |
| 2 | CC adds skill auto-loading to agents based on context. | CC |

✅ Phase 4 done.

---

## Day 23-26 — Mobile + reminders + cmd-K (~8h spread)

| # | Task | Owner |
|---|---|---|
| 1 | CC polishes PWA (manifest, SW, offline read, queued writes). | CC |
| 2 | You install AryaaOS to iPhone home screen, test offline. | You |
| 3 | CC builds mobile quick-capture mode. | CC |
| 4 | CC writes reminders engine + UI nudges. | CC |
| 5 | CC builds global Cmd+K command bar. | CC |

---

## Day 27 — Monitoring + cost guards (~2h)

| # | Task | Owner |
|---|---|---|
| 1 | CC sets Sentry alert thresholds. | CC |
| 2 | CC adds UptimeRobot ping. | CC |
| 3 | CC implements per-day Anthropic spend cap ($10/day, downgrades to Haiku). | CC |
| 4 | CC implements per-day Gemini spend cap ($5/day). | CC |

---

## Day 28 — Polish + admin docs (~3h)

| # | Task | Owner |
|---|---|---|
| 1 | CC writes admin README (rotate keys, restore backup, mode defaults). | CC |
| 2 | CC sweeps loading states, empty states, error states. | CC |
| 3 | You start using AryaaOS as your default workspace. | You |
| 4 | You log friction in a `Friction Log` page for one week. | You |

✅ Phase 5 done. AryaaOS is live.

---

## Honest summary of *your* active time

| Phase | Days | Your time | What you actually do |
|---|---|---|---|
| Pre-Day-1 + Day 1 | 1 | 3h | Account batch, OAuth, schema review, smoke test |
| Phase 1 | 2-4 | 6h | Test omnibox, create real pages, push back on UX |
| Phase 2 | 5-9 | 12h | Real-data smoke tests, classification feedback, mode stress test |
| Phase 3 | 10-16 | 14h | Design eyeball, Odoo verification, Granola live test, dashboard live use |
| Phase 4 | 17-22 | 12h | Agent task tests, image gen tests, daily flow live test |
| Phase 5 | 23-28 | 10h | Mobile testing, friction log, default-workspace transition |
| **Total** | 28 | **~57h** | Spread over 4 weeks = ~2h/day average |

If you skip Phase 5 polish and ship rough at Day 22: ~45h.

---

## What I (chat-Claude) need from you to start Day 1

Just two things:
1. **Confirm**: "Start Phase 0 prompt-pack tomorrow."
2. **Tell me when Wispr Flow Windows availability is confirmed** (or say "switch to Aqua Voice").

Once you say go, I'll produce the additional artifacts as you need them on the day:
- Day 5: database seed data tailored to your real Layer 1 clients
- Day 10: Layer 1 design tokens (palette + typography spec)
- Day 12: Odoo data model mapping (your actual fields → schema fields)
- Day 18: 5 agent system prompts
- Day 21: nudge prompt copy ("classy, not naggy")
- Day 28: admin README

Each is small, ~30 min in chat, delivered when needed — not all upfront.
