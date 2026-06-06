import assert from "node:assert/strict";
import test from "node:test";

import {
  CONNECTOR_ERROR_CATEGORIES,
  CONNECTOR_OPERATIONS,
  CONNECTOR_RESPONSE_STATUSES,
  CONTEXT_MODES,
  ERROR_CATEGORIES,
  STANDARD_ERROR_CODES,
  validateConnectorReadContextResult,
  validateConnectorResourceListResult,
  validateConnectorResponse,
  validateContextConsentGrantRef,
  validateContractError,
  validateContractVersionRef,
  validateGoogleOAuthConnectionStatusRef,
  validateHttpCommandRequest,
  validateNormalizedContext,
  validateSupportedContractVersion
} from "../src/index.js";
import {
  GOOGLE_DOCS_READ_PATH_FIXTURES,
  M4_GOOGLE_DOCS_READ_PATH_FIXTURES,
  googleDocsActiveResourceReadContextResult,
  googleDocsReadPathConnectorFixtures,
  googleDocsReadPathResourceListResult,
  googleDocsTruncatedReadContextResult,
  scopedConsentErrorFixtures,
  unsupportedFutureContextModeCommandFixture,
  unsupportedFutureContextModeErrorFixture,
  wrongResourceConsentGrantFixture,
  wrongUserConsentGrantFixture
} from "../fixtures/google-docs-read-path.fixtures.js";

const VALIDATORS = Object.freeze({
  validateConnectorResponse,
  validateContextConsentGrantRef,
  validateContractError,
  validateGoogleOAuthConnectionStatusRef,
  validateHttpCommandRequest,
  validateNormalizedContext
});

const FORBIDDEN_KEYS = new Set([
  "providerKey",
  "apiKey",
  "oauthToken",
  "accessToken",
  "refreshToken",
  "authorizationCode",
  "authorizationHeader",
  "prompt",
  "rawPrompt",
  "documentText",
  "rawDocumentText",
  "selectedText",
  "modelResponse",
  "screenshot",
  "ocr",
  "accessibilityTree",
  "secretCiphertext",
  "secretPlaintext",
  "actionPayload",
  "decryptedActionPayload"
]);

const FORBIDDEN_VALUE_PATTERNS = Object.freeze([
  /\bsk-[A-Za-z0-9]/,
  /\bya29\./,
  /Bearer\s+[A-Za-z0-9._-]+/,
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

test("Google Docs read-path fixtures expose stable names, versions, and validators", () => {
  const names = new Set();

  for (const fixture of GOOGLE_DOCS_READ_PATH_FIXTURES) {
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

  assert.equal(M4_GOOGLE_DOCS_READ_PATH_FIXTURES, GOOGLE_DOCS_READ_PATH_FIXTURES);
});

test("Google Docs read-path fixtures resolve through the public package boundary", async () => {
  const contracts = await import("@ai-assist/contracts");
  const fixtures = await import("@ai-assist/contracts/fixtures/google-docs-read-path");

  for (const fixture of fixtures.GOOGLE_DOCS_READ_PATH_FIXTURES) {
    assert.equal(typeof contracts[fixture.validator], "function", fixture.validator);
  }
});

test("Google Docs read-path fixtures validate against their declared contracts", () => {
  for (const fixture of GOOGLE_DOCS_READ_PATH_FIXTURES) {
    const validator = VALIDATORS[fixture.validator];
    const result = validator(fixture.value);

    assert.equal(result.valid, true, `${fixture.name}: ${JSON.stringify(result.issues)}`);
  }
});

test("Google Docs read-path fixtures stay metadata-only", () => {
  for (const fixture of GOOGLE_DOCS_READ_PATH_FIXTURES) {
    assert.deepEqual(scanForbiddenContent(fixture.value), [], fixture.name);
  }

  for (const fixture of GOOGLE_DOCS_READ_PATH_FIXTURES) {
    if (fixture.validator === "validateNormalizedContext") {
      assert.ok(fixture.value.content.length < 80, fixture.name);
      assert.match(fixture.value.content, /^<fixture /);
    }
  }
});

test("Google Docs read-path fixtures cover M4 context modes and consent states", () => {
  assert.equal(unsupportedFutureContextModeCommandFixture.value.payload.contextMode, CONTEXT_MODES.VISIBLE_REGION);
  assert.equal(unsupportedFutureContextModeErrorFixture.value.code, STANDARD_ERROR_CODES.UNSUPPORTED_CONTEXT_MODE);
  assert.equal(unsupportedFutureContextModeErrorFixture.value.category, ERROR_CATEGORIES.VALIDATION);

  assert.equal(validateContextConsentGrantRef(wrongUserConsentGrantFixture.value).valid, true);
  assert.equal(validateContextConsentGrantRef(wrongResourceConsentGrantFixture.value).valid, true);
  assert.equal(wrongUserConsentGrantFixture.value.userId, "user_read_path_other");
  assert.equal(wrongResourceConsentGrantFixture.value.resourceRef.resourceId, "gdoc_read_path_other");

  const scopedConsentTargets = scopedConsentErrorFixtures.map((fixture) => fixture.value.target);
  assert.deepEqual(scopedConsentTargets, [
    "contextConsentGrant.userId",
    "contextConsentGrant.resourceRef"
  ]);
});

test("Google Docs read-path fixtures cover resource discovery and read-context families", () => {
  assert.equal(validateConnectorResourceListResult(googleDocsReadPathResourceListResult).valid, true);
  assert.equal(googleDocsReadPathResourceListResult.resources.length, 2);

  assert.equal(validateConnectorReadContextResult(googleDocsActiveResourceReadContextResult).valid, true);
  assert.equal(validateConnectorReadContextResult(googleDocsTruncatedReadContextResult).valid, true);
  assert.equal(googleDocsActiveResourceReadContextResult.context.contextMode, CONTEXT_MODES.ACTIVE_RESOURCE);
  assert.equal(googleDocsTruncatedReadContextResult.context.metadata.truncated, true);

  const listRateLimit = byName(googleDocsReadPathConnectorFixtures, "connector-google-docs-list-rate-limited").value;
  assert.equal(listRateLimit.operation, CONNECTOR_OPERATIONS.LIST_RESOURCES);
  assert.equal(listRateLimit.status, CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR);
  assert.equal(listRateLimit.error.category, CONNECTOR_ERROR_CATEGORIES.RATE_LIMITED);

  const readPermission = byName(googleDocsReadPathConnectorFixtures, "connector-google-docs-read-permission-denied").value;
  assert.equal(readPermission.operation, CONNECTOR_OPERATIONS.READ_CONTEXT);
  assert.equal(readPermission.status, CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR);
  assert.equal(readPermission.error.category, CONNECTOR_ERROR_CATEGORIES.AUTHORIZATION);

  const readTimeout = byName(googleDocsReadPathConnectorFixtures, "connector-google-docs-read-timeout").value;
  assert.equal(readTimeout.error.category, CONNECTOR_ERROR_CATEGORIES.TIMEOUT);

  const readUnavailable = byName(googleDocsReadPathConnectorFixtures, "connector-google-docs-read-unavailable").value;
  assert.equal(readUnavailable.error.category, CONNECTOR_ERROR_CATEGORIES.UNAVAILABLE);
  assert.equal(readUnavailable.error.dependencyStatus, "503");
});
