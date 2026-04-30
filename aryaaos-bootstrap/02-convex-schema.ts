// AryaaOS — Convex schema v1
// Paste into convex/schema.ts of awish4u-jpg/aryaaos.
//
// Design principles:
// - Every record carries `org` and `private` from Day 1 (no painful migrations later).
// - Every record carries an `embedding` field (populated lazily; falls back to FTS).
// - Soft deletes via `deletedAt` (not destructive). Hard delete is a separate admin job.
// - `createdBy` / `updatedBy` for audit trail.
// - Inbox + omnibox classification are first-class entities, not bolted on.

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Reusable enums
const orgEnum = v.union(v.literal("layer1"), v.literal("personal"));
const modeEnum = v.union(v.literal("stage"), v.literal("default"), v.literal("solo"));
const ideaStatusEnum = v.union(
  v.literal("active"),
  v.literal("parked"),
  v.literal("untouched"),
);
const actionStatusEnum = v.union(
  v.literal("pending"),
  v.literal("accepted"),
  v.literal("rejected"),
  v.literal("auto_applied"),
  v.literal("expired"),
);
const actionTierEnum = v.union(
  v.literal("silent"),
  v.literal("card"),
  v.literal("hard_confirm"),
);
const personalPillarEnum = v.union(
  v.literal("health"),
  v.literal("family"),
  v.literal("finance"),
  v.literal("goals"),
  v.literal("reading"),
  v.literal("sports"),
  v.literal("travel"),
  v.literal("ideas"),
  v.literal("inbox"),
);

