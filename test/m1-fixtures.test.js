import assert from "node:assert/strict";
import test from "node:test";

import {
  CONNECTOR_OPERATIONS,
  CONNECTOR_RESPONSE_STATUSES,
  ERROR_CATEGORIES,
  HTTP_COMMAND_TYPES,
  PROPOSED_ACTION_STATUSES,
  STANDARD_ERROR_CODES,
  VALIDATION_ISSUE_CODES,
  validateActionDecisionCommandPayload,
  validateApplyActionCommandPayload,
  validateConnectorReadContextResult,
  validateConnectorResourceListResult,
  validateConnectorResponse,
  validateContextConsentGrantRef,
  validateContractError,
  validateContractVersionRef,
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateIdentityScope,
  validateNormalizedContext,
  validateProviderResponse,
  validateProviderTextProposalBatch,
  validateProposedActionReviewRef,
  validateSessionEvent,
  validateSessionSecretStatusRef,
  validateSupportedContractVersion
} from "../src/index.js";
import {
  M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES,
  activeConsentGrantFixture,
  applyActionCommand,
  authenticatedCommandEnvelopeFixture,
  googleConnectorFixtures,
  googleDocsReadContextResult,
  googleDocsResourceListResult,
  googleDocsResourceRef,
  normalizedContextFixtures,
  providerFixtures,
  proposedActionFixtures,
  unsupportedVersionCommandFixture,
  unsupportedVersionErrorResponseFixture
} from "../fixtures/m1-google-docs-vertical-slice.fixtures.js";

const VALIDATORS = Object.freeze({
  validateConnectorResponse,
  validateContextConsentGrantRef,
  validateContractError,
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateIdentityScope,
  validateNormalizedContext,
  validateProviderResponse,
  validateProviderTextProposalBatch,
  validateProposedActionReviewRef,
  validateSessionEvent,
  validateSessionSecretStatusRef,
});

const EXPECTED_UNSUPPORTED_VERSION_FIXTURES = new Set([
  "version-command-envelope-unsupported-major"
]);

const FORBIDDEN_KEYS = new Set([
  "providerKey",
  "apiKey",
  "oauthToken",
  "accessToken",
  "refreshToken",
  "prompt",
  "rawPrompt",
  "documentText",
  "rawDocumentText",
  "selectedText",
  "modelResponse",
  "secretCiphertext",
  "secretPlaintext",
  "actionPayload",
  "decryptedActionPayload"
]);

const FORBIDDEN_VALUE_PATTERNS = Object.freeze([
  /\bsk-[A-Za-z0-9]/,
  /\bya29\./,
  /BEGIN (?:OPENSSH|RSA|PRIVATE) KEY/,
  /raw prompt/i,
  /full document text/i,
  /model response/i,
  /decrypted action payload/i
]);

function scanForbiddenContent(value, path = "fixture") {
  const findings = [];

  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      findings.push(...scanForbiddenContent(item, `${path}.${index}`));
    }
    return findings;
  }

  if (value !== null && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (FORBIDDEN_KEYS.has(key)) {
        findings.push(`${path}.${key}`);
      }
      findings.push(...scanForbiddenContent(nested, `${path}.${key}`));
    }
    return findings;
  }

  if (typeof value === "string") {
    for (const pattern of FORBIDDEN_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        findings.push(path);
      }
    }
  }

  return findings;
}

function byName(fixtures, name) {
  const match = fixtures.find((item) => item.name === name);
  assert.ok(match, `expected fixture ${name}`);
  return match;
}

test("M1 fixtures expose stable names, versions, and validators", () => {
  const names = new Set();

  for (const fixture of M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES) {
    assert.equal(typeof fixture.name, "string");
    assert.equal(names.has(fixture.name), false, `duplicate fixture name ${fixture.name}`);
    names.add(fixture.name);

    assert.equal(validateContractVersionRef(fixture.contractVersion).valid, true);
    assert.equal(validateSupportedContractVersion(fixture.contractVersion).valid, true);
    assert.equal(typeof fixture.taskArea, "string");
    assert.equal(typeof fixture.flow, "string");
    assert.equal(typeof fixture.validator, "string");
    assert.equal(typeof VALIDATORS[fixture.validator], "function", fixture.validator);
  }

  assert.ok(M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES.length >= 40);
});

