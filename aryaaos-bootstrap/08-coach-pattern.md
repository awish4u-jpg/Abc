# Coach pattern — graduated autonomy via conversation

The conversational layer that owns the *relationship* between Awish and the system. Sits above every other AI feature.

## Design intent

> Most AI assistants are either fully autonomous (and untrustworthy because you can't see what they're doing) or fully manual (and useless because you have to confirm everything). Coach starts as a chatty assistant that asks before acting. With every confirmed pattern, it earns trust. By month 3, most decisions are silent — but always auditable, always reversible, always conversational.

ADHD-aware principle: as Coach earns trust, it disappears into the background. The system does more, demands less, and the user knows what's happening without being interrupted.

## Trust budget per decision category

```
Trust score 0-100 per decision category.

   0-30  ASK         "Coach: Want me to mark this urgent?"
                     Conversation appears in Review Queue.
                     Acting requires explicit user response.
                     
  30-70  CARD        Acts and shows a confirmation card.
                     User can accept, edit, or reject.
                     Card visible in Review Queue.
                     
  70-90  SILENT      Acts silently.
                     Logged in 9pm daily digest.
                     User can audit anytime.
                     
   90+   INVISIBLE   Acts silently.
                     Not surfaced in daily digest.
                     User can still audit via Settings.
```

### Decision categories tracked

| Category | Default v1 trust | Notes |
|---|---|---|
| `email_urgency` | 0 | Per-sender threshold raised separately |
| `vip_addition` | 0 | High-stakes — slow trust build |
| `vip_removal` | 0 | High-stakes — slow trust build |
| `email_auto_draft` | 0 | Drafts only, never auto-send (hard rule) |
| `omnibox_classify_org` | 30 | Layer 1 vs Personal — usually obvious |
| `omnibox_classify_pillar` | 0 | Pillar choice nuanced — needs feedback |
| `task_create` | 30 | Creating tasks low-risk |
| `subtask_create` | 30 | Same |
| `teammate_delegate` | 0 | Affects others — slow trust build |
| `reminder_schedule` | 30 | Easy to undo |
| `pulse_tone_selection` | 30 | Per-tone separately |
| `mode_switch_suggestion` | 0 | Coach never auto-switches modes — always asks |
| `slipping_escalation` | 0 | When tasks slip, Coach asks before nudging |

## Trust score updates

```
Accepted as-is        +5 to score
Accepted with edit    +1 (you accepted but corrected — partial credit)
Rejected              -10
"Always do this"      jumps score to 70
"Never do this"       resets score to 0 + locks pattern as exception

Score capped at 100.
Score floor is 0.
```

## Coach memory

Single document Claude reads on every Coach interaction:

```
Patterns learned about Awish:
─────────────────────────────────────────────────────────────
[email_urgency]
- Aakar (NPBMA) — always urgent. Confirmed Tue 30 Apr. (5×)
- Internal team Slack-style queries — urgent only if @-mentioned. (2×)

[omnibox_classify_pillar]
- "vendor pricing" mentions — file under Vendors > Pricing Notes. (3×)
- Health pillar entries — never ask follow-up questions, just file. (8×)

[pulse_tone_selection]
- Bhagavad Gita / Sanskrit + translation — strong likes. (12×)
- Fierce tone (Goggins, Jocko) — passes 60% of the time. Ease off Mondays. (4×)

[slipping_escalation]
- NPBMA proposal — Awish has manually pushed for 3 weeks. Stop nudging. (1×)

[scheduling]
- Friday 5pm onwards — never propose new tasks. Winding down. (2×)
- Sunday morning — open for personal goals review. (1×)

Open questions Awish hasn't decided:
─────────────────────────────────────────────────────────────
- Auto-reply to internal teammates on simple yes/no questions?
- Cross-reference Ideas pillar with active proposals automatically?
- Weekly Pulse recap email? (you said no email — keeping out)
```

User can view + edit at `Settings → Coach Memory`. Direct edits + 1 confirmation count.

## Coach surfaces — only three

No new notification mechanism. Reuses existing surfaces.

### 1. Review Queue (primary)

Coach questions appear alongside classifier cards. Tagged `Coach` with a small icon.

```
┌─────────────────────────────────────────────────────────┐
│  Coach · 2 minutes ago                                  │
│                                                         │
│  Aakar from NPBMA emailed about the proposal —          │
│  second time this week. Want me to flag him as          │
│  urgent by default? Or just this thread?                │
│                                                         │
│  [ Always urgent ]  [ Just this thread ]  [ Skip ]      │
└─────────────────────────────────────────────────────────┘
```

