Read @AGENTS.md and @context md files

Verify each finding against current code. Fix only still-valid issues, skip the
rest with a brief reason, keep changes minimal, and validate.

Inline comments:
In @.agents/skills/clerk-backend-api/scripts/api-specs-context.sh:
- Around line 12-13: The script uses silent curl fetches without checking for
HTTP failures and assumes at least one version is discovered without validation.
Add explicit error handling checks after the curl commands at the fetch
operations to detect and fail on HTTP errors or empty responses, and add
validation before processing versions at the line range 24-31 to ensure at least
one version exists before attempting to parse or iterate over them. These
fail-fast checks will prevent silent failures and opaque downstream errors when
version discovery fails.

In @.agents/skills/clerk-backend-api/scripts/execute-request.sh:
- Around line 52-53: The scope validation checks in the execute-request.sh
script use substring matching (checking if "write" exists anywhere in SCOPES)
which can be bypassed by values like "overwrite". Replace the substring-based
scope checks (the `!=` condition with `*"write"*` pattern and similarly the
delete scope check) with delimiter-aware scope validation that treats scopes as
individual tokens rather than free substrings, ensuring that only actual scope
values like "write" or "delete" are recognized, not partial matches within other
words.
- Around line 72-74: The BASE_URL variable assignment uses the non-standard
environment variable CLERK_REST_API_URL instead of the documented
CLERK_BACKEND_API_URL. Update the parameter expansion in the BASE_URL assignment
to read from CLERK_BACKEND_API_URL (with the same fallback default to
https://api.clerk.com) to match the documented contract and ensure configuration
overrides work as expected.
- Around line 76-88: The curl command in the execute-request.sh script does not
fail when the Clerk API returns HTTP 4xx or 5xx error responses, causing
false-positive successes. Add the curl `--fail` flag to the CURL_ARGS array to
make curl exit with a non-zero status code when the API returns error HTTP
status codes. This ensures that downstream automation properly detects and
handles API failures.
- Around line 18-23: The `source "$_envfile"` command in the for loop that
processes .env files (iterating through "$_dir/.env" and "$_dir/.env.local")
executes arbitrary shell content from these files, creating a command execution
security risk in untrusted repositories. Replace the sourcing approach with a
safer pattern that parses only the specific environment variables needed for the
request execution, instead of executing the entire file content.

In @.agents/skills/clerk-backend-api/scripts/extract-tags.js:
- Line 7: The exact equality check for `line === "tags:"` at the inTags
assignment will fail if the line contains trailing whitespace. Update the
condition to use a regex pattern that allows optional trailing whitespace,
similar to how extract-tag-endpoints.sh handles this case with
`/^tags:\s*$/.test(trimmed)`, ensuring the tags detection works consistently
regardless of whitespace on the line.
- Around line 10-11: The console.log statement at line 11 outputs the raw
captured group m[1] without processing it to remove surrounding quotes or
trailing whitespace. Modify the console.log call to apply two transformations to
m[1]: first trim any leading or trailing whitespace using the trim() method,
then remove surrounding quotes using the replace method with the regex pattern
/^['"]|['"]$/g to strip both single and double quotes from the start and end of
the string, matching the approach used in the related extract-tag-endpoints.sh
script.

In @.agents/skills/clerk-backend-api/SKILL.md:
- Around line 155-159: Add language identifiers to all unlabeled fenced code
blocks in the SKILL.md file to resolve markdownlint warnings (MD040). For each
fenced code block (marked with triple backticks), add the appropriate language
identifier immediately after the opening backticks: use `http` for HTTP
request/response examples, `text` for plain text output, or `bash` for shell
commands. Apply this fix to all affected code blocks at the following locations:
lines 155-159 (the main GET /v1/users endpoint block), lines 162-165, 168-171,
174-178, 184-188, 191-194, 197-201, and 323-342. Ensure each block has an
explicit language tag to make the documentation lint-clean.
- Around line 17-21: The current command in the CLERK_SECRET_KEY verification
step uses echo to output the secret key variable (even truncated), which leaks
sensitive material into logs and transcripts. Replace the `echo
$CLERK_SECRET_KEY | head -c 10` command with a safe alternative that only
verifies the presence of the environment variable without printing any part of
it. For example, use a conditional test that confirms the variable is set (such
as checking if it is non-empty) and outputs only a message indicating whether
the key exists or not, never the actual key bytes.

In @.agents/skills/clerk-cli/references/recipes.md:
- Line 216: The example command uses an incorrect Clerk Platform API endpoint
path. Change the API path from `/v1/platform/applications/app_abc123` to
`/v1/applications/app_abc123` because the `/v1/platform/applications/` prefix
structure is only for listing all applications, while individual resource
fetches require the simpler `/v1/applications/` prefix. The current path will
result in a 404 error when executed.

In @.agents/skills/clerk-nextjs-patterns/evals/evals.json:
- Around line 44-54: The eval `#4` in the evals.json file references middleware.ts
in the assertions and expected_output, but the actual template uses proxy.ts
instead. Update the expected_output field on line 46 to reference proxy.ts
instead of middleware.ts, and review any assertion text that mentions
middleware.ts to ensure it reflects the correct filename proxy.ts that exists in
the template. This will align the eval instructions with the actual template
structure that users will be working with.

In @.agents/skills/clerk-nextjs-patterns/references/caching-auth.md:
- Line 9: Remove the deprecated import statement for unstable_cache from the
documentation file and update all code examples and explanations to use the "use
cache" directive instead. Replace the import statement at the top of the file
and update any example code blocks that demonstrate caching patterns to use the
modern "use cache" declarative approach as the recommended pattern for Next.js
16 and later, emphasizing this as the current best practice for caching in
Server Components.

In @.agents/skills/clerk-nextjs-patterns/SKILL.md:
- Around line 118-126: The Common Pitfalls table has a column count mismatch
caused by unescaped pipe characters in the cell content. In the row with "Auth
not working on API routes," the Fix cell contains the pattern '/(api|trpc)(.*)',
where the pipe characters `|` are not escaped and are being interpreted as table
cell separators instead of literal content. Escape these pipes by replacing `|`
with `\|` in that cell. Verify all remaining rows have exactly 3 cells separated
by pipes, ensuring no other special characters are accidentally creating extra
cells.

In
@.agents/skills/clerk-nextjs-patterns/templates/nextjs-basic-auth/package.json:
- Around line 5-15: Replace all "latest" version specifiers in the dependencies
and devDependencies sections with pinned versions or semantic version ranges.
For each package in the dependencies object (next, react, react-dom,
`@clerk/nextjs`) and devDependencies object (typescript, `@types/react`,
`@types/react-dom`), specify actual version numbers or ranges like "^1.2.3" or
"~1.2.3" based on the versions used and tested in the main application to ensure
template reproducibility and prevent unexpected breaking changes for users.

In
@.agents/skills/clerk-nextjs-patterns/templates/nextjs-basic-auth/tsconfig.json:
- Around line 17-19: The paths configuration in tsconfig.json has the `@/`* alias
pointing to ./src/*, but the template uses Next.js 13+ App Router which places
files in ./app/. Update the paths object to point the `@/`* alias to ./app/*
instead to ensure proper module resolution for developers using this template.

In @.agents/skills/clerk-setup/SKILL.md:
- Around line 293-303: The Common Pitfalls table in the SKILL.md file has
unescaped pipe characters within code blocks that break Markdown table
rendering. In the Solution cells for the "Missing middleware matcher" row and
the "Landing page requires auth" row, the matcher patterns contain pipe
characters (|) inside backticks that need to be escaped. Replace the unescaped
pipes with escaped pipes (\|) in both Solution cells so the Markdown parser
correctly treats them as part of the cell content rather than column delimiters.
Ensure all rows have exactly 2 cells after escaping.

In `@app/editor/page.tsx`:
- Line 11: Fix invalid Tailwind class names that use incorrect double prefixes
throughout the codebase. In app/editor/page.tsx line 11, replace the class name
text-text-secondary with text-secondary. In context/progress-tracker.md lines
50-55, update documentation references to non-existent class names (such as
text-copy-primary, text-copy-muted, border-surface-border) to use the correct
canonical theme names (text-primary, text-secondary, text-muted, text-faint for
text colors and bg-base, bg-surface, bg-elevated, bg-subtle for backgrounds). In
context/ui-context.md line 29, correct any references to non-existent class
names like text-brand or text-copy-muted to match the actual theme configuration
defined in tailwind.config.ts.

In `@components/editor/project-sidebar.tsx`:
- Around line 178-200: The current guard condition onRename && onDelete prevents
rendering of both the rename and delete buttons unless both handlers are
provided. Since these props are optional independently, the wrapper div should
be conditional on whether at least one handler exists (onRename || onDelete),
and then each Button component should be rendered based on its own individual
condition. Modify the structure so the Pencil button is wrapped with {onRename
&& ...} and the Trash2 button is wrapped with {onDelete && ...}, allowing them
to render independently based on their respective handlers.

In `@proxy.ts`:
- Around line 5-17: The isPublic route matcher uses exact path matching with
createRouteMatcher(["/sign-in", "/sign-up"]) which fails to match nested auth
paths like "/sign-in/callback". Since the application defines catch-all routes
using patterns like app/sign-in/[[...sign-in]]/page.tsx and
app/sign-up/[[...sign-up]]/page.tsx, these nested authentication routes will
incorrectly be treated as protected and forced through auth.protect(), breaking
Clerk's authentication flows. Update the isPublic route matcher to use wildcard
or pattern-based matching that covers both the root paths (/sign-in, /sign-up)
and all their nested children (e.g., /sign-in/callback, /sign-in/verify, etc.)
so that all Clerk authentication flows are properly recognized as public routes.

In `@tailwind.config.ts`:
- Around line 14-17: The background color mappings in tailwind.config.ts have
been updated to use the new --color-* naming convention, but the border, text,
accent, and state color mappings still reference old variable names that do not
exist in app/globals.css, causing Tailwind utilities to break. Complete the CSS
variable migration by updating all remaining color mapping sections (border,
text, accent, state) to use the consistent --color-* naming pattern that matches
the background keys already migrated (base, surface, elevated, subtle), ensuring
all referenced variables are properly defined in app/globals.css.

---

Nitpick comments:
In @.agents/skills/clerk-custom-ui/core-3/custom-sign-in.md:
- Around line 23-28: The documentation for signIn.password() method shows
examples using different parameters (identifier and emailAddress) without
explaining the valid options available. In
.agents/skills/clerk-custom-ui/core-3/custom-sign-in.md at lines 23-28 (anchor),
add a note clarifying that signIn.password() accepts three mutually exclusive
parameters: identifier (for general-purpose auth supporting email, username,
phone, Web3), emailAddress (for email-specific auth), and phoneNumber (for
phone-specific auth). At lines 198-201 (sibling), ensure the example is
consistent with this clarification or add a reference to the note explaining
parameter flexibility. Both sites should make it clear that multiple valid
approaches exist rather than implying only one is correct.

In
@.agents/skills/clerk-nextjs-patterns/templates/nextjs-basic-auth/app/layout.tsx:
- Line 1: The ClerkProvider component in the template is missing the appearance
and URL redirect configuration that exists in the main app. Add a configuration
object to ClerkProvider that includes the appearance property set to dark theme,
and the signInUrl and signUpUrl properties pointing to the appropriate
authentication routes. This will make the template more representative of a
complete, production-ready setup and help users understand all available
ClerkProvider configuration options.

In @.agents/skills/clerk-setup/SKILL.md:
- Line 113: The fenced code block containing the decision tree starting with
"User Request: "Add Clerk" / "Add authentication"" is missing a language
specification for syntax highlighting. Add `plaintext` after the opening triple
backticks to specify the language and improve code block clarity.
- Around line 153-155: In the SKILL.md file, there is a blank line immediately
following the blockquote that starts with "shadcn/ui detected". Remove this
blank line to ensure proper Markdown rendering and maintain continuity between
the blockquote and the content that follows it. The blockquote mentioning
"ALWAYS apply the shadcn theme" should be directly adjacent to the next content
block without intervening blank lines.
- Line 138: The fenced code block containing the WebFetch URL documentation link
is missing a language specification. Locate the triple backticks that precede
the line starting with "WebFetch:
https://clerk.com/docs/{framework}/getting-started/quickstart" and add the
language identifier "plaintext" immediately after the opening triple backticks
to properly specify the code block type.

In `@app/sign-in/`[[...sign-in]]/page.tsx:
- Around line 5-24: The features array and left-panel markup are duplicated
across the sign-in and sign-up pages, which creates maintenance risk when copy
or styles need updating. Extract the features array and the entire left-panel
markup (including the features array definition and rendering logic) into a
separate reusable component. Create a new shared component file that exports
this panel, then import and use it in both app/sign-in/[[...sign-in]]/page.tsx
and app/sign-up/[[...sign-up]]/page.tsx to replace the duplicated code sections.
This ensures a single source of truth for the marketing panel content.

SAFE PATCH MODE

Fix only the bug described in @context/current-issue.md.

Forbidden:
- comments
- console.log
- cleanup
- refactor
- formatting-only changes
- progress tracker updates
- documentation updates
- status updates

Allowed:
- minimal code changes required to fix the bug

Any change outside the root cause is considered a failure.