test("M1 fixture validators resolve through the public package boundary", async () => {
  const contracts = await import("@ai-assist/contracts");
  const fixtures = await import("@ai-assist/contracts/fixtures/m1-google-docs-vertical-slice");

  for (const fixture of fixtures.M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES) {
    assert.equal(typeof contracts[fixture.validator], "function", fixture.validator);
  }
});

test("M1 fixtures validate against their declared contracts", () => {
  for (const fixture of M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES) {
    const validator = VALIDATORS[fixture.validator];
    const result = validator(fixture.value);

    if (EXPECTED_UNSUPPORTED_VERSION_FIXTURES.has(fixture.name)) {
      assert.equal(result.valid, false, fixture.name);
      assert.equal(
        result.issues.some((item) => (
          item.field === "contractVersion" &&
          item.code === VALIDATION_ISSUE_CODES.UNSUPPORTED
        )),
        true,
        fixture.name
      );
    } else {
      assert.equal(result.valid, true, `${fixture.name}: ${JSON.stringify(result.issues)}`);
    }
  }
});

test("M1 fixture payloads stay metadata-only where required", () => {
  for (const fixture of M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES) {
    assert.deepEqual(scanForbiddenContent(fixture.value), [], fixture.name);
  }

  for (const fixture of normalizedContextFixtures) {
    assert.ok(fixture.value.content.length < 80, fixture.name);
    assert.match(fixture.value.content, /^<fixture /);
  }
});

test("M1 authenticated mutation payloads do not require client-supplied identity facts", () => {
  assert.equal(validateHttpCommandRequest(authenticatedCommandEnvelopeFixture.value).valid, true);
  assert.equal(authenticatedCommandEnvelopeFixture.value.identityScope.tenantId, "tenant_m1_demo");
  assert.equal(authenticatedCommandEnvelopeFixture.value.identityScope.userId, "user_m1_demo");
  assert.equal(Object.hasOwn(authenticatedCommandEnvelopeFixture.value.payload, "tenantId"), false);
  assert.equal(Object.hasOwn(authenticatedCommandEnvelopeFixture.value.payload, "userId"), false);

  for (const commandName of [
    "action-command-approve-payload",
    "action-command-reject-payload",
    "action-command-apply-idempotent"
  ]) {
    const command = byName(proposedActionFixtures, commandName).value;
    assert.equal(validateHttpCommandRequest(command).valid, true);
    assert.equal(Object.hasOwn(command.payload, "tenantId"), false, commandName);
    assert.equal(Object.hasOwn(command.payload, "userId"), false, commandName);
  }
});

test("M1 apply-action command identifies action and idempotency only", () => {
  assert.equal(validateHttpCommandRequest(applyActionCommand).valid, true);
  assert.equal(validateApplyActionCommandPayload(applyActionCommand.payload).valid, true);
  assert.equal(applyActionCommand.commandType, HTTP_COMMAND_TYPES.APPLY_ACTION);
  assert.equal(typeof applyActionCommand.idempotencyKey, "string");

  for (const forbiddenField of [
    "resourceRevision",
    "targetRange",
    "targetAnchor",
    "originalTextHash",
    "oauthToken",
    "accessToken",
    "mutation"
  ]) {
    assert.equal(Object.hasOwn(applyActionCommand.payload, forbiddenField), false, forbiddenField);
  }
});

test("M1 action decision fixtures validate payload semantics", () => {
  assert.equal(
    validateActionDecisionCommandPayload(
      byName(proposedActionFixtures, "action-command-approve-payload").value.payload
    ).valid,
    true
  );
  assert.equal(
    validateActionDecisionCommandPayload(
      byName(proposedActionFixtures, "action-command-reject-payload").value.payload
    ).valid,
    true
  );
});

