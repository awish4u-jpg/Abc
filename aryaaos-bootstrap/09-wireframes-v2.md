# Wireframes v2 — locked layouts

ASCII layouts. Fonts: Playfair Display for hero/quotes, Inter for everything else.

## 1. Default mode home (desktop)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AryaaOS                          Stage  [ Default ]  Solo          AS  │
├────────────────────┬─────────────────────────────────────────────────────┤
│                    │                                                     │
│  Inbox        4    │                                                     │
│                    │                                                     │
│  ─── LAYER 1 ───   │      "What is to give light                         │
│   Pipeline         │       must endure burning."                         │
│   Clients          │                                                     │
│   Vendors          │       — Viktor Frankl                               │
│   Proposals        │                                                     │
│   Meetings         │       ♡ like     ✕ dislike     ↻ another            │
│   Tasks            │                                                     │
│                    │  ─────────────────────────────────────────────────  │
│  ─── PERSONAL ───  │                                                     │
│   Goals            │  Tuesday · 30 April                                 │
│   Reading          │  Good morning, Awish.                               │
│   Sports           │                                                     │
│   Travel           │                                                     │
│                    │  TODAY                                              │
│  Ideas       12    │  09:30   Zydus call · Granola joining               │
│  Templates         │  11:00   Coast Guard scoping · internal             │
│  Trash             │  16:00   Honeywell datasheet review                 │
│                    │                                                     │
│                    │                                                     │
│                    │  NEEDS YOU                              ↓ 14 total  │
│                    │  ─────────────────────────────────────────────────  │
│                    │  ●  Aakar (NPBMA)            4d rotten      urgent  │
│                    │     "When can we expect the revised proposal?"      │
│                    │     [ urgent ] [ important ] [ dismiss ] [ draft ]  │
│                    │                                                     │
│                    │     Saurabh (Zydus)          1d                     │
│                    │     "Confirming Tuesday slot — share agenda"        │
│                    │     [ urgent ] [ important ] [ dismiss ] [ draft ]  │
│                    │                                                     │
│                    │     Akash (internal)         2d                     │
│                    │     "Honeywell quoted ₹4.2L — need approval"        │
│                    │     [ urgent ] [ important ] [ dismiss ] [ draft ]  │
│                    │                                                     │
│                    │     ── scroll for 11 more ──                        │
│                    │                                                     │
│                    │                                                     │
│                    │  SLIPPING                                           │
│                    │  NPBMA proposal · last moved 6 days ago             │
│                    │                                                     │
│                    │                                                     │
│  ◐                 │                                              Cmd+K  │
└────────────────────┴─────────────────────────────────────────────────────┘
                                                                ┌───────┐
                                                                │ ◉ 4   │
                                                                └───────┘
                                                            floating queue
```

## 2. Stage mode home (screen-share safe)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AryaaOS                       [ STAGE ]  Default  Solo             AS  │
│                          ▰▰▰▰▰▰  Zydus · Bottling line humidity upgrade │
├────────────────────┬─────────────────────────────────────────────────────┤
│                    │                                                     │
│                    │      "Strategy without execution                    │
│  ← All projects    │       is hallucination."                            │
│                    │                                                     │
│  Brief             │       — Thomas Edison                               │
│  Scope             │                                                     │
│  BoQ               │  ─────────────────────────────────────────────────  │
│  Vendors           │  ZYDUS · BOTTLING LINE HUMIDITY UPGRADE             │
│  Tasks             │  Stage · Drafting · Due Friday                      │
│  Meetings          │                                                     │
│  Proposal draft    │                                                     │
│  Files             │  TODAY ON THIS PROJECT                              │
│                    │  09:30   Akhil call                                 │
│                    │  16:00   Honeywell datasheet review                 │
│                    │                                                     │
│                    │                                                     │
│                    │  OPEN ACTIONS                                       │
│                    │  ›  Update BoQ with humidity sensor      due today  │
│                    │  ›  Pull Honeywell spec (Akash)          1d         │
│                    │  ›  Send revised proposal to Akhil       Friday     │
│                    │                                                     │
│                    │                                                     │
│                    │  RECENT MEETING NOTES                               │
│                    │  Apr 28 · Akhil + team · 14 min summary →           │
│                    │                                                     │
│                    │                                                     │
│  ◐                 │                                                     │
└────────────────────┴─────────────────────────────────────────────────────┘

  Stage rules:
  - Pulse stays visible (per locked decision) but no action buttons.
  - Pulse pool restricted to presentationSafe + English-only.
  - Sidebar collapses to project tree only + exit link.
  - No floating Review Queue.
  - No Cmd+K hint.
  - No inbox count anywhere.
  - No personal pillars.
  - Coach interrupts disabled.
  - Top accent bar shows current Stage subject prominently.
```

