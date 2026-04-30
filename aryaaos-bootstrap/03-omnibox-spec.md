# Omnibox — component spec

The single floating input. Voice or text. Capture-first. Claude classifies. You confirm.

## Design intent

> One place to dump every thought, no decision required at capture time. Claude figures out what it is, where it goes, who needs to know, what to do next. You only see a confirmation card when something material is being changed.

ADHD principle: **never block the capture flow.** The omnibox closes the moment you hit enter. Classification is async. Cards arrive in a Review Queue panel that you visit when ready, not when notified.

## UI

### Floating bar (desktop)

- Trigger: `Cmd+K` / `Ctrl+K` from anywhere.
- Position: centered, top third of viewport.
- Width: 720px. Backdrop blur on rest of UI.
- Components:
  - Mic button (left) — toggle Whisper API recording. Pulses red while recording.
  - Text input (center) — auto-grows up to 6 lines.
  - Send button (right) — disabled until non-empty.
- Below input, a small mode badge: "Stage / Default / Solo" (current). Click to switch.
- Live preview row appears under input when Claude has a fast guess (~300ms streaming): shows likely org + pillar + 1-line summary. Non-blocking, no commitment.
- ESC closes; never loses what you typed (drafts persist for 60s).

### Mobile (PWA)

- Bottom sheet, full width.
- Big mic button (60% of sheet height when collapsed).
- Tap-and-hold mic = push-to-talk. Release = send.
- Tap mic short = toggle continuous recording.
- Wispr Flow not available on mobile → in-app Whisper API only on mobile.

### Review Queue panel

- Right sidebar, collapsible. Default collapsed.
- Header shows count: "5 to review."
- Each card: input (truncated), Claude's summary, proposed action(s), tier badge, Accept / Edit / Reject buttons.
- Bulk mode: "Accept all silent" / "Review next 5."
- Empty state: "Inbox clean. Nicely done."

## Voice path

### Wispr Flow (Windows, primary)

- System-wide dictation. Wispr already converts speech → text into any field.
- Omnibox is just a text input — Wispr fills it. No special integration needed.
- User flow: hit Wispr hotkey, speak, Wispr inserts text, hit Enter.

### In-app Whisper API (mobile + Wispr-off fallback)

- Browser MediaRecorder → 16kHz mono webm.
- POST to OpenAI `/v1/audio/transcriptions` (model `whisper-1`).
- Returns text → fills input field.
- Latency budget: ≤2s for ≤30s audio.
- Cost logged to `apiUsage` table.

## Routing layer (Claude classifier)

### Trigger

When omnibox submits:
1. `inboxItems` row created with `classificationStatus: 'unclassified'`.
2. UI closes immediately.
3. Convex action `omnibox.classify` enqueued (retries × 3 with backoff).

### Context provided to Claude

```ts
{
  input: "<raw text>",
  mode: "stage" | "default" | "solo",
  recentPages: [{ id, title, org, pillar, snippet }, ...],   // last 20
  activePipelineDeals: [{ id, client, stage, value }, ...],
  activeProposals: [{ id, client, stage }, ...],
  activeProjects: [{ id, name, status }, ...],
  pillarsAvailable: [...],
  teammates: [{ id, name, email }, ...],     // Layer 1 only
  vendorsActive: [{ id, name }, ...],
  currentTime: ISO,
  currentLocation: optional,
}
```

Stage/Default modes scrub `private: true` from this context.

### Tools Claude can call (function calling)

```ts
type OmniboxTool =
  | { tool: "file_to_inbox"; args: { tags?: string[] } }              // silent default
  | { tool: "classify_to_pillar"; args: { org: "layer1"|"personal"; pillar?: string } }
  | { tool: "link_to_proposal"; args: { proposalId: string; relationship: "context"|"action_item"|"decision" } }
  | { tool: "link_to_client"; args: { clientId: string } }
  | { tool: "link_to_vendor"; args: { vendorId: string } }
  | { tool: "create_task"; args: { title: string; due?: string; priority?: "low"|"med"|"high"; assignedTo?: string } }
  | { tool: "create_subtask"; args: { parentTaskId: string; title: string } }
  | { tool: "delegate_to_teammate"; args: { teammateId: string; taskId: string; note?: string } }
  | { tool: "schedule_followup"; args: { with: string; whenIso: string } }
  | { tool: "draft_email"; args: { to: string[]; subject: string; body: string } }
  | { tool: "update_odoo_record"; args: { model: "crm.lead"|"res.partner"|"product.product"; recordId: number; values: object } }
  | { tool: "create_odoo_record"; args: { model: string; values: object } }
  | { tool: "generate_image"; args: { prompt: string; useCase: string; aspect: "16:9"|"1:1"|"9:16" } }
  | { tool: "create_reminder"; args: { text: string; whenIso: string } }
  | { tool: "park_idea"; args: { title: string; body: string } }
  | { tool: "build_idea"; args: { ideaId: string } }                  // promote idea to page+task
  | { tool: "create_meeting_note"; args: { meetingId: string; bullets: string[] } };
```

Claude can return **multiple tools per run** — that's the point of "deep classifier."

### Example: deep classification

> Input: *"Just spoke to Akhil from Zydus, they want the BoQ updated with the new humidity sensor. Akash should pull the spec sheet from Honeywell. Need to send Akhil a revised proposal by Friday."*

