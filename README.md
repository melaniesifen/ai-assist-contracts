# AI Assist Contracts

Shared ESM contracts for the AI Assist Platform MVP.

This package is intentionally dependency-light. It uses plain JavaScript objects,
frozen constants, and built-in validation helpers so service repos can share the
same stable vocabulary without installing a schema runtime.

## Scope

Included contracts:

- Tenant and user identity reference fields.
- Stable cross-service error categories and safe error envelopes.
- Context modes, consent statuses, context source types, trust levels, resource
  refs, provenance helpers, and normalized context validation.
- Transport-neutral `SessionEvent` envelope and MVP payload validators.
- Short-lived `SessionSecrets` status refs and default TTL constants.
- Proposed action types, statuses, terminal status helpers, refs, and default
  TTL constants.
- Provider and connector normalized response and error categories.
- Shared validation helpers for service boundary checks.

Not included:

- Runtime schema generation.
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

## Versioning Policy

The package uses semantic versions.

- Patch: bug fixes that do not change accepted or emitted contract shapes.
- Minor: backward-compatible additions, such as optional fields or new helper
  functions.
- Major: breaking changes, removed fields, changed meanings, or required fields
  added to an existing public contract.

Services should reject unsupported contract versions with
`UNSUPPORTED_CONTRACT_VERSION` and the `VALIDATION` category.

## Test

```sh
npm test
```
