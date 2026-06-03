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

## M1 Consumer Guidance

Use `m1-google-docs-vertical-slice.fixtures.js` for Milestone 1 and follow-on
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
