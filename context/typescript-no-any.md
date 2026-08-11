# TypeScript Guidelines

## Objective

Maintain a strict TypeScript codebase.

Never use `any` in any `.ts` or `.tsx` file.

Improve type safety without changing existing logic, architecture, behavior, UI, or UX.

---

## Rules

### 1. Never use `any`

The following are prohibited:

```ts
any
```

```ts
const value: any
```

```ts
function foo(arg: any)
```

```ts
catch (err: any)
```

```ts
useState<any>()
```

```ts
useRef<any>()
```

```ts
Promise<any>
```

```ts
Record<string, any>
```

Never introduce new `any`.

Whenever an existing `any` is found, replace it with an appropriate type.

---

### 2. Prefer existing types

Before creating a new interface or type, search the project first.

Reuse existing types from:

- Prisma
- Clerk
- Liveblocks
- React Flow
- Trigger.dev
- Zod
- Shared project interfaces

Avoid duplicate types.

---

### 3. Use the correct replacement

Choose the most appropriate replacement depending on the situation.

| Instead of | Prefer |
|------------|--------|
| `any` | Explicit interface |
| `any[]` | `User[]`, `Node[]`, `Edge[]`, etc. |
| `Promise<any>` | `Promise<T>` |
| `Record<string, any>` | `Record<string, unknown>` or a typed interface |
| `useState<any>` | `useState<Project \| null>` |
| `useRef<any>` | `useRef<HTMLDivElement>(null)` |
| `props: any` | Typed props interface |
| `callback(any)` | Typed callback parameter |
| `catch (err: any)` | `catch (err: unknown)` |

---

### 4. Use `unknown` instead of `any`

If the runtime type is unknown:

```ts
const result: unknown = await response.json();
```

Always narrow the type before using it.

Example:

```ts
if (result instanceof Error) {
  console.error(result.message);
}
```

---

### 5. Use Generics

Prefer:

```ts
function clone<T>(value: T): T
```

instead of

```ts
function clone(value: any)
```

---

### 6. Infer types from Zod

Never duplicate schema types.

Prefer:

```ts
type Input = z.infer<typeof schema>;
```

---

### 7. Proper Fetch typing

Never do:

```ts
const data: any = await response.json();
```

Instead:

```ts
interface ApiResponse {
  ...
}

const data: ApiResponse = await response.json();
```

---

### 8. Proper Error Handling

Never:

```ts
catch (err: any)
```

Always:

```ts
catch (err: unknown) {
  if (err instanceof Error) {
    console.error(err.message);
  } else {
    console.error(err);
  }
}
```

---

### 9. React types

Use proper React types.

Examples:

- `React.MouseEvent`
- `React.KeyboardEvent`
- `React.ChangeEvent<HTMLInputElement>`
- `React.FormEvent`

Never use `any` for event handlers.

---

### 10. Preserve Existing Behavior

Type improvements must **never**:

- change business logic
- change architecture
- change API contracts
- change database schema
- change component behavior
- change collaborative flow
- change Liveblocks behavior
- change Trigger.dev behavior
- change UI
- change UX

Only improve type safety and maintainability.

---

## Validation Checklist

Before completing any implementation:

- No `any` exists in modified files.
- No new `any` is introduced.
- Existing `any` is replaced with proper types.
- Existing project types are reused whenever possible.
- `unknown` is used instead of `any` when appropriate.
- Generics are used where applicable.
- Zod types use `z.infer`.
- TypeScript passes without errors.
- ESLint passes.
- `npm run build` passes.

Type safety is mandatory throughout the project.