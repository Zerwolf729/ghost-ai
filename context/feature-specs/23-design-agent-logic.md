Implement the full AI design agent so a user prompt results in real-time updates on the collaborative canvas, with visible AI presence and status.

## Implementation

1. Update the design agent task in `trigger/design-agent.ts`.

Before implementing:
- check `context/project-overview.md` and `context/architecture-context.md` for product behavior and system rules
- check Liveblocks and Trigger.dev agent skills for current patterns on canvas mutation and background task execution
- follow the existing Trigger.dev setup and agent patterns already in the project
- reuse existing Liveblocks flow and presence patterns instead of creating new ones
- inspect the existing AI integration and reuse it instead of creating a new provider abstraction

Then implement:
- use OpenRouter as the LLM provider
- use the AI SDK with OpenRouter (or the existing OpenRouter client already used in the project)
- use the model **`cohere/north-mini-code:free`**
- do not use Gemini or `@ai-sdk/google`
- use the existing `OPENROUTER_API_KEY` from `.env.local`
- do not hardcode API keys or duplicate provider configuration

- update the canvas using the existing collaborative flow utilities
- support actions like:
  - add node
  - move node
  - resize node
  - update node data
  - delete node
  - add edge
  - delete edge

- publish AI activity to the shared status feed so all users see progress
- update AI presence (cursor + thinking state) while the task runs
- push clear status messages at key steps (start, processing, complete)

- ensure generated designs follow:
  - allowed node shapes
  - color palette
  - layout and spacing rules

- handle errors gracefully and update status if something fails
- clear AI presence when the task finishes

## Dependencies

All required packages are already installed.
Use the existing `OPENROUTER_API_KEY` from `.env.local`.
Use the OpenRouter model `cohere/north-mini-code:free`.
Do not introduce Gemini dependencies.

## Scope Limits

- don't change canvas architecture
- don't introduce a new state system outside Liveblocks
- don't bypass existing collaborative flow utilities
- don't replace the existing AI integration if one already exists

## Check When Done

- Design task updates the canvas through the existing collaborative flow.
- AI presence and status are visible to all participants.
- Status messages reflect task progress.
- Errors are handled without breaking the canvas.
- Prompt interpretation uses OpenRouter with `cohere/north-mini-code:free`.
- `npm run build` passes.