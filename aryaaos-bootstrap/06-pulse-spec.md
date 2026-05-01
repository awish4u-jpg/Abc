# Pulse — mood-aware quote engine

A single line of language the moment you open AryaaOS. Mood-matched. Explicitly learned. Never ambient inference.

## Design intent

> Most "daily quote" features fail because they're context-blind. Pulse reads ~12 signals about your current state, picks from a curated library, and learns only from explicit feedback. No-feedback never counts as dislike.

## Surfaces

| Surface | Where | Behavior |
|---|---|---|
| Dashboard top zone | Desktop home, every open | Full Pulse with three actions |
| Mobile home | First widget on mobile dashboard | Smaller box, same actions |
| Mobile ribbon | Top thin strip on every other mobile screen | Quote text only, tap to expand |
| Stage mode | Same dashboard top zone | Quote stays visible, but no action buttons; quote pool restricted to `presentationSafe: true` |

## Layout (desktop)

```
                                                     
                                                     
   "What is to give light                            
    must endure burning."                            
                                                     
    — Viktor Frankl                                  
                                                     
    ♡ like     ✕ dislike     ↻ another               
                                                     
─────────────────────────────────────────────────────
```

- Playfair Display, ~32px on desktop, ~22px on mobile.
- ~120px vertical padding above and below the quote.
- Three small text-button actions, all equal weight, ~14px Inter.
- No icons, no color, no urgency. Quiet.

## Sanskrit / Hindi handling

Always shown with English translation directly below:

```
   "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥"
                                                     
   "You have the right to action,                    
    never to its fruits."                            
                                                     
   — Bhagavad Gita 2.47                              
```

`language: "sa"` quotes require `translationEn`. Selection logic enforces this.

## Mood signal stack

Read on every Pulse fetch (cached when possible):

```ts
{
  inboxStress: number,       // (urgent emails × rotten days) / 10, capped 0-1
  slippingCount: number,      // tasks with lastMovedAt > 5 days
  completionToday: number,    // tasks closed in last 24h
  calendarLoad: number,       // hours of meetings today / 8, capped 0-1
  recentSentiment: number,    // last 20 omnibox captures, Claude-rated -1 to 1
  recentIdeasCount: number,   // ideas added last 3 days (creative spike)
  timeOfDay: "morning" | "midday" | "evening" | "late",
  dayOfWeek: string,
  mode: "stage" | "default" | "solo",
  streak: number,             // consecutive daily uses
  recentTopics: string[],     // top 5 topics in last 50 captures
  selfReportedMood?: string,  // extracted if user said "feeling foggy" etc.
}
```

## Selection logic

1. Build mood snapshot. Persist as `moodSnapshots` row.
2. Query `quotes` table:
   - `blacklisted: false`
   - `lastShownAt` not within cooldown window (90d for liked, 14d for no-interaction, 30d for "another")
   - In Stage mode: `presentationSafe: true` AND `language: "en"`
   - Apply mood-match score using `pulseTonePreferences` weights
3. Take top 5 candidates by score.
4. Pass to Claude (Haiku 4.5) with the mood snapshot + 5 candidates + reasoning request.
5. Claude returns `{ chosenQuoteId, reasoning }`.
6. Persist `pulseSelections` row.
7. If Claude says "no candidate fits well" AND library size < 200: skip Pulse this open (rare).
8. If Claude says "no candidate fits well" AND library size >= 200: AI composition fallback (see below).

### Pre-computation

End of each session: pre-compute next 5 selections. On cold open, use cached pick. Refresh in background. **Perceived latency: 0ms.**

## AI composition fallback

When library has no good match, Claude composes one (Sonnet 4.6, never Haiku):
- Tagged `aiGenerated: true`
- Shown only if Claude's confidence > 0.8
- If user likes → added to library, becomes future candidate
- Shown ≤ 1× per week (avoid AI-sounding fatigue)

## Learning model — explicit only

The defining principle: **no-feedback ≠ dislike.**

| Action | Quote-level | Pattern-level (`pulseTonePreferences`) |
|---|---|---|
| ♡ Like | Cooldown 90d, can reappear | Tone +1, tradition +1, theme +1 |
| ✕ Dislike (just this quote) | `blacklisted: true`, never shown | No pattern change |
| ✕ Dislike (this author) | All quotes by author blacklisted | No pattern change |
| ✕ Dislike (this tone) | Tone weight −5 | Tone heavily downweighted |
| ✕ Dislike (multiple scopes) | Apply each | Apply each |
| ↻ Another | Cooldown 30d | No weight change |
| (no interaction) | Cooldown 14d | No weight change |

### Long-press / right-click on dislike

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

User can pick more than one. Default selection: just this quote.

## Coach interaction

Pulse is a Coach domain. Coach occasionally asks questions about your taste:

- After 5 Stoic likes: *"You've been resonating with Stoic quotes — want me to lean into them more?"*
- After 3 Sanskrit dislikes: *"You've passed on the last 3 Sanskrit quotes — want me to ease off, or just adjust the selection?"*
- After 30 days with no dislikes at all: *"You've never disliked anything — am I being too safe? Want me to push you with sharper material?"*

These conversations build `coachMemory.patterns` entries. Trust score for `pulse_tone_selection` rises.

## Seed library

300 quotes minimum, hand-curated, tagged across:

- **Tone**: calming, fierce, witty, reflective, practical, tender
- **Tradition**: Stoic, Eastern (Tao/Buddhist/Gita), ADHD literature, leadership, modern thinkers, poetry
- **Themes**: fear, slipping, ADHD-specific, creativity, attachment, focus, persistence, family, ambition, rest
- **Language**: en, sa (Sanskrit), hi (Hindi)

Examples:

```
text: "Discipline equals freedom."
attribution: "Jocko Willink"
tradition: "leadership"
tone: ["fierce", "practical"]
themes: ["slipping", "Monday"]
language: "en"
presentationSafe: true

text: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन॥"
translationEn: "You have the right to action, never to its fruits."
attribution: "Bhagavad Gita 2.47"
tradition: "Eastern"
tone: ["reflective", "calming"]
themes: ["attachment", "anxious", "outcome"]
language: "sa"
presentationSafe: false

text: "You don't rise to the level of your goals; you fall to the level of your systems."
attribution: "James Clear"
tradition: "ADHD-lit"
tone: ["practical"]
themes: ["slipping", "ADHD"]
language: "en"
presentationSafe: true
```

I'll deliver the seed library as a CSV/JSON Day 22.

## Cost

- Pre-computation runs at session-end: 1 Haiku call per pre-computed selection (5 per session × few sessions/day).
- ~$0.0008 per selection. ~$0.025/day. **Trivial.**

## Roadmap

- **Day 6** (omnibox classifier): adds `save_to_pulse_library` tool.
- **Day 16** (dashboard): reserves top zone for Pulse.
- **Day 21** (daily flow): mood-snapshot job runs at 7:55am, 1:55pm, 8:55pm.
- **Day 22** (skills loader): seed library shipped (300 quotes JSON).
