import assert from "node:assert/strict";
import test from "node:test";

import {
  HTTP_COMMAND_TYPES,
  PROPOSED_ACTION_STATUSES,
  validateContractVersionRef,
  validateApplyActionCommandPayload,
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateProposedActionRef,
  validateProposedActionReviewRef,
  validateSessionEvent,
  validateSupportedContractVersion
} from "../src/index.js";
import {
  PROPOSED_ACTION_FIXTURES,
  applyActionCommandFixture,
  applyActionResultResponseFixtures,
  actionStatusEventFixtures,
  approveActionCommandFixture,
  crossScopeDeniedResponseFixture,
  proposedActionReviewFixtures,
  reconnectRequiredApplyResponseFixture,
  rejectActionCommandFixture
} from "../fixtures/proposed-actions.fixtures.js";

const VALIDATORS = Object.freeze({
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateProposedActionRef,
  validateProposedActionReviewRef,
  validateSessionEvent
});

const FORBIDDEN_KEYS = new Set([
  "providerKey",
  "apiKey",
  "oauthToken",
  "accessToken",
  "refreshToken",
  "authorization",
  "authorizationHeader",
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

test("proposed action fixtures expose stable generic names, versions, and validators", () => {
  const names = new Set();

  for (const fixture of PROPOSED_ACTION_FIXTURES) {
    assert.equal(typeof fixture.name, "string");
    assert.equal(names.has(fixture.name), false, `duplicate fixture name ${fixture.name}`);
    names.add(fixture.name);
    assert.equal(fixture.name.includes("M6"), false, fixture.name);
    assert.equal(fixture.name.includes("m6"), false, fixture.name);

    assert.equal(validateContractVersionRef(fixture.contractVersion).valid, true);
    assert.equal(validateSupportedContractVersion(fixture.contractVersion).valid, true);
    assert.equal(typeof fixture.taskArea, "string");
    assert.equal(typeof fixture.flow, "string");
    assert.equal(typeof fixture.validator, "string");
    assert.equal(typeof VALIDATORS[fixture.validator], "function", fixture.validator);
  }
});

test("proposed action fixtures validate against their declared contracts", () => {
  for (const fixture of PROPOSED_ACTION_FIXTURES) {
    const validator = VALIDATORS[fixture.validator];
    const result = validator(fixture.value);

    assert.equal(result.valid, true, `${fixture.name}: ${JSON.stringify(result.issues)}`);
  }
});

test("proposed action fixtures resolve through public package exports", async () => {
  const contracts = await import("@ai-assist/contracts");
  const fixtures = await import("@ai-assist/contracts/fixtures/proposed-actions");

  for (const fixture of fixtures.PROPOSED_ACTION_FIXTURES) {
    assert.equal(typeof contracts[fixture.validator], "function", fixture.validator);
  }
});

test("proposed action fixtures cover lifecycle, decisions, status events, and denial", () => {
  const reviewStatuses = new Set(proposedActionReviewFixtures.map((fixture) => fixture.value.status));
  for (const status of [
    PROPOSED_ACTION_STATUSES.PROPOSED,
    PROPOSED_ACTION_STATUSES.APPROVED,
    PROPOSED_ACTION_STATUSES.REJECTED,
    PROPOSED_ACTION_STATUSES.EXPIRED
  ]) {
    assert.equal(reviewStatuses.has(status), true, status);
  }

  assert.equal(validateHttpCommandRequest(approveActionCommandFixture.value).valid, true);
  assert.equal(validateHttpCommandRequest(rejectActionCommandFixture.value).valid, true);
  assert.equal(validateHttpCommandRequest(applyActionCommandFixture.value).valid, true);
  assert.equal(crossScopeDeniedResponseFixture.value.error.code, "AUTHORIZATION_DENIED");

  const statusEventStatuses = new Set(
    actionStatusEventFixtures.map((fixture) => fixture.value.payload.status)
  );
  assert.deepEqual(
    statusEventStatuses,
    new Set([
      PROPOSED_ACTION_STATUSES.APPROVED,
      PROPOSED_ACTION_STATUSES.REJECTED,
      PROPOSED_ACTION_STATUSES.EXPIRED,
      PROPOSED_ACTION_STATUSES.APPLIED,
      PROPOSED_ACTION_STATUSES.CONFLICTED,
      PROPOSED_ACTION_STATUSES.FAILED
    ])
  );
});

test("proposed action fixtures cover generic apply command and M7 result states", () => {
  assert.equal(applyActionCommandFixture.value.commandType, HTTP_COMMAND_TYPES.APPLY_ACTION);
  assert.equal(typeof applyActionCommandFixture.value.idempotencyKey, "string");
  assert.equal(validateApplyActionCommandPayload(applyActionCommandFixture.value.payload).valid, true);

  for (const forbiddenField of [
    "tenantId",
    "userId",
    "resourceRevision",
    "targetRange",
    "targetAnchor",
    "originalTextHash",
    "oauthToken",
    "accessToken",
    "mutation"
  ]) {
    assert.equal(Object.hasOwn(applyActionCommandFixture.value.payload, forbiddenField), false, forbiddenField);
  }

  const resultStatuses = new Set(
    applyActionResultResponseFixtures.map((fixture) => fixture.value.result.status)
  );
  assert.deepEqual(
    resultStatuses,
    new Set([
      PROPOSED_ACTION_STATUSES.APPLIED,
      PROPOSED_ACTION_STATUSES.CONFLICTED,
      PROPOSED_ACTION_STATUSES.FAILED
    ])
  );

  const replay = applyActionResultResponseFixtures.find(
    (fixture) => fixture.name === "action-apply-result-duplicate-replay"
  );
  assert.equal(replay.value.result.replayed, true);
  assert.equal(replay.value.result.operationId, "operation_apply_demo");

  const conflict = applyActionResultResponseFixtures.find(
    (fixture) => fixture.name === "action-apply-result-conflict-no-mutation"
  );
  assert.equal(conflict.value.result.status, PROPOSED_ACTION_STATUSES.CONFLICTED);
  assert.equal(conflict.value.result.conflictReasonCode, "STALE_RESOURCE_REVISION");
  assert.equal(Object.hasOwn(conflict.value.result, "operationId"), false);

  assert.equal(reconnectRequiredApplyResponseFixture.value.commandType, HTTP_COMMAND_TYPES.APPLY_ACTION);
  assert.equal(reconnectRequiredApplyResponseFixture.value.error.code, "OAUTH_RECONNECT_REQUIRED");
  assert.equal(reconnectRequiredApplyResponseFixture.value.error.category, "OAUTH");
});

test("proposed action fixtures exclude secrets, raw document content, and decrypted payloads", () => {
  for (const fixture of PROPOSED_ACTION_FIXTURES) {
    assert.deepEqual(scanForbiddenContent(fixture.value), [], fixture.name);
  }
});
