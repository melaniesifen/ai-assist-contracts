# Smithy Migration Notes

## Current State

Smithy source models now live under `model/ai/assist/` and are the source of truth for shared platform contracts. The existing JavaScript ESM helpers in `src/` remain the locally runnable compatibility layer until generated artifacts are approved for consuming repos.

The current validation path uses the Smithy CLI. The repo validates with:

```sh
smithy validate model
smithy build --config smithy-build.json --output build/smithy
```

## Local Source Inventory

- `model/ai/assist/common.smithy`: contract versions, identity scope, shared error envelope, timestamps, non-negative integers.
- `model/ai/assist/auth.smithy`: product credential error kinds.
- `model/ai/assist/context.smithy`: context modes, resource refs, provenance, normalized context, consent statuses.
- `model/ai/assist/actions.smithy`: proposed action types, statuses, targets, metadata-only action refs.
- `model/ai/assist/events.smithy`: transport-neutral session event envelope and payload shapes.
- `model/ai/assist/commands.smithy`: HTTP command request and response envelopes.
- `model/ai/assist/connectors.smithy`: connector names, operations, normalized connector responses and errors.
- `model/ai/assist/providers.smithy`: model providers, usage, normalized provider responses and errors.
- `model/ai/assist/secrets.smithy`: metadata-only session secret status refs.
- `model/ai/assist/logging.smithy`: metadata-only log event shape.

## JavaScript Bootstrap Mapping

| JavaScript module | Smithy source | Notes |
| --- | --- | --- |
| `src/versioning.js` | `common.smithy` | `ContractVersionRef` and unsupported-version error mapping remain executable in JS. |
| `src/identity.js` | `common.smithy` | `IdentityScope` documents server-derived identity fields. |
| `src/errors.js` | `common.smithy` | `ErrorCategory`, `StandardErrorCode`, and `ContractError` preserve safe error envelopes. |
| `src/auth.js` | `auth.smithy` | Product credential error kinds map to safe `ContractError` envelopes. |
| `src/context.js` | `context.smithy` | Context mode, source type, trust level, resource ref, provenance, and normalized context shapes are mirrored. Connector-bearing fields use the Smithy `Connector` enum. |
| `src/actions.js` | `actions.smithy` | Proposed action enums and refs are mirrored. The current `provider` field identifies the connector/resource provider for write-back and is typed as `Connector` in Smithy. Status transition rules remain JS-only until Smithy validators or service logic own them. |
| `src/events.js` | `events.smithy` | `SessionEvent` and MVP payload shapes are mirrored. Smithy models payload variants as `SessionEventPayload`; the current JS bootstrap still receives flat payload objects and dispatches by `type`, so generated artifacts need a discriminator mapping before replacing the JS validators. |
| `src/commands.js` | `commands.smithy` | HTTP command envelopes are mirrored. `actions.apply` idempotency enforcement remains JS-only until generated validators exist. |
| `src/connectors.js` | `connectors.smithy` | Connector response and error vocabulary is mirrored. |
| `src/providers.js` | `providers.smithy` | Provider response, usage, and error vocabulary is mirrored. |
| `src/secrets.js` | `secrets.smithy` | Session secret status refs remain metadata-only. Provider fields use the Smithy `ModelProvider` enum. |
| `src/logging.js` | `logging.smithy` | Metadata log fields are mirrored. Sensitive-field rejection remains JS-only until generated validators exist. |

## Generated Artifacts Strategy

Generate only artifacts required by consuming repos:

- OpenAPI: generate when HTTP command API routes are finalized in orchestration, auth, secrets, context, actions, and connector boundaries.
- JSON Schema: generate first for cross-repo compatibility fixtures and service conformance tests.
- TypeScript: generate for `ai-assist-web` and any TypeScript client-side contract consumers.
- Python: generate for backend services and adapters after their package layouts are migrated.
- Java: defer until a service has a concrete Java runtime need.

Generated artifacts should be written under ignored build output, such as `build/smithy/` or `dist/`, then selectively copied or published through the eventual release workflow. Do not commit generated files until the package publishing and compatibility fixture strategy is approved.

## Tooling Notes

Current local validation uses the Smithy CLI installed through Homebrew:

```sh
brew tap smithy-lang/tap
brew install smithy-cli
```

Generated artifacts are still intentionally blocked until each consuming repo has a concrete need and compatibility strategy. Feasible future reproducible options:

- Add a Gradle wrapper with Smithy dependencies pinned in repo-local build files.
- Add a Maven wrapper with Smithy dependencies pinned in repo-local build files.
- Add a repo-local Smithy CLI download/cache flow with checksum verification.

The minimum validation command must load `smithy-build.json` and validate every file under `model/`.
