import assert from "node:assert/strict";
import test from "node:test";

import {
  validateContractError,
  validateContractVersionRef,
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateProviderStreamEvent,
  validateSessionEvent,
  validateSupportedContractVersion
} from "../src/index.js";
import {
  ASSISTANT_STREAM_FIXTURES,
  assistantSessionEventFixtures,
  providerStreamFixtures
} from "../fixtures/assistant-stream.fixtures.js";

const VALIDATORS = Object.freeze({
  validateContractError,
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateProviderStreamEvent,
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

test("assistant stream fixtures expose stable names, versions, and validators", () => {
  const names = new Set();

  for (const fixture of ASSISTANT_STREAM_FIXTURES) {
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

  assert.equal(providerStreamFixtures.length, 3);
  assert.equal(assistantSessionEventFixtures.length, 5);
});

test("assistant stream fixtures validate against their declared contracts", () => {
  for (const fixture of ASSISTANT_STREAM_FIXTURES) {
    const validator = VALIDATORS[fixture.validator];
    const result = validator(fixture.value);

    assert.equal(result.valid, true, `${fixture.name}: ${JSON.stringify(result.issues)}`);
  }
});

test("assistant stream fixtures resolve through public package exports", async () => {
  const contracts = await import("@ai-assist/contracts");
  const fixtures = await import("@ai-assist/contracts/fixtures/assistant-stream");

  for (const fixture of fixtures.ASSISTANT_STREAM_FIXTURES) {
    assert.equal(typeof contracts[fixture.validator], "function", fixture.validator);
  }
});

test("assistant stream fixtures exclude secrets and raw workflow content", () => {
  for (const fixture of ASSISTANT_STREAM_FIXTURES) {
    assert.deepEqual(scanForbiddenContent(fixture.value), [], fixture.name);
  }
});
