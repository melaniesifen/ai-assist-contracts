# AGENTS.md

## Repo Purpose

`ai-assist-contracts` owns the shared MVP vocabulary and validation helpers consumed by every service repo. Keep this repo runtime-light and dependency-free unless a later migration explicitly adds schema tooling.

## Agent Instructions

- Read `README.md`, `ai-assist-platform-context.md`, and the architecture docs before changing contracts.
- Treat every export as a cross-service contract. Changes must preserve compatibility unless the caller impact is documented.
- Keep stable enum values, error categories, event types, action statuses, provider names, and context modes centralized here.
- Do not add service-specific workflow logic to this repo.
- Do not log or model raw prompts, document text, provider keys, OAuth tokens, screenshots, OCR, or model responses in examples or fixtures.
- Add tests for new contract fields, validation behavior, and invalid inputs.

## Commands

- Run tests with `node --test`.
- `npm` may not be available in this environment; prefer the direct Node command.

## Review Notes

Before committing contract changes, run a code review against cross-repo compatibility: which services consume the field, which fields are required, what defaults exist, and whether unsupported versions fail with typed errors.
