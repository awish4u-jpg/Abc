# Day 1 — minute-by-minute quickstart

The literal first 3 hours. Open this file in one tab, Claude for Chrome in another, your password manager in a third.

## Before you start (right now, ~10 min)

- [ ] Have credit card visible
- [ ] Phone unlocked, near you
- [ ] Email tab open at `awish@layer1.tech` (Outlook web)
- [ ] Password manager open (1Password / Bitwarden / browser saved)
- [ ] Create empty 1Password secure note titled **"AryaaOS secrets"** — Claude for Chrome will paste keys into this as it goes
- [ ] Open Claude for Chrome (claude.ai/chrome extension active)

## Hour 1 — accounts batch 1 (~50 min)

Run these in Claude for Chrome, one at a time. After each completes, CfC tells you "done" and you paste the next one.

### Block 1A — GitHub repo (3 min)
Paste prompt **§A1** from `04-claude-for-chrome-prompts.md`.
- You'll need: GitHub login (already in browser).
- Output: empty private repo `awish4u-jpg/aryaaos`.

### Block 1B — Convex (5 min)
Paste prompt **§A2**.
- You'll need: GitHub OAuth approval click.
- Output: Convex project, deploy key, project URL into staging note.

### Block 1C — Anthropic Console (10 min)
Paste prompt **§A3** but **change the monthly cap to $100/mo** and **daily notification to $5/day** (cost optimizations land us at $20-50/mo realistic spend; cap at 2x that).
- You'll need: phone for SMS verification, credit card for payment method.
- Output: API key, $100/mo cap set, $5/day notification set.

### Block 1D — Vercel (5 min)
Paste prompt **§A4**.
- You'll need: GitHub OAuth approval.
- Output: Vercel project, CNAME target value into staging note.

### Block 1E — ~~Voyage AI~~ SKIPPED (cost optimization)
**Skip this block entirely.** We're using OpenAI text-embedding-3-small instead of Voyage — 3x cheaper, same effective quality, no extra vendor. See `12-cost-optimization.md`.

### Block 1F — Google AI Studio (Gemini) (8 min)
Paste prompt **§A6** but **change the budget alert to $10/mo** (not $50). Cost optimization tactics (free tier first + image cache + right-size resolution) keep usage low.
- You'll need: Google account login, billing budget setup.

### Block 1G — OpenAI (5 min)
Paste prompt **§A7** but **change the hard limit to $30/mo** (not $20). This account now covers BOTH Whisper transcription AND text-embedding-3-small for AryaaOS.
- You'll need: credit card, $30/mo hard limit.

### Block 1H — Wispr Flow (5 min)
Paste prompt **§A8**.
- **First action**: have CfC verify Windows is supported on `wisprflow.ai`.
- If yes: download installer (you install separately later this hour).
- If no: stop. Reply to me in chat: "Wispr is Mac-only" — we switch to Aqua Voice.

## Hour 2 — accounts batch 2 + DNS (~50 min)

### Block 2A — Granola (10 min)
Paste prompt **§A9**.
- You'll need: credit card, calendar OAuth approvals.
- Output: API or webhook details into staging note (or note "no public API").

### Block 2B — Sentry (3 min)
Paste prompt **§A10**.
- Output: DSN into staging note.

### Block 2C — DNS (5 min, then 15-30 min wait)
Paste prompt **§B1** — adds CNAME at GoDaddy.
- Don't wait for propagation. Move on. Verify at the end of Hour 3.

### Block 2D — Microsoft Graph app registration (12 min)
Paste prompt **§C1**.
- You'll need: Azure portal access as admin.
- Output: client ID, tenant ID, client secret, admin consent granted.

### Block 2E — Google OAuth (8 min)
Paste prompt **§C2**.
- Output: Google client ID and secret.

### Block 2F — Odoo API key check (3 min)
Paste prompt **§C3**.
- You confirm you have URL, DB, user, key — or generate the key now.

### Block 2G — GitHub PAT (5 min)
Paste prompt **§C4**.
- Output: fine-grained token into staging note.

## Hour 3 — bulk-load + verify (~50 min)

