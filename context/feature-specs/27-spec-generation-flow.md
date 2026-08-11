# 27-spec-generation-flow

Create the backend flow for AI-powered spec generation: API route, Trigger.dev task, token route, and run ownership tracking.

## Implementation

### 1. Spec trigger route

Create or update `POST /api/ai/spec`.

It should:

- accept `roomId`, `chatHistory`, `nodes`, and `edges`
- authenticate the current user
- resolve project access from `roomId`
- trigger the `generate-spec` task
- save a `TaskRun` record for ownership/access control
- return the Trigger.dev `runId`

Do not trust a client-supplied `projectId`.

---

### 2. Spec token route

Create or update `POST /api/ai/spec/token`.

It should:

- accept `runId`
- authenticate the current user
- verify the `TaskRun` belongs to the user
- issue a Trigger.dev public access token scoped to that run
- set token expiration to 1 hour
- return the token to the client

---

### 3. Spec generation task

Create or update `trigger/generate-spec.ts`.

Before implementing:

- check `context/project-overview.md` and `context/architecture-context.md`
- check Trigger.dev skills for the latest task patterns
- check the existing AI integration in the project
- reuse the existing OpenRouter client/provider instead of creating another AI abstraction
- follow the existing Trigger.dev task architecture

Define a `generateSpec` task that:

- accepts `projectId`, `roomId`, `chatHistory`, `nodes`, and `edges`
- validates all inputs with Zod
- uses **OpenRouter** as the LLM provider
- uses the AI SDK with the existing OpenRouter client
- uses the model **`cohere/north-mini-code:free`**
- uses the existing `OPENROUTER_API_KEY` from `.env.local`
- does not use Gemini or `@ai-sdk/google`
- does not duplicate provider configuration
- generates a Markdown technical specification from the canvas structure and chat history
- updates Trigger.dev run metadata and status for realtime tracking
- returns the generated Markdown spec as the task output

Follow the existing Trigger.dev task patterns for:

- retries
- logging
- metadata
- progress updates
- error handling

---

## Scope Limits

- do not add frontend logic
- do not create a spec editor UI
- do not store the generated spec in this unit
- do not derive project access from client-provided `projectId`
- do not create a new AI provider abstraction
- do not replace the existing AI integration
- do not change the canvas or chat data models

---

## Dependencies

All required packages are already installed.

Use:

- existing `OPENROUTER_API_KEY` from `.env.local`
- existing OpenRouter client/provider
- model: `cohere/north-mini-code:free`

Do not introduce Gemini dependencies.

---

## Notes

- reuse existing authentication
- reuse existing Prisma models
- reuse existing Trigger.dev patterns
- reuse the existing OpenRouter integration
- validate every request using Zod
- use Prisma for `TaskRun` persistence
- resolve project ownership from the authenticated user and `roomId`
- keep the generated specification as plain Markdown

---

## Check When Done

- `POST /api/ai/spec` validates input and returns a Trigger.dev `runId`
- A `TaskRun` record is created for the authenticated user
- `POST /api/ai/spec/token` only returns a token for the run owner
- `generate-spec` runs through Trigger.dev using OpenRouter
- Prompt generation uses `cohere/north-mini-code:free`
- Generated output is plain Markdown
- TypeScript passes
- `npm run build` passes