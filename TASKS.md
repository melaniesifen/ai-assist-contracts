# Task Breakdown

Update this file as implementation progresses. Check off completed tasks in the same change that implements or verifies them.

Sources:

- `../ai-assist-architecture/implementation-task-breakdown.md`
- `../ai-assist-architecture/lld-auth-secrets-tenancy.md`
- `../ai-assist-architecture/lld-context-connectors.md`
- `../ai-assist-architecture/lld-session-events-transport.md`
- `../ai-assist-architecture/lld-actions-writeback.md`

## Completed Bootstrap

- [x] Create dependency-light ESM package for shared contracts.
- [x] `AUTH-001`: Define shared tenant, user, auth subject, session, request, and correlation identity helpers.
- [x] `ARCH-003`: Centralize stable error categories and safe error envelope validation.
- [x] `CTX-001`: Define context mode constants, including MVP and future modes.
- [x] `CTX-002`: Define consent status vocabulary used by context grants.
- [x] `CTX-003`: Define normalized context vocabulary and validation helpers.
- [x] `CTX-004`: Define context source and trust-level vocabulary for client-supplied versus connector-verified context.
- [x] `EVT-002`: Define transport-neutral `SessionEvent` envelope constants and validators.
- [x] `AUTH-004`: Define shared `SessionSecrets` status refs and default TTL constants.
- [x] `ACTION-001`: Define shared `ProposedActions` refs, types, default TTL constants, and status vocabulary.
- [x] `ACTION-002`: Add proposed-action terminal status helpers.
- [x] `PROVIDER-001`: Define provider names, provider response refs, and normalized provider error categories.
- [x] `CTX-005`: Define connector vocabulary and normalized connector error categories.
- [x] Add unit tests using `node:test`.
- [x] Document tests and coverage commands in `README.md`.
- [x] Ignore local prompts, feedback, coverage output, dependencies, and build artifacts.

## Completed Google Docs Vertical Slice Contract Helpers

- [x] `ACTION-001`: Add PR-style `ProposedActionReviewRef` and `ProposedActionTarget` helpers for user-visible edit review cards.
- [x] `ACTION-003`: Add action decision command payload helpers for approve/reject command bodies.
- [x] `ACTION-004`: Add minimal apply-action command payload helpers that keep revision/hash authority server-side and require idempotency through the HTTP command envelope.
- [x] `CTX-005` / `DOCS-001` / `DOCS-002`: Add Google Docs resource-list and read-context result helpers plus fixture coverage for the read/propose/review/apply slice.
- [x] `PROVIDER-001`: Add structured provider text proposal batch and typed target-hint helpers for provider-neutral proposal output.

## Completed First-Run Setup Contract Helpers

- [x] `AUTH-002` / M3: Add product session status refs for anonymous, authenticated, and expired first-run setup states.
- [x] `AUTH-003` / M3: Add Google OAuth connection status refs for not connected, connected, and reconnect-required states.
- [x] `AUTH-004` / `AUTH-005` / M3: Add provider-secret readiness refs for missing, pending validation, valid, invalid, expired, and validation-failed states.
- [x] `CTX-005` / M3: Add optional resource-session readiness refs for not started, ready, and not-ready setup states.
- [x] M3: Add safe setup error refs and composed first-run setup status fixtures.
- [x] M3: Add Smithy setup source, package exports, fixture docs, and contract tests.

## Completed Google Docs Read-Path Fixture Foundation

- [x] M4 / `CTX-001` / `CTX-006`: Add shared read-path fixtures for unsupported future context modes.
- [x] M4 / `CTX-002`: Add shared read-path fixtures for wrong-user and wrong-resource consent states while reusing existing active, missing, revoked, and expired consent fixtures.
- [x] M4 / `DOCS-001` / `DOCS-002`: Add shared read-path fixtures for resource-list success, `SELECTION` read, `ACTIVE_RESOURCE` read, truncated active-resource read, permission failure, quota/rate-limit, timeout, unavailable connector failure, and reconnect-required.
- [x] M4 / `OPS-003` / `SAFE-003`: Keep read-path fixtures metadata-only and covered by fixture leak tests.

## Completed Ask-And-Stream Fixture Foundation

- [x] M5-T1 / `EVT-001`: Confirm generic assistant command request and accepted response fixtures.
- [x] M5-T1 / `PROVIDER-001`: Add provider-neutral stream event validators and fixtures for delta, final metadata, and safe errors.
- [x] M5-T1 / `EVT-002`: Add shared session event fixtures for progress, assistant delta, assistant final, and safe typed errors.
- [x] M5-T1 / `OPS-003` / `SAFE-003`: Keep assistant stream fixtures synthetic and covered by fixture leak tests.

