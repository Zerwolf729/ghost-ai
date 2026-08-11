# Ghost AI Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix AI editor issues: Delete key, AI timeout/retry, loading lifecycle, Spec Preview, connector spacing/labels.

**Architecture:** Reactive canvas/AI UI; Trigger.dev task queue.

**Tech Stack:** Next.js, React, Liveblocks, Trigger.dev, Prisma, Vercel Blob.

## Global Constraints

- 50px connector spacing.
- One label per connector.
- No null `.length` crashes.
- No Liveblocks mutation before storage load.

---

### Task 1: Fix Delete Key Canvas Deletion

**Files:**
- Modify: `components/editor/canvas/canvas-editor.tsx`

**Interfaces:**
- Consumes: ReactFlow `onDelete`
- Produces: Corrected multi-shape deletion

- [ ] Step 1: Add `onDelete` handler to `ReactFlow` if missing or broken.
- [ ] Step 2: Ensure `Delete` key maps correctly.
- [ ] Step 3: Run deletion tests: single, multi-select.
- [ ] Step 4: Commit.

### Task 2: Optimize Design Agent & Timeout

**Files:**
- Modify: `src/trigger/design-agent.ts`

**Interfaces:**
- Consumes: AI prompt
- Produces: Deterministic layout, reduced token usage

- [ ] Step 1: Analyze `design-agent.ts` for inefficiencies.
- [ ] Step 2: Implement prompt compaction.
- [ ] Step 3: Refine schema/retry logic.
- [ ] Step 4: Commit.

### Task 3: Implement AI Loading Lifecycle

**Files:**
- Modify: `components/editor/ai/ai-sidebar.tsx`
- Modify: `components/editor/ai/ai-status-room-listener.tsx`

**Interfaces:**
- Consumes: Liveblocks AI events
- Produces: Deterministic AI status

- [ ] Step 1: Normalize AI status states (processing, completed, failed).
- [ ] Step 2: Ensure loading stops on all terminal states.
- [ ] Step 3: Fix duplicate status broadcasting.
- [ ] Step 4: Commit.

### Task 4: Fix Generate Spec Runtime Error

**Files:**
- Modify: `src/trigger/generate-spec.ts`

**Interfaces:**
- Consumes: Canvas payload
- Produces: Validated chat history array

- [ ] Step 1: Add defensive array validation for `chatHistory`, `nodes`, `edges`.
- [ ] Step 2: Ensure safe normalization.
- [ ] Step 3: Commit.

### Task 5: Fix Spec Preview Load Failure

**Files:**
- Modify: `components/editor/ai/ai-sidebar.tsx`
- Modify: `app/api/projects/[projectId]/specs/[specId]/route.ts` (if exists, else create)

**Interfaces:**
- Consumes: Spec ID
- Produces: Securely retrieved Markdown content

- [ ] Step 1: Trace `openPreview()` flow.
- [ ] Step 2: Implement server-side retrieval for private blobs.
- [ ] Step 3: Ensure correct content-type handling.
- [ ] Step 4: Commit.

### Task 6: Fix Connector Labeling and Spacing

**Files:**
- Modify: `components/editor/canvas/custom-canvas-edge.tsx`
- Modify: `components/editor/canvas/canvas-editor.tsx`

**Interfaces:**
- Consumes: Edge geometry
- Produces: ~50px separation

- [ ] Step 1: Deduplicate edges.
- [ ] Step 2: Ensure one label per edge.
- [ ] Step 3: Implement label de-collision logic in `computeLabelOffsets`.
- [ ] Step 4: Commit.
