import assert from "node:assert/strict";
import test from "node:test";

import {
  GOOGLE_OAUTH_CONNECTION_STATUSES,
  OAUTH_PROVIDERS,
  PRODUCT_SESSION_STATUSES,
  PROVIDER_SECRET_READINESS_STATUSES,
  RESOURCE_SESSION_READINESS_STATUSES,
  SETUP_ERROR_KINDS,
  validateContractVersionRef,
  validateFirstRunSetupStatus,
  validateGoogleOAuthConnectionStatusRef,
  validateProductSessionStatusRef,
  validateProviderSecretReadinessRef,
  validateResourceSessionReadinessRef,
  validateSetupErrorRef,
  validateSupportedContractVersion
} from "../src/index.js";
import {
  M3_FIRST_RUN_SETUP_FIXTURES,
  firstRunSetupNeedsUserActionFixture,
  firstRunSetupReadyFixture,
  googleOAuthConnectedFixture,
  providerSecretValidFixture
} from "../fixtures/m3-first-run-setup.fixtures.js";

const VALIDATORS = Object.freeze({
  validateFirstRunSetupStatus,
  validateGoogleOAuthConnectionStatusRef,
  validateProductSessionStatusRef,
  validateProviderSecretReadinessRef,
  validateResourceSessionReadinessRef,
  validateSetupErrorRef
});

const FORBIDDEN_KEYS = new Set([
  "providerKey",
  "apiKey",
  "oauthToken",
  "accessToken",
  "refreshToken",
  "authorizationCode",
  "prompt",
  "rawPrompt",
  "documentText",
  "rawDocumentText",
  "selectedText",
  "modelResponse",
  "secretCiphertext",
  "secretPlaintext"
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
  }

  return findings;
}

test("M3 fixtures expose stable names, versions, and validators", () => {
  const names = new Set();

  for (const fixture of M3_FIRST_RUN_SETUP_FIXTURES) {
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
});

test("M3 fixture validators resolve through the public package boundary", async () => {
  const contracts = await import("@ai-assist/contracts");
  const fixtures = await import("@ai-assist/contracts/fixtures/m3-first-run-setup");

  for (const fixture of fixtures.M3_FIRST_RUN_SETUP_FIXTURES) {
    assert.equal(typeof contracts[fixture.validator], "function", fixture.validator);
  }
});

test("M3 fixtures validate against their declared contracts", () => {
  for (const fixture of M3_FIRST_RUN_SETUP_FIXTURES) {
    const validator = VALIDATORS[fixture.validator];
    const result = validator(fixture.value);

    assert.equal(result.valid, true, `${fixture.name}: ${JSON.stringify(result.issues)}`);
  }
});

test("M3 setup fixtures stay metadata-only", () => {
  for (const fixture of M3_FIRST_RUN_SETUP_FIXTURES) {
    assert.deepEqual(scanForbiddenContent(fixture.value), [], fixture.name);
  }

  assert.equal(Object.hasOwn(providerSecretValidFixture.value, "secretCiphertext"), false);
  assert.equal(Object.hasOwn(providerSecretValidFixture.value, "providerKey"), false);
  assert.equal(Object.hasOwn(googleOAuthConnectedFixture.value, "accessToken"), false);
  assert.equal(Object.hasOwn(googleOAuthConnectedFixture.value, "refreshToken"), false);
});

test("M3 first-run setup status composes backend-owned state families", () => {
  const ready = firstRunSetupReadyFixture.value;

  assert.equal(ready.productSession.status, PRODUCT_SESSION_STATUSES.AUTHENTICATED);
  assert.equal(ready.googleOAuth.status, GOOGLE_OAUTH_CONNECTION_STATUSES.CONNECTED);
  assert.equal(ready.googleOAuth.provider, OAUTH_PROVIDERS.GOOGLE);
  assert.equal(ready.providerSecrets[0].status, PROVIDER_SECRET_READINESS_STATUSES.VALID);
  assert.equal(ready.resourceSession.status, RESOURCE_SESSION_READINESS_STATUSES.READY);
  assert.deepEqual(ready.errors, []);
  assert.equal(validateFirstRunSetupStatus(ready).valid, true);

  const needsUserAction = firstRunSetupNeedsUserActionFixture.value;
  assert.equal(needsUserAction.productSession.status, PRODUCT_SESSION_STATUSES.EXPIRED);
  assert.equal(needsUserAction.errors[0].kind, SETUP_ERROR_KINDS.PRODUCT_SESSION_EXPIRED);
  assert.equal(validateFirstRunSetupStatus(needsUserAction).valid, true);
});

test("M3 setup validators reject leaked secret and OAuth fields", () => {
  assert.equal(
    validateProviderSecretReadinessRef({
      ...providerSecretValidFixture.value,
      providerKey: "sk-fixture"
    }).issues.some((item) => item.field === "providerSecret.providerKey"),
    true
  );

  assert.equal(
    validateGoogleOAuthConnectionStatusRef({
      ...googleOAuthConnectedFixture.value,
      accessToken: "ya29.fixture"
    }).issues.some((item) => item.field === "googleOAuth.accessToken"),
    true
  );
  assert.equal(
    validateGoogleOAuthConnectionStatusRef({
      ...googleOAuthConnectedFixture.value,
      provider: "google_docs"
    }).issues.some((item) => item.field === "googleOAuth.provider"),
    true
  );
});