## 3. Solo mode home (everything visible)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AryaaOS                          Stage   Default  [ Solo ]         AS  │
├────────────────────┬─────────────────────────────────────────────────────┤
│                    │                                                     │
│  Inbox        4    │      "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥"                  │
│                    │                                                     │
│  ─── LAYER 1 ───   │      "You have the right to action,                 │
│   Pipeline         │       never to its fruits."                         │
│   Clients          │                                                     │
│   Vendors          │      — Bhagavad Gita 2.47                           │
│   Proposals        │                                                     │
│   Meetings         │      ♡ like     ✕ dislike     ↻ another             │
│   Tasks            │                                                     │
│                    │  ─────────────────────────────────────────────────  │
│  ─── PERSONAL ───  │  Tuesday · 30 April                                 │
│   Health    ◐      │                                                     │
│   Family    ◐      │  TODAY                                              │
│   Finance   ◐      │  09:30  Zydus  ·  16:00  Honeywell                  │
│   Goals            │                                                     │
│   Reading          │  ┌─────────────────┐  ┌──────────────────────────┐  │
│   Sports           │  │  NEEDS YOU      │  │  PERSONAL TODAY          │  │
│   Travel           │  │  ●  Aakar  4d   │  │  ◯  Gym 6pm              │  │
│                    │  │     Saurabh 1d  │  │  ◯  Aanya pickup 7pm     │  │
│  Ideas       12    │  │     Akash  2d   │  │  ◯  Read 30 min          │  │
│  Templates         │  │  ─ 11 more ─    │  │                          │  │
│  Trash             │  └─────────────────┘  └──────────────────────────┘  │
│                    │                                                     │
│                    │  ┌─────────────────┐  ┌──────────────────────────┐  │
│                    │  │  IDEAS · ACTIVE │  │  FINANCE PULSE           │  │
│                    │  │  3 in progress  │  │  Layer 1 cash · ↗        │  │
│                    │  │  5 parked       │  │  Personal SIP · on track │  │
│                    │  │                 │  │  Q1 review due 7 May     │  │
│                    │  └─────────────────┘  └──────────────────────────┘  │
│                    │                                                     │
│                    │  SLIPPING                                           │
│                    │  NPBMA proposal · 6d                                │
│                    │  Annual health checkup · booked but not confirmed   │
│                    │                                                     │
│  ◐                 │                                              Cmd+K  │
└────────────────────┴─────────────────────────────────────────────────────┘
                                                                ┌───────┐
                                                                │ ◉ 4   │
                                                                └───────┘
```

## 4. Mobile home (Default)

```
┌────────────────────────┐
│  ●  Default        AS  │
├────────────────────────┤
│                        │
│   "What is to give     │
│    light must endure   │
│    burning."           │
│                        │
│   — Viktor Frankl      │
│                        │
│   ♡   ✕   ↻            │
│                        │
├────────────────────────┤
│  Tuesday · 30 April    │
│  Good morning, Awish.  │
│                        │
│  TODAY                 │
│  09:30  Zydus call     │
│  11:00  Coast Guard    │
│  16:00  Honeywell      │
│                        │
│  NEEDS YOU         14  │
│  ─────────────         │
│  ●  Aakar    4d        │
│  "When can we expect…" │
│  [ ▾ actions ]         │
│                        │
│  Saurabh    1d         │
│  "Confirming Tuesday…" │
│  [ ▾ actions ]         │
│                        │
│  ── scroll ──          │
│                        │
│  SLIPPING              │
│  NPBMA · 6d            │
│                        │
└────────────────────────┘
                ┌──┐
                │◉4│  ← floating
                └──┘