### Block 3A — Convex env vars (10 min)
Paste prompt **§D1**.
- CfC pastes ~14 env vars from staging into Convex dashboard.

### Block 3B — Vercel env vars (10 min)
Paste prompt **§D2**.
- CfC pastes ~10 env vars into Vercel.
- One thing CfC asks you: open a terminal, run `openssl rand -base64 32`, paste the output back as `NEXTAUTH_SECRET`.

### Block 3C — OneDrive folders (3 min)
Paste prompt **§D3**.
- Creates `Layer 1/AryaaOS/` with `Files`, `Backups`, `Exports`, `Generated Images`.

### Block 3D — Claude.ai Project (5 min)
Paste prompt **§D4**.
- Creates "AryaaOS" project at claude.ai. CfC uploads bootstrap files as references.

### Block 3E — Wispr Flow install (10 min, you do this)
- Run the installer you downloaded in Block 1H.
- Set hotkey to Caps Lock (single-tap to toggle).
- Test in any text field.

### Block 3F — Local Claude Code setup (10 min, you do this)
On your Windows laptop, in PowerShell or terminal:

```bash
# 1. Install Bun if not already (faster than npm)
powershell -c "irm bun.sh/install.ps1 | iex"

# 2. Verify Node 20+
node -v

# 3. Install Claude Code
# (latest install command at code.claude.com/docs)

# 4. Clone the empty repo
git clone https://github.com/awish4u-jpg/aryaaos.git
cd aryaaos
```

Open Claude Code in the `aryaaos` folder.

### Block 3G — Hand off to Claude Code

In Claude Code, paste this single message:

```
Read the bootstrap pack at https://github.com/awish4u-jpg/Abc/tree/claude/l1os-workspace-build-aAFPi/aryaaos-bootstrap

Then execute Day 2 of `05-execution-plan.md`:

1. Initialize Next.js 15 + TS + Tailwind + App Router
2. Install Convex, NextAuth, Sentry, BlockNote, Voyage SDK,
   Anthropic SDK, Microsoft Graph SDK, googleapis, shadcn/ui
3. Paste `02-convex-schema.ts` into convex/schema.ts and deploy
4. Wire Microsoft SSO via NextAuth + Convex Auth adapter
5. Wire Sentry from first deploy
6. Build the sidebar skeleton per `09-wireframes-v2.md`
7. Build the protected `/app` route showing "Welcome, Awish"
8. Push to main
9. Trigger Vercel deploy
10. Tell me when aryaaos.casaaria.in resolves and SSO works

Use the Convex deploy key from the env vars I've already set in Vercel.
```

Claude Code will run for ~30-60 min, asking permission for each shell command. Approve them. Step away if you want — it works while you're away.

### Block 3H — Smoke test (5 min)
After Claude Code says it's deployed:

Paste prompt **§E1** in Claude for Chrome.
- Verifies HTTPS, Convex, SSO, omnibox stub, Sentry.
- Reports green/yellow/red on each.

If anything's red: tell me here in chat. I'll diagnose.

## ✅ Day 1 done when

You log in at `aryaaos.casaaria.in` via Microsoft SSO and see "Welcome, Awish" on the dashboard.

## What I'm doing while you do Day 1

In parallel (you'll see commits arrive on the branch):
- Pre-building `package.json` and `tailwind.config.ts` so Claude Code has a starting point.
- On standby for any decision Claude Code can't make alone.
- Standing by to write design tokens (Day 10 work, but I can pre-stage).

## When to ping me

- If Wispr Flow is Mac-only on the day you check.
- If any account creation hits a wall (e.g., Anthropic phone verification fails, Convex needs a different plan).
- If Claude Code asks a design/architecture question it can't answer from the bootstrap files.
- If you want a 2nd opinion on a Coach question once it starts asking you things on Day 14+.

## Next milestone after Day 1

**Day 2 (~2h)** — Convex schema deployed, SSO live, sidebar rendered, backup cron live, Sentry live. Per `05-execution-plan.md` Day 2.

You don't need to read the rest of the plan today. One day at a time.

Go.
