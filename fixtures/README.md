# Contract Fixtures

Source fixtures live in this directory so consumer repos can import stable
contract examples without copying local mock shapes.

## Naming

Use names in this format:

```text
<task-area>-<flow>-<scenario>
```

Examples:

- `auth-command-envelope-create-assistant-command`
- `connector-google-docs-target-conflict-stale-revision`
- `action-command-apply-idempotent`

Each fixture object includes:

- `name`: stable scenario name
- `taskArea`: architecture task IDs covered by the fixture
- `flow`: short human-readable flow name
- `contractVersion`: supported version metadata for compatibility tests
- `validator`: expected JavaScript validator name
- `value`: the contract payload

## Google Docs Vertical Slice Consumer Guidance

Use `google-docs-vertical-slice.fixtures.js` for Google Docs and follow-on
Google Docs vertical-slice work.

- `ai-assist-web`: use action review, approve/reject/apply command, typed error,
  and session event fixtures for Milestone 2 UI state tests.
- `ai-assist-orchestration-service`: use authenticated command envelope,
  provider proposal batch, action review, action command, apply-action, and
  dependency error fixtures.
- `ai-assist-context-service`: use active consent grant, consent error, and
  normalized context fixtures.
- `ai-assist-google-docs-adapter`: use Google Docs list, read-context, target
  verification, conflict, quota, and reconnect-required connector fixtures.
- `ai-assist-session-events-service`: use progress, assistant final, action
  proposed, action status changed, and typed error event fixtures.
- `ai-assist-auth-service`: use verified identity, authenticated command
  envelope, product session error, and server-derived identity fixtures.

Fixtures must remain synthetic and metadata-only where possible. Do not add
provider keys, OAuth tokens, raw prompts, full document text, model responses,
or decrypted action payload plaintext.

## First-Run Setup Consumer Guidance

Use `first-run-setup.fixtures.js` for first-run setup work.

- `ai-assist-auth-service`: use product session status and Google OAuth
  connection status fixtures for `/auth/session` and `/oauth/google/status`
  shaped tests.
- `ai-assist-secrets-service`: use provider-secret readiness fixtures for
  metadata-only provider-key validation/status tests.
- `ai-assist-web`: use composed first-run setup status fixtures for onboarding
  and setup UI state tests.

The first-run setup fixtures intentionally exclude OAuth tokens, authorization codes,
provider keys, ciphertext, raw document text, prompts, and model responses.

## Google Docs Read-Path Guidance

Use `google-docs-read-path.fixtures.js` for shared Google Docs read-path
consumer tests.

- `ai-assist-context-service`: use active/missing/revoked/expired consent from
  Google Docs vertical-slice plus wrong-user and wrong-resource consent scenarios from the shared
  read-path fixtures.
- `ai-assist-google-docs-adapter`: use resource discovery, `SELECTION`,
  `ACTIVE_RESOURCE`, truncated context, permission, quota/rate-limit, timeout,
  unavailable, and reconnect-required fixtures.
- `ai-assist-auth-service`: use reconnect-required status/error fixtures when
  shaping Google token handoff behavior.
- `ai-assist-web`: use the same read-path fixtures for readiness and failure UI
  state tests without inventing local mock shapes.

The read-path fixtures intentionally reuse Google Docs vertical-slice and setup fixture values where they are
already sufficient and add only missing shared scenarios. They exclude OAuth
tokens, authorization headers, provider keys, raw document text, selected text,
prompts, model responses, screenshots, OCR, accessibility trees, and decrypted
action payloads.

## Assistant Stream Guidance

Use `assistant-stream.fixtures.js` for generic ask-and-stream consumer tests.

- `ai-assist-orchestration-service`: use assistant command, accepted response,
  provider-neutral stream events, session event envelopes, and safe dependency
  error fixtures when validating command-to-event handoff.
- `ai-assist-session-events-service`: use progress, assistant delta, assistant
  final, and safe error event fixtures when validating envelope and SSE
  formatting behavior.
- `ai-assist-openai-adapter` and `ai-assist-anthropic-adapter`: use the
  provider-neutral stream fixtures for deterministic delta, final metadata, and
  safe stream error contract tests.
- `ai-assist-web`: use the session event fixtures for SSE reducer and rendering
  tests.

The assistant stream fixtures are synthetic and exclude provider keys, OAuth
tokens, authorization headers, raw prompts, document text, selected text, full
model responses, screenshots, OCR, accessibility trees, and action payloads.

## Proposed Action And Apply Guidance

Use `proposed-actions.fixtures.js` for generic proposed-action lifecycle and
safe apply-action consumer tests.

- `ai-assist-orchestration-service`: use apply command, apply result, duplicate
  replay, conflict/no-mutation, failed apply, safe denial, and reconnect-required
  response fixtures.
- `ai-assist-session-events-service`: use `action.status_changed` fixtures for
  approved, rejected, expired, applied, conflicted, and failed transitions.
- `ai-assist-web`: use review refs, apply result responses, safe errors, and
  status events to render proposed, applied, conflicted, failed, and reconnect
  states.

The apply fixtures are synthetic and metadata-only. They identify actions,
sessions, idempotency keys, operation IDs, resource revisions, status, and
reason codes, but they do not include raw document text, replacement text,
OAuth tokens, provider keys, authorization headers, or decrypted action payloads.
