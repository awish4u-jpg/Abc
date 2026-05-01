# AryaaOS — final stack reference

The complete list of everything AryaaOS depends on. This is the authoritative reference. Bookmark it.

## Status legend

- ✅ Already owned / paid
- 🟢 Day 1 setup (in motion now)
- 🔵 Setup later in build (Day 14+)
- ⚪ Optional, add only if you feel the need
- ❌ Explicitly skipped (decision-fatigue hygiene)

---

## Tier 1 — Mandatory core (can't function without)

| # | Service | Status | Monthly cost | Purpose |
|---|---|---|---|---|
| 1 | **GitHub** | ✅ owned | $0 (private repos free) | Code repo `awish4u-jpg/aryaaos` |
| 2 | **Convex** | 🟢 Day 1 | $0 → $25-50 from Phase 2 | DB, auth, vector, file storage, cron, server actions |
| 3 | **Vercel** | 🟢 Day 1 | $0 (free tier) | Next.js hosting + preview deploys |
| 4 | **Anthropic API** | 🟢 Day 1 | $50-150 (cap: $200) | Claude — Coach, classifier, agents, Pulse |
| 5 | **Microsoft 365** | ✅ owned (Layer 1) | already paid | SSO, Outlook mail, Calendar, OneDrive, SharePoint |
| 6 | **Odoo** | ✅ owned | already paid | CRM (deals, contacts, vendors, products) |
| 7 | **GoDaddy** | ✅ owned | already paid | DNS for `casaaria.in` (CNAME `aryaaos`) |

## Tier 2 — Mandatory for designed feature set

| # | Service | Status | Monthly cost | Purpose |
|---|---|---|---|---|
| 8 | **Voyage AI** | 🟢 Day 1 | $5-15 | Embeddings — semantic memory, Pulse mood-match, similar-page |
| 9 | **OpenAI** | 🟢 Day 1 | $5-10 (cap: $20) | Whisper API — mobile voice + Wispr fallback only (not GPT) |
| 10 | **Google Gemini API** | 🟢 Day 1 | $5-20 (cap: $50) | Nano Banana image generation (5 use cases) |
| 11 | **Sentry** | 🟢 Day 1 | $0 (free tier) | Error tracking from Day 2 |
| 12 | **Wispr Flow** | 🟢 Day 1 | $12-15 | Windows system-wide dictation (verify Windows availability first) |
| 13 | **Granola** | 🟢 Day 1 | $14-18 | Meeting AI (online + offline, no bot in meetings) |

## Tier 3 — Recommended, free or near-free

| # | Item | Status | Monthly cost | Purpose |
|---|---|---|---|---|
| 14 | **1Password / Bitwarden** | ⚪ pick one | $0-3 | Secrets staging note + ongoing credential vault |
| 15 | **UptimeRobot** | ⚪ Day 27 | $0 (free tier) | Uptime monitoring on `aryaaos.casaaria.in` |
| 16 | **GitHub Dependabot** | 🟢 Day 1 | $0 (built-in) | Auto-PR for dependency security updates — flip on in repo settings |
| 17 | **GitHub secret scanning** | 🟢 Day 1 | $0 (built-in) | Catches leaked API keys — flip on in repo settings |
| 18 | **GitHub 2FA** | 🟢 Day 1 | $0 | Account hardening — must enable |

## Tier 4 — Local software (your laptop)

| # | Item | Status | Cost | Purpose |
|---|---|---|---|---|
| 19 | **Node 20+** | 🟢 Day 1 | $0 | Runtime |
| 20 | **Bun** | 🟢 Day 1 | $0 | Faster package manager + runtime |
| 21 | **Claude Code** | 🟢 Day 1 | included with Anthropic | Local AI dev environment |
| 22 | **Git** | ✅ likely already | $0 | Version control |
| 23 | **Claude for Chrome extension** | ✅ already use | included | Drives the manual setup work |
| 24 | **VS Code or Cursor** | ⚪ optional | $0 | Editor (Claude Code works in any) |

## Tier 5 — Mobile

| # | Item | Status | Cost | Purpose |
|---|---|---|---|---|
| 25 | **AryaaOS PWA** | 🔵 Day 23 | $0 | Install to iPhone/Android home screen |
| 26 | **Granola mobile** | ⚪ optional | included | If you want meeting capture on mobile |

