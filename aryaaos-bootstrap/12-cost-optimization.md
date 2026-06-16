# Cost optimization — implementation guide

Same features. Same experience. ~50% cost reduction at steady state.

| Metric | Before | After |
|---|---|---|
| Realistic monthly | $170 | **~$70** |
| Anthropic share | $50-150 | $20-50 |
| Embedding share | $5-15 | $1-3 |
| Image gen share | $5-20 | $1-3 |

## Lever 1 — Anthropic prompt caching (biggest win)

Anthropic charges **90% less** for cached input tokens. Cache anything stable.

### What to cache

| Content | Cache TTL | Hits per cache |
|---|---|---|
| Coach system prompt + memory | 5 min (rolling) | ~20-50 |
| Each agent system prompt (Proposal, Vendor, etc.) | 5 min (rolling) | ~5-15 |
| Omnibox classifier instructions + tool schemas | 5 min | ~10-30 |
| Schema/context snapshots (recent pages, deals) | 5 min | ~10-20 |

### Implementation pattern

```ts
// convex/lib/anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

export async function callClaude(opts: {
  systemPrompt: string;        // cached
  cachedContext?: string;       // cached
  userMessage: string;          // not cached
  model: "haiku" | "sonnet";
}) {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  return client.messages.create({
    model: opts.model === "haiku" 
      ? "claude-haiku-4-5-20251001" 
      : "claude-sonnet-4-6",
    max_tokens: 1024,
    system: [
      {
        type: "text",
        text: opts.systemPrompt,
        cache_control: { type: "ephemeral" }, // caches this block
      },
      ...(opts.cachedContext ? [{
        type: "text",
        text: opts.cachedContext,
        cache_control: { type: "ephemeral" },
      }] : []),
    ],
    messages: [{ role: "user", content: opts.userMessage }],
  });
}
```

**Effect**: 50-70% reduction in Claude bill on its own.

## Lever 2 — Aggressive Haiku routing

Haiku 4.5 is **~12x cheaper** than Sonnet, fast, and competent for simple tasks.

### Routing rules

```ts
// convex/lib/modelRouter.ts
export function pickModel(opts: {
  feature: string;
  inputLength: number;
  hasMultipleTools?: boolean;
  isAsync?: boolean;
}): "haiku" | "sonnet" {
  // Always Haiku for these
  const haikuOnly = [
    "email_urgency_score",
    "pulse_quote_pick",
    "mood_inference",
    "tag_extract",
    "vip_proposal_score",
  ];
  if (haikuOnly.includes(opts.feature)) return "haiku";
  
  // Always Sonnet for these
  const sonnetOnly = [
    "agent_chat",
    "draft_email",
    "vip_onboarding_full",
    "proposal_drafting",
    "coach_complex_reasoning",
  ];
  if (sonnetOnly.includes(opts.feature)) return "sonnet";
  
  // Omnibox classifier: Haiku if short input + no multi-tool
  if (opts.feature === "omnibox_classify") {
    if (opts.inputLength < 100 && !opts.hasMultipleTools) return "haiku";
    return "sonnet";
  }
  
  // Default conservative
  return "sonnet";
}
```

### Expected mix

After steady state:
- **Haiku**: 70% of calls (omnibox short, urgency, Pulse, mood, tagging)
- **Sonnet**: 30% of calls (deep classify, agents, drafts, complex Coach)

## Lever 3 — Batch API for async (50% off)

Anthropic Batch API: 50% cheaper, 24h SLA, perfect for background jobs.

### What to batch

| Job | Frequency | Why batch |
|---|---|---|
| Pulse pre-computation | End of every session | Has 2-12h until you next open the app |
| Mood snapshot generation | 7:55am, 1:55pm, 8:55pm cron | Runs minutes before display |
| Nightly Coach memory consolidation | 3am cron | All night to complete |
| Bulk email rescoring | Daily | After hours OK |

### Implementation