```

## 5. Mobile non-home — Pulse ribbon

```
┌────────────────────────┐
│  ●  Page · Zydus       │
├────────────────────────┤
│ "What is to give light │  ← ribbon: just text
│  must endure burning." │     tap to expand
├────────────────────────┤
│                        │
│  ...page content...    │
│                        │
│                        │
└────────────────────────┘
```

Tap ribbon → expands to full Pulse box overlaying top half of screen, with actions. Tap outside to collapse back to ribbon.

## 6. Omnibox (open, voice active)

```
                                                                     dim
                       ┌──────────────────────────────────────────┐
                       │  ●  Listening…                           │
                       │                                          │
                       │  Just spoke to Akhil from Zydus, they    │
                       │  want the BoQ updated with the new       │
                       │  humidity sensor█                        │
                       │                                          │
                       │  ──                                      │
                       │  Layer 1 · Zydus proposal · 92%          │
                       │                                          │
                       │  Default mode             ESC to cancel  │
                       └──────────────────────────────────────────┘
                                                                     dim
```

## 7. Confirmation card (deep classifier output)

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  Captured 2 minutes ago · voice                                     │
│                                                                     │
│  "Just spoke to Akhil from Zydus, they want the BoQ updated with    │
│   the new humidity sensor. Akash should pull the spec sheet from    │
│   Honeywell. Need to send Akhil a revised proposal by Friday."      │
│                                                                     │
│  ───                                                                │
│                                                                     │
│  Layer 1 · Zydus · Bottling line humidity upgrade                   │
│                                                                     │
│                                                                     │
│  PROPOSED ACTIONS                                                   │
│                                                                     │
│   ✓   File under proposal                              silent       │
│   +   Task — Update BoQ with new humidity sensor       card         │
│   +   Subtask → Akash · pull Honeywell spec            card         │
│   +   Delegate subtask to Akash                        card         │
│   +   Reminder · send proposal Friday 10:00            card         │
│                                                                     │
│  ───                                                                │
│                                                                     │
│         [ Edit ]    [ Reject ]            [ Accept all  → ]         │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## 8. Coach question card (in Review Queue)

```
┌─────────────────────────────────────────────────────────────────┐
│  Coach · 2 minutes ago                                          │
│                                                                 │
│  Aakar from NPBMA emailed about the proposal —                  │
│  second time this week. Want me to flag him as                  │
│  urgent by default? Or just this thread?                        │
│                                                                 │
│   [ Always urgent ]   [ Just this thread ]   [ Skip ]           │
│                                                                 │
│   ╴ Reply in your own words                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

Reply-in-your-own-words opens an inline text input that goes to Claude — Coach interprets and acts.

## 9. Floating Review Queue (expanded)

```
                                                       bottom-right

                    ┌─────────────────────────────┐
                    │  Review Queue · 4         ─ │
                    ├─────────────────────────────┤
                    │                             │
                    │   Coach · Aakar urgency?    │
                    │   waiting on you            │
                    │   [ open ]                  │
                    │                             │
                    │   ── ── ── ──               │
                    │                             │
                    │   Zydus · BoQ note          │
                    │   5 actions          card   │
                    │   [ open ]                  │
                    │                             │
                    │   ── ── ── ──               │
                    │                             │
                    │   Bali family idea          │
                    │   filed silent              │
                    │                             │
                    │   ── ── ── ──               │
                    │                             │
                    │   NPBMA stage change        │
                    │   hard confirm              │
                    │   [ open ]                  │
                    │                             │
                    │   ↓ Process next 5          │
                    └─────────────────────────────┘

                    ┌───────┐    ← collapsed state
                    │ ◉ 4   │       just a pill, count visible
                    └───────┘
```

## 10. Long-press dislike on Pulse

```
                       ┌────────────────────────────┐
                       │  Dislike — what scope?     │
                       │                            │
                       │  □  Just this quote        │
                       │  □  All by Viktor Frankl   │
                       │  □  All "fierce" tone      │
                       │                            │
                       │           [ Apply ]        │
                       └────────────────────────────┘
```

Pick more than one. Default selection: just this quote.

## 11. 9pm Coach digest

```
─────────────────────────────────────────────────────
9PM REVIEW

Coach handled 12 things today. Here are 3 — anything off?

  • Marked Saurabh's email urgent (matches your Zydus pattern)
  • Filed Akash's note under Honeywell vendor (matches "vendor pricing")
  • Created reminder: Aakar follow-up Friday 10am (you said by Friday)

[ All good ]    [ Show all 12 ]    [ Open something ]
─────────────────────────────────────────────────────
```

## 12. Empty state — Inbox clean

```
                                                     
                                                     
                                                     
                                                     
                Inbox clean.                         
                Nicely done.                         
                                                     
                                                     
                                                     
                                                     
```

Single line, centered, in the widget zone. No icons. Replaces the entire NEEDS YOU widget.