## Tier 6 — Optional, add only if you feel the need

| # | Service | When to add | Cost | Purpose |
|---|---|---|---|---|
| 27 | **Helicone** | Day 28 polish if curious | $0 (free tier) | AI call observability dashboard — "why did Coach decide that?" |
| 28 | **n8n self-host** | Post-launch | $5-10 if hosted | Workflow automation outside AryaaOS — optional, Convex actions cover most cases |

---

## Tier 7 — Explicitly NOT adding (decision hygiene)

Every item below was considered and rejected. Don't second-guess. Re-evaluate only after using AryaaOS for 3 months.

| ❌ Service | Why skipped |
|---|---|
| **Personal Gmail integration** | Locked: Outlook only |
| **WhatsApp / Telegram capture** | Locked: not needed |
| **Fireflies** | Replaced by Granola |
| **GitHub Copilot** | Claude Code covers it |
| **CodeRabbit / Codiumate / Greptile** | Duplicate of Claude review |
| **Pinecone / Weaviate / Qdrant** | Convex vector indexes scale fine for 1 user |
| **Mem0 / Letta / Zep** | Our `coachMemory` + structured tables do the same job |
| **LangSmith / Braintrust** | Overkill for one user; `apiUsage` table covers cost tracking |
| **Cursor / Windsurf / Cline** | Claude Code is locked, don't fork mid-build |
| **Cloudflare** | Domain on GoDaddy, no need to migrate |
| **Resend / Postmark** | No email reminders, no magic-link auth (using Microsoft SSO) |
| **PostHog / Mixpanel** | One user, no analytics need |
| **Stripe** | Personal use, no payments |
| **Algolia / MeiliSearch** | Convex full-text search is enough |
| **Avenir M365 tenant** | Locked: Layer 1 + Personal only |
| **Snyk paid app** | Dependabot covers free use case |
| **WhatProblem AI (or any unknown GitHub app)** | Reduce blast radius for sensitive data |

---

## Cost summary

| Tier | Lower | Realistic | Upper |
|---|---|---|---|
| Tier 1 (mandatory core) | $50 | $90 | $200 |
| Tier 2 (designed features) | $41 | $80 | $128 |
| Tier 3 (recommended) | $0 | $3 | $5 |
| Tier 6 (optional, when added) | $0 | $0 | $10 |
| **Monthly total** | **~$91** | **~$173** | **~$343** |

Realistic ongoing: **~$170-200/mo**. After year one: ~$2k. For comparison: Notion Team ($10) + automation overhead + the "I can't customise this" tax of every off-the-shelf workspace.

You're building a chief-of-staff. $200/mo is the salary line item — except this one gets smarter every week and never quits.

---

## Hard caps to set on Day 1 (already in CfC prompts)

| Provider | Cap | Where set |
|---|---|---|
| Anthropic | $200/mo, $10/day notification | Anthropic Console → Limits |
| OpenAI | $20/mo hard limit | OpenAI Platform → Limits |
| Gemini | $50/mo budget alert | Google Cloud Console → Billing |
| Voyage | $30/mo if available | Voyage Dashboard |
| Convex | Alert at 80% of paid-tier limit | Convex Dashboard → Billing |

In code: per-day soft caps (Day 27 of execution plan). When hit, omnibox auto-downgrades to Haiku-only and image gen pauses with a banner.

---

## What you can ignore until later

- Skills marketplace (`layer1tech/layer1-skills`) — Phase 4
- Pulse seed library (300 quotes) — Day 22
- Coach memory editing UI — Day 28
- Native iOS app via Capacitor — post-launch
- Family read-only views — post-launch
- Two-way SharePoint sync — post-launch

## Re-evaluate after 3 months

- Add Helicone if you find yourself wanting better Coach audit trails
- Add n8n if AryaaOS-internal automation feels limiting
- Cancel Voyage if Convex ships their own embeddings (likely)
- Cancel Granola if you stop using it (be honest)
- Add specialized eval platform if you want to systematically tune Coach prompts

## Cancel-discipline rule

Every quarter, audit all Tier 2-6 subscriptions. Cancel anything you haven't actively used in 30 days. Add back when you actually need it. Subscription bloat is decision drag — and decision drag is your enemy.