User responds in one tap (or types a custom answer). Coach acts and updates memory.

### 2. 9pm daily digest

Surfaces in dashboard at 9pm review:

```
9PM REVIEW

Coach handled 12 things today. Here are 3 — anything off?

  • Marked Saurabh's email urgent (matches your Zydus pattern)
  • Filed Akash's note under Honeywell vendor (matches "vendor pricing")
  • Created reminder: Aakar follow-up Friday 10am (you said by Friday)

[ All good ]    [ Show all 12 ]    [ Open something ]
```

If user says "all good" → all 12 trust scores +5 across their categories.
If user opens something and corrects → that one −10, others still +5.

### 3. Soft toast (high-stakes only)

For interrupts that can't wait:

```
┌────────────────────────────────────────────────────┐
│  ⚠  Aakar emailed urgently and you're in Stage    │
│     mode. Draft a reply you can review later?      │
│  [ Yes, draft ]  [ Snooze 1h ]  [ Ignore ]         │
└────────────────────────────────────────────────────┘
```

Toast fades after 8 seconds. Choice logged either way.

**Coach never uses email or push** — UI only.

## Conversational pattern

### Bad (one-shot card)
```
System: "Mark Aakar's email urgent? [Yes] [No]"
```

### Good (Coach)
```
Coach: "Aakar from NPBMA emailed about the proposal —
       second time this week. Want me to flag him as
       urgent by default? Or just this thread?"

User:  "He's always like this."

Coach: "Got it — added Aakar to VIP urgent list.
       I'll watch the next 5 — tell me if I overdo it."

[5 emails later, in 9pm digest]

Coach: "Aakar flagged 5 of 5 emails as urgent this week,
       all per the rule we set Tuesday. Still feels right?"

User:  "Yes."

[Trust score for "Aakar urgency" jumps. No more questions.]
```

## When Coach proactively reaches out

Triggered events that fire Coach conversations:

| Event | Conversation |
|---|---|
| New high-volume sender (5+ emails in a week) | "Add to VIP?" |
| Pattern of dismissals on similar emails | "Want me to auto-dismiss this kind?" |
| User has same omnibox phrase 3+ times | "Want me to auto-tag these?" |
| Slipping task hits 7 days | "Should I escalate, snooze, or kill it?" |
| Tone preferences shifting in Pulse feedback | "Sensing a mood shift — adjust selection?" |
| New teammate in delegated subtasks | "Add to delegation defaults?" |
| User in Solo mode for 4+ hours straight | "Long Solo session — want a breath reminder?" |

Each event has a frequency cap (max 3 Coach interrupts per day) so Coach is never naggy.

## Settings → Coach Memory

A single page in settings showing all learned patterns. Each row has:
- The pattern in plain English
- Confirmation count
- Last confirmed date
- [ Edit ] [ Delete ]

Direct edit = +1 confirmation count + reset contradictionCount.
Delete = pattern removed, related trust score downgraded by 10.

## Settings → Trust Levels

A second settings page showing current trust score per decision category, with a slider:
```
email_urgency       72  ●─────────  acts silently
vip_addition        45  ●────       shows card
omnibox_classify    88  ●────────●  invisible
mode_switch         0   ●          asks every time
```

User can manually drag a slider to override. Manual override is sticky (Coach won't drift it back).

## Roadmap

- **Day 7** (confirmation cards): cards now route through Coach trust check.
- **Day 14** (mail integration): VIP onboarding is the first big Coach conversation.
- **Day 18-19** (agents): **CoachAgent** — owns the conversation layer, reads/writes memory.
- **Day 21** (daily flow): 9pm digest = Coach digest.
- **Day 28** (polish): `Settings → Coach Memory` and `Settings → Trust Levels` ship with launch.

## Long-term arc

| Phase | Months | Coach behavior |
|---|---|---|
| Onboarding | 0-1 | Asks lots, learns fast, low autonomy |
| Calibration | 1-3 | Acts with cards, occasional questions |
| Steady state | 3-6 | Most decisions silent + daily digest |
| Mature | 6+ | Quiet partner, occasional pattern shifts surface |

By month 6, AryaaOS feels less like an app and more like having a chief-of-staff who knows your patterns. That's the design intent.