Claude returns 6 tool calls:
1. `classify_to_pillar` → `org: 'layer1'`, no pillar (work side).
2. `link_to_client` → Zydus.
3. `link_to_proposal` → Zydus active proposal.
4. `create_task` → "Update BoQ with new humidity sensor", linked to proposal.
5. `create_subtask` (parent = above) → "Pull Honeywell humidity sensor datasheet", `assignedTo: Akash`, `delegate_to_teammate: Akash`.
6. `schedule_followup` → "Send revised proposal to Akhil", whenIso = next Friday 10am, links to proposal.

User sees one card with 6 line items. Tier escalation logic decides:
- Items 1-3: silent (filing/linking).
- Items 4-6: card (creates records). One Accept covers all three.
- No hard-confirm in this example (no email send).

## Action tier mapping

Tier is determined by the tool, not by Claude. Claude proposes; the tier table decides the gate.

| Tool | Tier |
|---|---|
| `file_to_inbox`, `classify_to_pillar`, `link_to_*` | silent |
| `create_task`, `create_subtask`, `schedule_followup`, `create_reminder`, `park_idea`, `build_idea`, `create_meeting_note`, `update_odoo_record` (non-deal-stage), `create_odoo_record` | card |
| `delegate_to_teammate` | card |
| `draft_email` | card |
| `update_odoo_record` (when it changes deal stage or value) | hard_confirm |
| `generate_image` | card (cost ≤ $0.05); hard_confirm if estimated cost > $0.10 |
| Send email (separate explicit "Send" action on a draft) | hard_confirm |
| Delete anything | hard_confirm |

## Confirmation card

```
┌─────────────────────────────────────────┐
│ INPUT                          [Voice]  │
│ "Just spoke to Akhil from Zydus, they   │
│  want BoQ updated…"                     │
├─────────────────────────────────────────┤
│ INTERPRETATION                          │
│ Layer 1 work · linked to Zydus proposal │
│ "Bottling line humidity upgrade"        │
├─────────────────────────────────────────┤
│ PROPOSED ACTIONS                        │
│ ✓ File under Zydus proposal     [silent]│
│ ✓ Create task: Update BoQ          [+]  │
│ ✓ Subtask → Akash: pull spec       [+]  │
│ ✓ Delegate subtask to Akash        [+]  │
│ ✓ Reminder: send proposal Fri 10am [+]  │
├─────────────────────────────────────────┤
│  [ Edit ]  [ Reject ]    [ Accept all ] │
└─────────────────────────────────────────┘
```

- Each `[+]` expands to show full args.
- Edit opens an inline form per action — user can change values, then accept.
- Reject takes a one-line note (optional) — Claude learns from rejections (logged for prompt-tuning later).

## Hard-confirm gate

For `hard_confirm` tier:
- Card shows with a red header band: "This action will [send email / change deal stage / cost money]."
- Accept button is gated by a 3-second hold + visual countdown.
- Audit log entry in `activity` table with full diff.

## Mode-aware filtering

| Mode | Context Claude sees | UI shows |
|---|---|---|
| Stage | Active project only, no private, no financial | Active project surface only |
| Default | All non-private, all orgs | Standard dashboard |
| Solo | Everything | Standard dashboard + private surfaces |

Mode is passed in classifier context. Claude is instructed: "If user input touches private/financial/family content while mode is Stage or Default, return only `file_to_inbox` and a note: `awaiting_solo_mode`. Do not propose actions on private content."

## Cost & rate limits

- Classifier: Claude Sonnet 4.6 by default. ~$0.005 per call (3-5k tokens).
- Hot tagging-only path: Haiku 4.5 (`file_to_inbox` + `classify_to_pillar` only) at ~$0.0003 per call.
- Routing rule: if input < 100 chars and no explicit verbs detected (regex pre-check), route to Haiku. Otherwise Sonnet.
- Daily soft cap: $10 across all Anthropic calls (omnibox + agents). Hits cap → omnibox silently downgrades to Haiku-only.
- Hard cap (Anthropic console): $200/mo.

## Failure modes

| Failure | Behavior |
|---|---|
| Wispr Flow off / not installed | In-app Whisper kicks in, no UX change |
| Whisper API timeout (>10s) | Show "transcription failed, hit retry or type" |
| Claude API error | Inbox item saved with `classificationStatus: 'failed'`; visible in queue with manual classify button |
| Claude proposes invalid arg (e.g., teammate id that doesn't exist) | Card shows action greyed out with reason; rest of card still actionable |
| Cost cap hit | Banner: "AI classification paused for today. Your captures are safe." |
| User offline | Inbox item queued in IndexedDB; syncs when back online |

## Performance budget

- Omnibox open → first paint: ≤80ms.
- Submit → modal close: ≤120ms (no awaiting Claude).
- Voice transcription (≤30s audio): ≤2s.
- Background classification: ≤6s p95. UI shows "classifying…" state in queue.

## Telemetry (in `activity` + `apiUsage`)

For prompt-tuning later, log:
- Tool calls proposed vs accepted vs edited vs rejected.
- Classification confidence vs user override.
- Time-to-accept per tier.
- Cost per inbox item.

## Phase rollout

- Day 3: capture-only (no classifier).
- Day 6: classifier with `file_to_inbox` + `classify_to_pillar` only.
- Day 7: full tool set + tier gates.
- Day 12: Odoo write tools enabled.
- Day 20: Nano Banana `generate_image` tool enabled.
- Day 25: reminders integrated.