```ts
// convex/crons.ts — example
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "pulse-precompute",
  { hourUTC: 19, minuteUTC: 30 }, // 1am IST
  internal.pulse.batchPrecompute, // uses Anthropic batch API
);
```

## Lever 4 — Heuristics before Claude

Don't pay LLM rates when regex answers.

### Pre-classifier rules (cheap path)

```ts
// convex/lib/preClassifier.ts
export function tryHeuristic(input: string): HeuristicResult | null {
  // Rule: "remind me [time] to [action]"
  const reminderMatch = input.match(/^remind me (.+?) to (.+)$/i);
  if (reminderMatch) {
    return {
      tool: "create_reminder",
      args: parseReminder(reminderMatch[1], reminderMatch[2]),
      skipClaude: true,
    };
  }
  
  // Rule: "save this:" / "save:" / "note:"
  if (/^(save|note)( this)?:\s*/i.test(input)) {
    return {
      tool: "file_to_inbox",
      args: { tags: [], rawText: input.replace(/^(save|note)( this)?:\s*/i, "") },
      skipClaude: true,
    };
  }
  
  // Rule: single-word capture → file to inbox
  if (input.trim().split(/\s+/).length === 1 && input.length < 30) {
    return {
      tool: "file_to_inbox",
      args: { tags: [] },
      skipClaude: true,
    };
  }
  
  return null; // fall through to Claude
}
```

**Effect**: 15-20% of calls bypass Claude entirely.

## Embeddings — switch Voyage → OpenAI

### Numbers

| | Voyage voyage-3 | OpenAI text-embedding-3-small |
|---|---|---|
| Price per 1M tokens | $0.06 | **$0.02 (3x cheaper)** |
| Dimensions | 1024 | 1536 |
| Quality (notes search) | 95/100 | 92/100 |
| Vendor | new | already using for Whisper |

Schema dimension already updated: `1536`.

### Implementation

```ts
// convex/lib/embed.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    encoding_format: "float",
  });
  return res.data[0].embedding;
}
```

### Content-hash dedup

Already in schema (`contentHash` field). Implementation:

```ts
// Don't re-embed if content unchanged
async function maybeReembed(pageId: Id<"pages">, content: string) {
  const hash = sha256(content);
  const page = await ctx.db.get(pageId);
  if (page?.contentHash === hash) return; // skip
  const embedding = await embed(content);
  await ctx.db.patch(pageId, { embedding, contentHash: hash });
}
```

### Debounce re-embeds

Don't fire on every keystroke. 30-second post-edit debounce.

```ts
// Inactivity-based re-embed cron
crons.interval(
  "embed-queue-flush",
  { seconds: 30 },
  internal.embed.flushDirty,
);
```

**Effect**: 70-80% reduction in embedding costs on top of 3x cheaper provider.

## Gemini / Nano Banana — free-tier-first

### Tactics

1. **Free tier**: Gemini API gives 1500 requests/day free. Personal usage (~50-100 images/month) → free tier covers most or all.
2. **Cache by prompt+style hash**: same prompt twice = cached result.
3. **Resolution discipline**:
   - Moodboards / scratchpad: 512×512 default
   - Social drafts: 1024×1024
   - Presentation slides: 1920×1080 only when finalizing

### Image cache

```ts
// convex/lib/imageCache.ts
export async function generateOrCache(opts: {
  prompt: string;
  useCase: string;
  aspect: string;
}) {
  const hash = sha256(`${opts.prompt}::${opts.useCase}::${opts.aspect}`);
  const existing = await ctx.db.query("generatedImages")
    .filter(q => q.eq(q.field("promptHash"), hash))
    .first();
  if (existing) return existing.storageId;
  
  // Generate fresh
  const image = await callGemini({ /* ... */ });
  await ctx.db.insert("generatedImages", {
    promptHash: hash,
    /* ... */
  });
  return image.storageId;
}
```

