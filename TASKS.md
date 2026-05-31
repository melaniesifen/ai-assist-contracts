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

## Pending Architecture Tasks

- [ ] `REPO-001`: Decide final package structure, language, package manager, and schema tooling for this repo.
- [x] `REPO-002`: Migrate shared contracts to Smithy IDL as the source of truth for service, API, event, error, context, action, connector, and provider models.
- [x] `REPO-002`: Define the generated artifacts strategy for OpenAPI, JSON Schema, TypeScript, Python, and Java outputs, generating only artifacts needed by consuming repos.
- [x] Migration gate: Do not continue broad new shared-contract feature work until the Smithy migration is completed or explicitly deferred.
- [x] `ARCH-003`: Add explicit contract version field or negotiation helper where service boundaries need version checks.
- [x] `ARCH-003`: Add unsupported contract version validation that maps to `UNSUPPORTED_CONTRACT_VERSION`.
- [x] `ARCH-003`: Add coordinated rollout note requirements for breaking contract changes.
- [ ] `ARCH-003`: Add compatibility fixtures for downstream service contract tests.
- [ ] `ARCH-003`: Add integration tests that load compatibility fixtures across auth, secrets, context, events, actions, and provider contracts.
- [ ] `AUTH-001`: Add cross-service fixtures proving services derive identity from verified auth context, not request bodies.
- [x] `AUTH-002`: Define shared typed errors for unauthorized, expired, and malformed product credentials if missing from service needs.
- [ ] `AUTH-004`: Add compatibility fixtures for `SessionSecrets` records, metadata-only responses, and expired-secret errors.
- [ ] `CTX-002`: Add full `ContextConsentGrants` contract once context service implements persistence.
- [ ] `CTX-005`: Add shared connector interface request/response fixtures for list, read, verify, and apply operations.
- [x] `EVT-001`: Add HTTP command request/response envelope contracts with request and correlation IDs.
- [x] `ACTION-002`: Add invalid proposed-action transition validation if lifecycle enforcement remains shared.
- [ ] `PROVIDER-001`: Add provider adapter interface fixtures for credential validation, generation, streaming, usage, and errors.
- [ ] `OPS-004`: Add failure-mode fixtures for dependency, throttling, KMS, OAuth, connector, and provider errors.
- [x] `OPS-003`: Reference metadata-only logging rules for contracts that touch sensitive content.

## Quality And Release Tasks

- [x] Raise line coverage to at least 95%.
- [x] Add generated client/server type strategy if TypeScript or schema generation is selected.
- [ ] Add release/versioning workflow.
- [ ] Add deployment-style pipeline tasks for schema validation, compatibility checks, package build, and publish dry run.
- [ ] Publish package to the selected private or public package registry.
- [ ] Add contract migration guidance for breaking changes.
- [ ] Add cross-repo contract conformance tests.
