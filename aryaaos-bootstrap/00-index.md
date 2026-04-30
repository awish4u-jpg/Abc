# AryaaOS — bootstrap pack

Five artifacts. Read in order on Day 0; reference daily after that.

| # | File | What it is |
|---|---|---|
| 1 | `01-roadmap.md` | Revised 4-week build plan, ADHD-tuned, omnibox-centric |
| 2 | `02-convex-schema.ts` | Convex schema v1 — paste into `convex/schema.ts` of the new repo |
| 3 | `03-omnibox-spec.md` | The floating omnibox: UI, voice, Claude routing, classifier, confirmation cards |
| 4 | `04-claude-for-chrome-prompts.md` | Copy-paste prompt pack for Claude for Chrome — drives ~70% of the manual setup |
| 5 | `05-execution-plan.md` | Day-by-day plan with explicit "you / CfC / Claude Code / chat" ownership |

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
- **Cut**: WhatsApp/Telegram, two-way SP sync (read-only first), email reminders, Fireflies, Avenir
