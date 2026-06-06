# AI Assist Contracts

Shared contracts for the AI Assist Platform MVP.

This repo is migrating toward Smithy IDL as the source of truth. Smithy source
models live under `model/ai/assist/`. The existing ESM package remains the
dependency-light local compatibility layer until Smithy validation and generated
artifacts are available.

## Scope

Included contracts:

- Tenant and user identity reference fields.
- Product credential authentication error refs.
- Contract version refs and supported-version validation helpers.
- Stable cross-service error categories and safe error envelopes.
- HTTP command request/response envelope refs for state-changing APIs.
- Context modes, consent statuses, context source types, trust levels, resource
  refs, provenance helpers, and normalized context validation.
- Transport-neutral `SessionEvent` envelope and MVP payload validators.
- Short-lived `SessionSecrets` status refs and default TTL constants.
- First-run setup status refs for product session, Google OAuth connection,
  provider-secret readiness, optional resource-session readiness, and safe
  UI-displayable setup errors.
- Proposed action types, statuses, terminal status helpers, refs, and default
  TTL constants, plus shared status transition validation.
- Provider and connector normalized response and error categories.
- Metadata-only logging field policy and log-event validation helpers.
- Shared validation helpers for service boundary checks.
- Initial Smithy source models for the same MVP contract vocabulary.
- Source compatibility fixtures for the Milestone 1 Google Docs
  read/propose/review/apply contract slice and shared Google Docs read-path
  consumer tests.

Not included:

- Generated Smithy artifacts.
- Runtime schema generation from Smithy.
- Persistence adapters.
- HTTP route handlers.
- KMS, OAuth, provider, or connector clients.
- Raw content logging helpers. Services must keep logs metadata-only.

## Usage

```js
import {
  CONTEXT_MODES,
  SESSION_EVENT_TYPES,
  createSessionEvent,
  validateSessionEvent
} from "@ai-assist/contracts";

const event = createSessionEvent({
  eventId: "evt_01",
  tenantId: "tenant_01",
  userId: "user_01",
  sessionId: "session_01",
  requestId: "req_01",
  correlationId: "corr_01",
  type: SESSION_EVENT_TYPES.PROGRESS,
  sequence: 1,
  createdAt: "2026-05-29T00:00:00.000Z",
  payload: {
    stage: "context.loading",
    status: "started",
    messageCode: "CONTEXT_LOADING"
  }
});

const result = validateSessionEvent(event);
if (!result.valid) {
  // Return or map result.issues to a service-specific response.
}

console.log(CONTEXT_MODES.SELECTION);
```

## Validation Pattern

Validators return `{ valid, issues }` and do not throw. Each issue has:

- `field`
- `code`
- `message`

Use `assertValid(contractName, result)` when a throwing API is more convenient.

## Smithy Source Models

Smithy source files are under `model/ai/assist/`, with `smithy-build.json` as the
repo-local build entry point. The current local test suite verifies the Smithy
source inventory and enum-value mapping against the JavaScript bootstrap.

The current local validation path uses the Smithy CLI. On macOS, install it with
Homebrew:

```sh
brew tap smithy-lang/tap
brew install smithy-cli
```

Generated artifacts are written under ignored build output. Do not commit
generated files until the package publishing and compatibility fixture strategy
is approved.

See [docs/smithy-migration.md](docs/smithy-migration.md) for the JS mapping,
generated artifact strategy, and tooling notes.

## Versioning Policy

The package uses semantic versions.

- Patch: bug fixes that do not change accepted or emitted contract shapes.
- Minor: backward-compatible additions, such as optional fields or new helper
  functions.
- Major: breaking changes, removed fields, changed meanings, or required fields
  added to an existing public contract.

Services should reject unsupported contract versions with
`UNSUPPORTED_CONTRACT_VERSION` and the `VALIDATION` category.

Breaking contract changes require a coordinated rollout note before adoption.
At minimum, the note must identify affected repos, old and new versions,
backward-compatibility defaults, migration order, service deployment order,
rollback plan, and compatibility fixture updates.

## Task Breakdown

Implementation tasks are tracked in [TASKS.md](TASKS.md). Update the checkboxes there in the same change that implements or verifies a task.

## Testing And Coverage

Run the unit tests with either command:

```sh
node --test
npm test
```

Run the local Smithy source inventory checks with the same test command:

```sh
node --test
```

Validate and build the Smithy source projection with:

```sh
smithy validate model
smithy build --config smithy-build.json --output build/smithy
```

View the built-in coverage report in the terminal:

```sh
node --experimental-test-coverage --test
npm run coverage
```

The coverage command uses Node's built-in test runner and prints a text report. If later tooling writes HTML, LCOV, TAP, JUnit, or build output, those generated paths are ignored by `.gitignore`.

## Compatibility Fixtures

Source fixtures live under `fixtures/` and are included in the package files.
Use them in consumer repos instead of copying local mock shapes.

The Milestone 1 Google Docs vertical slice is exported as:

```js
import {
  M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES,
  applyActionCommand,
  proposedActionReviewRef
} from "@ai-assist/contracts/fixtures/m1-google-docs-vertical-slice";
```

The Milestone 3 first-run setup slice is exported as:

```js
import {
  M3_FIRST_RUN_SETUP_FIXTURES,
  firstRunSetupReadyFixture
} from "@ai-assist/contracts/fixtures/m3-first-run-setup";
```

The shared Google Docs read-path fixture surface is exported as:

```js
import {
  GOOGLE_DOCS_READ_PATH_FIXTURES,
  googleDocsActiveResourceReadContextResult
} from "@ai-assist/contracts/fixtures/google-docs-read-path";
```

Fixture names use:

```text
<task-area>-<flow>-<scenario>
```

Each fixture entry includes `name`, `taskArea`, `flow`, `contractVersion`,
`validator`, and `value`.

Consumer mapping:

- `ai-assist-web`: action review, approve/reject/apply command, typed error,
  and session event fixtures for Milestone 2 UI tests.
- `ai-assist-orchestration-service`: authenticated command envelope, provider
  proposal batch, action review, action command, apply-action, and dependency
  error fixtures.
- `ai-assist-context-service`: active consent grant, consent error, and
  normalized context fixtures.
- `ai-assist-google-docs-adapter`: Google Docs list, read-context, target
  verification, conflict, quota, and reconnect-required connector fixtures.
- `ai-assist-session-events-service`: progress, assistant final, action
  proposed, action status changed, and typed error event fixtures.
- `ai-assist-auth-service`: verified identity, authenticated command envelope,
  product session error, and server-derived identity fixtures.
- `ai-assist-auth-service` for Milestone 3: product session status and Google
  OAuth connection status fixtures.
- `ai-assist-secrets-service` for Milestone 3: provider-secret readiness and
  safe setup-error fixtures.
- `ai-assist-web` for Milestone 3: composed first-run setup status fixtures for
  setup-state UI tests.
- M4 Google Docs read-path consumers: use the shared `google-docs-read-path`
  fixtures for context modes, consent states, resource list/read-context
  success, truncation, reconnect-required, permission, quota/rate-limit, and
  connector failure states.

Fixtures must stay synthetic. Do not add provider keys, OAuth tokens, raw
prompts, full document text, model responses, or decrypted action payload
plaintext. User-visible review snippets may use short placeholder text only.
