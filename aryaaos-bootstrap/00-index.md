# AryaaOS — bootstrap pack

Five artifacts. Read in order on Day 0; reference daily after that.

| # | File | What it is |
|---|---|---|
| 1 | `01-roadmap.md` | Revised 4-week build plan, ADHD-tuned, omnibox-centric |
| 2 | `02-convex-schema.ts` | Convex schema **v2** — paste into `convex/schema.ts` of the new repo |
| 3 | `03-omnibox-spec.md` | The floating omnibox: UI, voice, Claude routing, classifier, confirmation cards |
| 4 | `04-claude-for-chrome-prompts.md` | Copy-paste prompt pack for Claude for Chrome — drives ~70% of the manual setup |
| 5 | `05-execution-plan.md` | Day-by-day plan with explicit "you / CfC / Claude Code / chat" ownership |
| 6 | `06-pulse-spec.md` | Pulse: mood-aware quote engine, explicit-only learning |
| 7 | `07-smart-inbox-spec.md` | Outlook smart inbox + VIP list + auto-resurface |
| 8 | `08-coach-pattern.md` | Coach: graduated autonomy via conversation (the architecture) |
| 9 | `09-wireframes-v2.md` | All locked screen layouts (Default / Stage / Solo + Pulse + Coach + mobile) |
| 10 | `10-day1-quickstart.md` | Minute-by-minute first 3 hours of Day 1 |
| 11 | `11-final-stack.md` | Master reference of every service AryaaOS depends on |
| 12 | `12-cost-optimization.md` | Implementation guide for ~50% cost reduction (prompt cache + Haiku routing + batch API + heuristics + content-hash dedup) |

## Locked decisions (reference)

- **Domain**: `aryaaos.casaaria.in` (DNS on GoDaddy — CNAME only, no NS move)
- **Repo**: `awish4u-jpg/aryaaos` (private)
- **Stack**: Next.js 15 + Convex + Anthropic SDK + Vercel hosting
- **Scope**: Layer 1 + Personal (Avenir cut)
- **Voice**: Wispr Flow (Windows) primary + in-app Whisper API fallback
- **Meeting AI**: Granola (online + offline, no bot)
- **CRM**: Odoo (API key ready)
- **Image gen**: Gemini 2.5 / Nano Banana
- **Cloud files**: OneDrive / Layer 1 M365 → AryaaOS folder
- **Pillars**: Health, Family, Finance, Goals, Reading, Sports, Travel, **Ideas**, Inbox
- **Modes**: Stage / Default / Solo
- **Daily flow**: 8am brief, 2pm nudge, 9pm review (UI nudges only)
- **Auth**: Microsoft SSO (Layer 1 tenant)
- **Cut**: WhatsApp/Telegram, two-way SP sync (read-only first), email reminders, Fireflies, Avenir, personal Gmail

## v2 additions (this push)

- **Smart inbox** (Outlook only) — Needs You widget with urgent/important/dismiss/draft per email; auto-resurface on re-email; VIP list auto-seeded by Coach.
- **Pulse** — mood-aware quote engine on every app open; explicit-only learning (no-feedback ≠ dislike); like/dislike/another; Sanskrit + Hindi with English translation; visible in Stage but no actions.
- **Coach pattern** — conversational layer above all decisions. Trust scores per category, graduated autonomy (ask → card → silent → invisible), persistent memory, 9pm digest.
- **Mobile** — Pulse box on home, ribbon at top of every other screen (tap to expand).