test("M1 connector response fixtures validate nested result shapes", () => {
  assert.equal(validateConnectorResourceListResult(googleDocsResourceListResult).valid, true);
  assert.equal(validateConnectorReadContextResult(googleDocsReadContextResult).valid, true);

  const list = byName(googleConnectorFixtures, "connector-google-docs-list-success").value;
  assert.equal(validateConnectorResourceListResult(list.result).valid, true);

  const read = byName(googleConnectorFixtures, "connector-google-docs-read-context-success").value;
  assert.equal(validateConnectorReadContextResult(read.result).valid, true);

  const verify = byName(googleConnectorFixtures, "connector-google-docs-target-verify-success").value;
  assert.equal(verify.operation, CONNECTOR_OPERATIONS.VALIDATE_MUTATION_TARGET);
  assert.equal(verify.status, CONNECTOR_RESPONSE_STATUSES.SUCCESS);
  assert.equal(verify.result.connectorVerified, true);
  assert.equal(typeof verify.result.originalTextHash, "string");

  const applySuccess = byName(googleConnectorFixtures, "connector-google-docs-apply-mutation-success").value;
  assert.equal(applySuccess.operation, CONNECTOR_OPERATIONS.APPLY_MUTATION);
  assert.equal(applySuccess.status, CONNECTOR_RESPONSE_STATUSES.SUCCESS);
  assert.equal(validateConnectorResponse(applySuccess).valid, true);
  assert.equal(applySuccess.result.status, PROPOSED_ACTION_STATUSES.APPLIED);

  const applyConflict = byName(
    googleConnectorFixtures,
    "connector-google-docs-apply-mutation-conflict-no-mutation"
  ).value;
  assert.equal(applyConflict.operation, CONNECTOR_OPERATIONS.APPLY_MUTATION);
  assert.equal(applyConflict.status, CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR);
  assert.equal(validateConnectorResponse(applyConflict).valid, true);
  assert.equal(applyConflict.error.category, "conflict");
});

test("M1 provider proposal fixtures include single, non-overlapping, and overlapping examples", () => {
  assert.equal(
    byName(providerFixtures, "provider-text-proposal-batch-single-edit").value.proposals.length,
    1
  );
  assert.equal(
    byName(providerFixtures, "provider-text-proposal-batch-non-overlapping-edits").value.proposals.length,
    2
  );

  const overlapping = byName(providerFixtures, "provider-text-proposal-batch-overlapping-edits").value;
  assert.equal(validateProviderTextProposalBatch(overlapping).valid, true);
  const [first, second] = overlapping.proposals.map((proposal) => proposal.targetHint.targetRange);
  assert.equal(first.start < second.end && second.start < first.end, true);
});

test("M1 proposed action review fixtures cover visible lifecycle states", () => {
  for (const status of [
    PROPOSED_ACTION_STATUSES.PROPOSED,
    PROPOSED_ACTION_STATUSES.APPROVED,
    PROPOSED_ACTION_STATUSES.REJECTED,
    PROPOSED_ACTION_STATUSES.APPLIED,
    PROPOSED_ACTION_STATUSES.CONFLICTED
  ]) {
    assert.equal(
      proposedActionFixtures.some((fixture) => fixture.value.status === status),
      true,
      status
    );
  }

  const conflicted = byName(proposedActionFixtures, "action-review-conflicted-diff-card").value;
  assert.equal(conflicted.conflictReasonCode, "STALE_RESOURCE_REVISION");
});

test("M1 error fixtures use stable safe categories", () => {
  const unsupported = unsupportedVersionErrorResponseFixture.value.error;
  assert.equal(unsupported.code, STANDARD_ERROR_CODES.UNSUPPORTED_CONTRACT_VERSION);
  assert.equal(unsupported.category, ERROR_CATEGORIES.VALIDATION);

  const unsupportedRequest = validateHttpCommandRequest(unsupportedVersionCommandFixture.value);
  assert.equal(unsupportedRequest.valid, false);
  assert.equal(unsupportedRequest.issues[0].field, "contractVersion");

  for (const fixture of M1_GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES) {
    if (fixture.validator === "validateContractError") {
      assert.equal(validateContractError(fixture.value).valid, true, fixture.name);
    }
  }
});

test("M1 context consent fixture captures current shared grant shape until full model lands", () => {
  assert.equal(validateContextConsentGrantRef(activeConsentGrantFixture.value).valid, true);
  assert.equal(activeConsentGrantFixture.value.status, "active");
  assert.equal(activeConsentGrantFixture.value.tenantId, "tenant_m1_demo");
  assert.equal(activeConsentGrantFixture.value.userId, "user_m1_demo");
  assert.equal(activeConsentGrantFixture.value.resourceRef.resourceId, googleDocsResourceRef.resourceId);
  assert.equal(Object.hasOwn(activeConsentGrantFixture.value, "documentText"), false);
});