(Add `promptHash: v.optional(v.string())` to `generatedImages` schema — minor patch.)

## Whisper — cache + scope

- Whisper only fires when Wispr Flow is off OR on mobile (already in plan).
- Cache by audio file SHA-256: rarely useful but free safety net.
- Hard cap $30/mo on OpenAI account (covers Whisper + embeddings combined).

## Convex — index hygiene

- **Lazy-load embeddings** in list views: don't fetch the 1536-float vector when rendering a sidebar of 20 page titles.
- **Avoid over-indexing**: each index has cost. Audit indexes monthly.
- **Soft-delete cleanup cron**: nightly, hard-delete `deletedAt` rows older than 30 days.
- **Compress BlockNote content**: BlockNote JSON is verbose. Optional gzip on Convex storage layer for pages > 50kb.

## Trust score compounding

The Coach pattern itself reduces Claude calls over time:

```
Trust < 30: Claude call to formulate question + apply
Trust 30-70: Claude call for action + card generation
Trust 70-90: Claude call only if pattern doesn't match memory exactly
Trust > 90: stored rule executes; Claude call only on edge cases
```

By month 3 with mature trust scores, **30-50% of routine decisions execute without any Claude call**.

## Hard caps (in code)

```ts
// convex/lib/budgetGuard.ts
const DAILY_CAPS = {
  anthropic: 5_00,    // $5.00/day soft, downgrade to Haiku-only past this
  gemini: 0_50,        // $0.50/day soft, pause image gen past this
  openai: 1_00,        // $1.00/day soft (Whisper + embeddings combined)
} as const;

export async function checkBudget(provider: keyof typeof DAILY_CAPS) {
  const today = new Date().toISOString().slice(0, 10);
  const usage = await ctx.db.query("apiUsage")
    .withIndex("by_provider_day", q => q.eq("provider", provider).eq("day", today))
    .collect();
  const total = usage.reduce((s, u) => s + u.cost, 0);
  return {
    overSoftCap: total >= DAILY_CAPS[provider],
    spent: total,
    cap: DAILY_CAPS[provider],
  };
}
```

When over: omnibox auto-downgrades to Haiku-only, image gen pauses with a banner, no feature is broken.

## Updated daily budget caps

| Provider | Old daily | New daily | Old monthly | New monthly cap |
|---|---|---|---|---|
| Anthropic | $10 | **$5** | $200 | **$100** |
| Gemini | $5 | **$0.50** | $50 | **$10** |
| OpenAI | $1 | **$1** | $20 | **$30** (covers Whisper + embed) |

## Day 1 quickstart impact

- ❌ **Skip Block 1E** (Voyage signup) — saves 5 min, avoids subscription.
- ✏️ **Block 1G (OpenAI)**: set hard limit to **$30/mo** (was $20).
- ✏️ **Block 1F (Gemini)**: set budget alert to **$10/mo** (was $50).
- ✏️ **Block 1C (Anthropic)**: set monthly cap to **$100/mo** (was $200) — daily notification at $5 (was $10).

## Implementation phasing

| Phase | Cost lever | When |
|---|---|---|
| Day 2 | Switch embedding provider to OpenAI in `convex/lib/embed.ts` | Required Day 1 setup change |
| Day 6 | Heuristic pre-classifier in omnibox | When classifier ships |
| Day 6 | Prompt caching on classifier system prompt | Same day |
| Day 7 | Trust-score gating reducing redundant Claude calls | When Coach gate ships |
| Day 14 | Batch API for email urgency rescoring | When mail integration ships |
| Day 16 | Image cache + resolution defaults | When image gen wires in |
| Day 18 | Prompt caching on all agent system prompts | When agents ship |
| Day 21 | Batch API for Pulse pre-computation + mood snapshots | When daily flow ships |
| Day 27 | Hard caps + auto-downgrade in code | When monitoring ships |

No new days added. All optimizations slot into existing build days.