## Completed Proposed-Action Fixture Foundation

- [x] M6-T1 / `ACTION-001`: Confirm generic proposed-action record and review refs cover proposed, approved, rejected, and expired states.
- [x] M6-T1 / `ACTION-003`: Add generic approve/reject decision command fixtures.
- [x] M6-T1 / `EVT-002`: Add generic `action.proposed` and `action.status_changed` session event fixtures.
- [x] M6-T1 / `OPS-004` / `SAFE-003`: Add a metadata-only cross-scope denial fixture and leak tests for proposed-action fixtures.
- [x] M6-T1b: Rename consumer fixture import paths and exported fixture constants from milestone labels to product-generic names.

## Pending Architecture Tasks

- [ ] `REPO-001`: Decide final package structure, language, package manager, and schema tooling for this repo.
- [x] `REPO-002`: Migrate shared contracts to Smithy IDL as the source of truth for service, API, event, error, context, action, connector, and provider models.
- [x] `REPO-002`: Define the generated artifacts strategy for OpenAPI, JSON Schema, TypeScript, Python, and Java outputs, generating only artifacts needed by consuming repos.
- [x] Migration gate: Do not continue broad new shared-contract feature work until the Smithy migration is completed or explicitly deferred.
- [x] `ARCH-003`: Add explicit contract version field or negotiation helper where service boundaries need version checks.
- [x] `ARCH-003`: Add unsupported contract version validation that maps to `UNSUPPORTED_CONTRACT_VERSION`.
- [x] `ARCH-003`: Add coordinated rollout note requirements for breaking contract changes.
- [x] `ARCH-003`: Add compatibility fixtures for downstream service contract tests.
- [x] `ARCH-003`: Add integration tests that load compatibility fixtures across auth, secrets, context, events, actions, and provider contracts.
- [x] `AUTH-001`: Add cross-service fixtures proving services derive identity from verified auth context, not request bodies.
- [x] `AUTH-002`: Define shared typed errors for unauthorized, expired, and malformed product credentials if missing from service needs.
- [x] `AUTH-004`: Add compatibility fixtures for `SessionSecrets` records, metadata-only responses, and expired-secret errors.
- [ ] `CTX-002`: Add full `ContextConsentGrants` contract once context service implements persistence.
- [x] `CTX-002`: Add M1 compatibility fixtures for active, missing, revoked, and expired consent scenarios using the current shared consent vocabulary. Full persisted `ContextConsentGrants` shape remains deferred to the context-service persistence task above.
- [x] `CTX-003`: Add M1 compatibility fixtures for `SELECTION`, `ACTIVE_RESOURCE`, and truncated normalized context.
- [x] `CTX-005`: Add shared connector interface request/response fixtures for list, read, verify, and apply operations.
- [x] `EVT-001`: Add HTTP command request/response envelope contracts with request and correlation IDs.
- [x] `ACTION-003`: Add shared action decision command payload helpers for approve/reject commands.
- [x] `ACTION-004`: Add shared apply-action command payload helpers that identify the action without trusting client-supplied revision/hash facts.
- [x] `ACTION-002`: Add invalid proposed-action transition validation if lifecycle enforcement remains shared.
- [x] `PROVIDER-001`: Add provider adapter interface fixtures for credential validation, generation, usage, errors, and provider-neutral stream delta/final/error events.
- [x] `OPS-004`: Add contract fixture and conformance cases for dependency, throttling, KMS, OAuth, connector, and provider error shapes. This repo owns the shared error payload fixtures other services can validate against; infrastructure observability, dashboards, and alerts remain owned by `ai-assist-infra`.
- [x] `OPS-003`: Reference metadata-only logging rules for contracts that touch sensitive content.

## Quality And Release Tasks

- [x] Raise line coverage to at least 95%.
- [x] Add generated client/server type strategy if TypeScript or schema generation is selected.
- [ ] Add release/versioning workflow.
- [ ] Add deployment-style pipeline tasks for schema validation, compatibility checks, package build, and publish dry run.
- [ ] Publish package to the selected private or public package registry.
- [ ] Add contract migration guidance for breaking changes.
- [x] Add source compatibility fixtures for cross-repo contract conformance tests.
- [ ] Add cross-repo contract conformance tests.
