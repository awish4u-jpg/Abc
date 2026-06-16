# Smart inbox spec

The "Needs You" widget on the dashboard. Outlook only (Layer 1 tenant). Per-email actions: urgent, important, dismiss, draft reply.

## Scope

- **Source**: Microsoft Graph → Outlook inbox (awish@layer1.tech).
- **Personal Gmail: NOT integrated.** Out of scope per locked decision.
- **Folders**: Inbox + any folder you mark "include in smart inbox" later.

## Data flow

1. **Webhook subscription** to Microsoft Graph notifications (`/me/mailFolders('Inbox')/messages`).
2. New email → Convex action `mail.ingest` → `mailItems` row inserted.
3. **Urgency classifier** runs: Claude Haiku reads subject + snippet + sender + thread context, returns `urgencyClaude` (0-1) + reasoning.
4. **VIP check**: if `fromEmail` matches `vipSenders` row with `autoUrgent: true`, force `urgencyUser: "urgent"`.
5. Daily cron at midnight: recompute `rottenDays` for all `status: "needs_you"` items.
6. Surfaced to dashboard widget filtered by `status: "needs_you"`, sorted by `urgencyUser` then `rottenDays` then `receivedAt`.

## Widget design

Per `09-wireframes-v2.md` — "NEEDS YOU" section on dashboard.

```
NEEDS YOU                                            ↓ 14 total
─────────────────────────────────────────────────────────────────
●  Aakar (NPBMA)            4d rotten      urgent
   "When can we expect the revised proposal?"
   [ urgent ] [ important ] [ dismiss ] [ draft ]

   Saurabh (Zydus)          1d
   "Confirming Tuesday slot — share agenda"
   [ urgent ] [ important ] [ dismiss ] [ draft ]

   Akash (internal)         2d
   "Honeywell quoted ₹4.2L — need approval"
   [ urgent ] [ important ] [ dismiss ] [ draft ]

   ── scroll for 11 more ──
```

- **Red dot ●** = `urgencyUser: "urgent"` OR `vipSender: true` OR `urgencyClaude > 0.8`.
- **Rotten days** with soft red tint behind day count when > 3d.
- Show 3 at a time, **scrollable within widget** for full 14.
- Action buttons appear on hover (desktop), always visible (mobile).

## Per-email actions

### Urgent
Sets `urgencyUser: "urgent"`, bumps to top of widget, adds red dot. **Does not change Outlook flag** (intentional — keeps AryaaOS overlay distinct from Outlook state).

### Important
Sets `urgencyUser: "important"`. Stays in list, no urgency boost. Useful for "remember this but not right now."

### Dismiss
Sets `status: "dismissed"`, `dismissedAt: now`. Removes from widget. Stays in real Outlook — not deleted.

**Auto-resurface rule** (per locked decision):
- When a new mail arrives on the same `threadId`, and at least one prior message is dismissed, auto-resurface:
  - `status` → `needs_you`
  - `dismissedAt` → null
  - Bump priority by one tier

So dismiss doesn't mean "forget forever" — only "not this version of the conversation."

### Draft reply
1. Calls Claude Sonnet 4.6 with:
   - Email content + thread context (last 5 messages)
   - Your past reply patterns to this sender (if any)
   - Coach memory for tone preferences
2. Generates draft.
3. Posts to Outlook Drafts folder via Graph (`POST /me/messages` with `isDraft: true`).
4. Sets `mailItems.status: "draft_pending"`, stores `draftId`.
5. Surfaces in Review Queue: *"Draft reply ready for Aakar — review in Outlook?"*
6. **You send from Outlook** (per locked decision). AryaaOS never auto-sends.

When you send, Graph webhook fires → `mailItems.status: "replied"` → removed from widget.

## VIP sender list

### Auto-seeding (Day 14 launch)

Coach onboarding flow runs once:
1. Coach: *"I'd like to scan the last 90 days of your Outlook inbox to propose a VIP list. Senders who email you frequently, internal team, top clients. Takes 2 minutes. Cool?"*
2. User: yes.
3. Action `mail.proposeVipList` runs:
   - Pulls last 90d emails via Graph
   - Groups by sender
   - Computes signals: frequency, your reply rate, your reply latency, sender domain match (Layer 1 internal vs external)
   - Claude Sonnet ranks top 30 candidates with reasoning
4. Coach surfaces a card:
   ```
   COACH proposes VIP list (30 senders)
   
   ✓ Internal team (5)
     awish.b@layer1.tech, ananya@layer1.tech, akash@layer1.tech, ...
   
   ✓ Active clients (8)
     akhil@zydus.com, aakar@npbma.org, ...
   
   ✓ Vendors you reply to within 24h (4)
     sales@honeywell.in, ...
   
   ? Suggested but uncertain (5)
     [list with reasoning]
   
   [ Approve all ] [ Approve checked only ] [ Edit each ]
   ```
5. User approves. Each becomes a `vipSenders` row with `addedBy: "coach"`, `confirmedAt: now`.

### Always learning

After initial seed, Coach watches:
- New sender you reply to within 4h → propose adding to VIP at next 9pm digest
- VIP sender you've ignored 5+ times → propose removing from VIP
- VIP marked auto-urgent but you've manually downgraded 3 of last 5 → propose removing autoUrgent flag

Each proposal goes through the trust-budget gate (`08-coach-pattern.md`).

## Urgency classifier

### Inputs to Haiku
- Subject + snippet
- Sender name + email + domain
- Is sender VIP? Is sender always-urgent VIP?
- Thread context (last 3 messages snippets)
- Time of day received
- Day of week
- Coach memory entries for this sender (if any)

### Output
```ts
{
  urgencyClaude: number,    // 0-1
  reasoning: string,
  suggestedDraft: boolean,  // true if reply is straightforward
  themes: string[],          // ["proposal_followup", "approval_needed", "scheduling"]
}
```

### Calibration
- `urgencyClaude > 0.8` AND `vipSender: true` → red dot
- `urgencyClaude > 0.8` AND not VIP → red dot but Coach asks: *"This looks urgent — should I treat them as VIP from now on?"*
- `urgencyClaude > 0.6` AND VIP → no red dot but pinned to top 5
- Otherwise → in widget by recency

## Cost

- Per ingest: 1 Haiku call (~$0.0003).
- Average inbox volume: 50-100/day. Cost: ~$0.03/day.
- VIP onboarding: 1 Sonnet call on 90d data (~$0.50, one-time).
- Draft reply on demand: 1 Sonnet call per draft (~$0.02).

## Roadmap

- **Day 14** (Microsoft Graph): mail webhook + ingest + classifier + VIP onboarding.
- **Day 16** (dashboard): widget shipped.
- **Day 18** (agents): EmailAgent for draft generation.
- **Day 21** (daily flow): include "X emails in Needs You" in 9pm review.