export default defineSchema({
  // ----- Identity -----
  users: defineTable({
    email: v.string(),
    name: v.string(),
    msAccountId: v.optional(v.string()), // Microsoft SSO subject
    avatarUrl: v.optional(v.string()),
    role: v.union(v.literal("owner"), v.literal("teammate")),
    preferredMode: modeEnum,
    settings: v.object({
      morningBriefTime: v.string(), // "08:00"
      afternoonNudgeTime: v.string(), // "14:00"
      eveningReviewTime: v.string(), // "21:00"
      timezone: v.string(),
    }),
    createdAt: v.number(),
  }).index("by_email", ["email"])
    .index("by_msAccountId", ["msAccountId"]),

  // ----- Pages (hierarchical, BlockNote content) -----
  pages: defineTable({
    title: v.string(),
    icon: v.optional(v.string()),
    coverImageUrl: v.optional(v.string()),
    parentId: v.optional(v.id("pages")),
    order: v.number(),
    org: orgEnum,
    private: v.boolean(),
    pillar: v.optional(personalPillarEnum), // for personal/org=personal
    contentJson: v.any(), // BlockNote document
    aiSummary: v.optional(v.string()),
    aiTags: v.array(v.string()),
    embedding: v.optional(v.array(v.float64())),
    contentHash: v.optional(v.string()), // dedup re-embed
    createdBy: v.id("users"),
    updatedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_parent", ["parentId", "order"])
    .index("by_org_pillar", ["org", "pillar"])
    .index("by_private", ["private"])
    .searchIndex("search_title", {
      searchField: "title",
      filterFields: ["org", "private", "deletedAt"],
    })
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024, // Voyage voyage-3
      filterFields: ["org", "private"],
    }),

  // ----- Notion-style databases -----
  databases: defineTable({
    name: v.string(),
    icon: v.optional(v.string()),
    org: orgEnum,
    private: v.boolean(),
    parentPageId: v.optional(v.id("pages")),
    fields: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(
          v.literal("text"),
          v.literal("number"),
          v.literal("select"),
          v.literal("multi_select"),
          v.literal("date"),
          v.literal("person"),
          v.literal("relation"),
          v.literal("file"),
          v.literal("ai"),
          v.literal("formula"),
          v.literal("rollup"),
        ),
        config: v.optional(v.any()), // options for select, formula expr, etc.
      }),
    ),
    views: v.array(
      v.object({
        id: v.string(),
        name: v.string(),
        type: v.union(v.literal("table"), v.literal("kanban")), // v1: table + kanban only
        groupByFieldId: v.optional(v.string()),
        sortBy: v.optional(v.array(v.object({ fieldId: v.string(), direction: v.string() }))),
        filterBy: v.optional(v.any()),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_org", ["org"]),

  databaseRows: defineTable({
    databaseId: v.id("databases"),
    org: orgEnum,
    private: v.boolean(),
    data: v.any(), // { fieldId: value }
    aiSummary: v.optional(v.string()),
    aiTags: v.array(v.string()),
    embedding: v.optional(v.array(v.float64())),
    contentHash: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
    deletedAt: v.optional(v.number()),
  })
    .index("by_database", ["databaseId"])
    .index("by_org_private", ["org", "private"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["org", "private", "databaseId"],
    }),

  // ----- Inbox (capture-first) -----
  inboxItems: defineTable({
    rawText: v.string(),
    source: v.union(
      v.literal("omnibox_text"),
      v.literal("omnibox_voice_whispr"),
      v.literal("omnibox_voice_whisper"),
      v.literal("granola_meeting"),
      v.literal("email_forward"),
      v.literal("manual"),
    ),
    transcriptionConfidence: v.optional(v.number()),
    org: v.optional(orgEnum), // unset until classified
    private: v.optional(v.boolean()),
    classificationStatus: v.union(
      v.literal("unclassified"),
      v.literal("classifying"),
      v.literal("classified"),
      v.literal("failed"),
    ),
    classifierRunId: v.optional(v.id("omniboxRuns")),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.id("users"),
  })
    .index("by_status", ["classificationStatus"])
    .index("by_created", ["createdAt"]),

  // ----- Omnibox: Claude routing layer -----
  omniboxRuns: defineTable({
    inboxItemId: v.id("inboxItems"),
    inputText: v.string(),
    contextSnapshot: v.any(), // active mode, recent pages, current proposals etc.
    claudeRequest: v.any(),
    claudeResponse: v.any(),
    proposedActions: v.array(v.id("omniboxActions")),
    classification: v.optional(
      v.object({
        org: orgEnum,
        pillar: v.optional(personalPillarEnum),
        confidence: v.number(),
        reasoning: v.string(),
      }),
    ),
    runtimeMs: v.number(),
    tokensIn: v.number(),
    tokensOut: v.number(),
    cost: v.number(),
    createdAt: v.number(),
  }).index("by_inbox_item", ["inboxItemId"]),

  omniboxActions: defineTable({
    runId: v.id("omniboxRuns"),
    inboxItemId: v.id("inboxItems"),
    tier: actionTierEnum,
    status: actionStatusEnum,
    tool: v.string(), // e.g. "create_subtask", "update_odoo_record"
    args: v.any(),
    summary: v.string(), // human-readable diff
    appliedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    rejectionNote: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_run", ["runId"]),

  // ----- Tasks (with subtasks + delegation) -----
  tasks: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    org: orgEnum,
    private: v.boolean(),
    pillar: v.optional(personalPillarEnum),
    parentTaskId: v.optional(v.id("tasks")), // subtasks
    linkedPageId: v.optional(v.id("pages")),
    linkedProposalId: v.optional(v.id("proposals")),
    linkedClientId: v.optional(v.id("clients")),
    assignedTo: v.optional(v.id("users")), // delegation
    dueDate: v.optional(v.number()),
    status: v.union(
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("blocked"),
      v.literal("done"),
      v.literal("cancelled"),
    ),
    priority: v.union(v.literal("low"), v.literal("med"), v.literal("high")),
    lastMovedAt: v.number(), // for 2pm nudge ("not moved today")
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status", "dueDate"])
    .index("by_assignee", ["assignedTo", "status"])
    .index("by_parent", ["parentTaskId"])
    .index("by_org_pillar", ["org", "pillar"]),

  // ----- Reminders -----
  reminders: defineTable({
    text: v.string(),
    triggerAt: v.number(),
    triggered: v.boolean(),
    org: orgEnum,
    private: v.boolean(),
    linkedPageId: v.optional(v.id("pages")),
    linkedTaskId: v.optional(v.id("tasks")),
    createdAt: v.number(),
  }).index("by_trigger_pending", ["triggered", "triggerAt"]),

  // ----- Ideas (your specific request) -----
  ideas: defineTable({
    title: v.string(),
    body: v.string(),
    status: ideaStatusEnum,
    org: orgEnum,
    private: v.boolean(),
    promotedToPageId: v.optional(v.id("pages")), // if "build on it"
    promotedToTaskId: v.optional(v.id("tasks")),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status", "updatedAt"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1024,
      filterFields: ["org"],
    }),

  // ----- Layer 1 work entities -----
  clients: defineTable({
    name: v.string(),
    odooContactId: v.optional(v.number()),
    industry: v.optional(v.string()),
    primaryContactName: v.optional(v.string()),
    primaryContactEmail: v.optional(v.string()),
    primaryContactPhone: v.optional(v.string()),
    notes: v.optional(v.string()),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_odoo", ["odooContactId"]),

  vendors: defineTable({
    name: v.string(),
    odooContactId: v.optional(v.number()),
    category: v.array(v.string()),
    pricingNotes: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    datasheets: v.array(v.id("_storage")),
    priorProjectIds: v.array(v.id("proposals")),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_odoo", ["odooContactId"]),

  proposals: defineTable({
    clientId: v.id("clients"),
    title: v.string(),
    stage: v.union(
      v.literal("brief"),
      v.literal("scoping"),
      v.literal("drafting"),
      v.literal("submitted"),
      v.literal("won"),
      v.literal("lost"),
    ),
    valueRange: v.optional(v.object({ min: v.number(), max: v.number(), currency: v.string() })),
    pageId: v.optional(v.id("pages")),
    dueDate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_client", ["clientId"]).index("by_stage", ["stage"]),

  pipelineDeals: defineTable({
    clientId: v.id("clients"),
    odooLeadId: v.optional(v.number()),
    title: v.string(),
    stage: v.string(),
    valueCrore: v.optional(v.number()),
    nextAction: v.optional(v.string()),
    nextActionDue: v.optional(v.number()),
    proposalId: v.optional(v.id("proposals")),
    updatedAt: v.number(),
  }).index("by_stage", ["stage"]).index("by_odoo", ["odooLeadId"]),

  // ----- Meetings (Granola + calendar) -----
  meetings: defineTable({
    title: v.string(),
    org: orgEnum,
    private: v.boolean(),
    startTime: v.number(),
    endTime: v.number(),
    source: v.union(
      v.literal("outlook"),
      v.literal("google"),
      v.literal("granola"),
      v.literal("manual"),
    ),
    externalId: v.optional(v.string()), // dedup across outlook+google
    attendees: v.array(
      v.object({
        name: v.string(),
        email: v.optional(v.string()),
        userId: v.optional(v.id("users")),
      }),
    ),
    granolaTranscript: v.optional(v.string()),
    granolaSummary: v.optional(v.string()),
    actionItems: v.array(v.id("tasks")), // extracted by MeetingAgent
    linkedClientId: v.optional(v.id("clients")),
    linkedProposalId: v.optional(v.id("proposals")),
    embedding: v.optional(v.array(v.float64())),
    createdAt: v.number(),
  })
    .index("by_start_org", ["org", "startTime"])
    .index("by_external", ["externalId"]),

  // ----- Files -----
  files: defineTable({
    name: v.string(),
    storageId: v.id("_storage"),
    mimeType: v.string(),
    size: v.number(),
    org: orgEnum,
    private: v.boolean(),
    linkedPageId: v.optional(v.id("pages")),
    linkedRowId: v.optional(v.id("databaseRows")),
    oneDrivePath: v.optional(v.string()), // mirror path in Layer 1/AryaaOS/Files/
    aiCaption: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_page", ["linkedPageId"]),

  // ----- Generated images (Nano Banana) -----
  generatedImages: defineTable({
    prompt: v.string(),
    storageId: v.id("_storage"),
    useCase: v.union(
      v.literal("proposal_cover"),
      v.literal("vendor_moodboard"),
      v.literal("personal_creative"),
      v.literal("social_draft"),
      v.literal("presentation_slide"),
    ),
    org: orgEnum,
    linkedPageId: v.optional(v.id("pages")),
    cost: v.number(),
    createdAt: v.number(),
  }).index("by_use_case", ["useCase"]),

  // ----- Activity / audit -----
  activity: defineTable({
    actorId: v.id("users"),
    action: v.string(), // "page.created", "task.delegated", "omnibox.action.accepted"
    targetType: v.string(),
    targetId: v.string(),
    org: orgEnum,
    private: v.boolean(),
    metadata: v.any(),
    createdAt: v.number(),
  }).index("by_target", ["targetType", "targetId"]).index("by_actor_time", ["actorId", "createdAt"]),

  // ----- Cost tracking (hard caps) -----
  apiUsage: defineTable({
    provider: v.union(
      v.literal("anthropic"),
      v.literal("gemini"),
      v.literal("voyage"),
      v.literal("openai_whisper"),
    ),
    model: v.string(),
    feature: v.string(), // "omnibox_classify", "agent_proposal", "image_gen"
    tokensIn: v.optional(v.number()),
    tokensOut: v.optional(v.number()),
    cost: v.number(),
    day: v.string(), // "2026-04-30"
    createdAt: v.number(),
  }).index("by_provider_day", ["provider", "day"]),

  // ----- Integrations config -----
  integrations: defineTable({
    name: v.union(
      v.literal("microsoft_graph"),
      v.literal("google_calendar"),
      v.literal("odoo"),
      v.literal("granola"),
      v.literal("wispr_flow"),
      v.literal("github"),
    ),
    status: v.union(v.literal("connected"), v.literal("disconnected"), v.literal("error")),
    lastSyncedAt: v.optional(v.number()),
    config: v.any(), // OAuth refresh tokens stored encrypted via env, not here
    errorMessage: v.optional(v.string()),
  }).index("by_name", ["name"]),

  // ----- Skills (Claude agent skills) -----
  skills: defineTable({
    name: v.string(),
    description: v.string(),
    triggerKeywords: v.array(v.string()),
    promptBody: v.string(),
    repo: v.optional(v.string()),
    version: v.string(),
    enabled: v.boolean(),
    updatedAt: v.number(),
  }).index("by_name", ["name"]),
});
