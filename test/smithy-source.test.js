import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CONNECTOR_ERROR_CATEGORIES,
  CONNECTOR_OPERATIONS,
  CONNECTOR_RESPONSE_STATUSES,
  CONNECTORS,
  CONSENT_GRANT_STATUSES,
  CONTEXT_MODES,
  CONTEXT_SOURCE_TYPES,
  CONTEXT_TRUST_LEVELS,
  ERROR_CATEGORIES,
  HTTP_COMMAND_RESPONSE_STATUSES,
  HTTP_COMMAND_TYPES,
  LOG_STATUS_VALUES,
  MODEL_PROVIDERS,
  OAUTH_PROVIDERS,
  GOOGLE_OAUTH_CONNECTION_STATUSES,
  PRODUCT_CREDENTIAL_ERROR_REFS,
  PRODUCT_SESSION_STATUSES,
  PROGRESS_STATUSES,
  PROVIDER_SECRET_READINESS_STATUSES,
  PROPOSED_ACTION_STATUSES,
  PROPOSED_ACTION_TYPES,
  PROVIDER_ERROR_CATEGORIES,
  PROVIDER_RESPONSE_STATUSES,
  PROVIDER_STREAM_EVENT_TYPES,
  RESOURCE_SESSION_READINESS_STATUSES,
  SETUP_ERROR_KINDS,
  SESSION_EVENT_TYPES,
  SESSION_SECRET_STATUSES,
  STANDARD_ERROR_CODES
} from "../src/index.js";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const modelRoot = join(repoRoot, "model", "ai", "assist");

const expectedModelFiles = Object.freeze([
  "actions.smithy",
  "auth.smithy",
  "commands.smithy",
  "common.smithy",
  "connectors.smithy",
  "context.smithy",
  "events.smithy",
  "logging.smithy",
  "providers.smithy",
  "secrets.smithy",
  "setup.smithy"
]);

function readModel(filename) {
  return readFileSync(join(modelRoot, filename), "utf8");
}

function smithyEnumValues(source, enumName) {
  const match = source.match(new RegExp(`enum\\s+${enumName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected Smithy enum ${enumName}`);

  const values = [];
  let pendingEnumValue;
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (line.length === 0 || line.startsWith("@documentation")) {
      continue;
    }

    const enumValue = line.match(/^@enumValue\("([^"]+)"\)$/);
    if (enumValue) {
      pendingEnumValue = enumValue[1];
      continue;
    }

    const member = line.match(/^([A-Za-z_][A-Za-z0-9_]*)$/);
    if (member) {
      values.push(pendingEnumValue ?? member[1]);
      pendingEnumValue = undefined;
    }
  }

  return values;
}

function assertEnumValues(filename, enumName, expectedValues) {
  const actual = smithyEnumValues(readModel(filename), enumName);
  const expected = Object.values(expectedValues);

  assert.equal(
    actual.length,
    new Set(actual).size,
    `${filename} ${enumName} must not contain duplicate values`
  );
  assert.deepEqual(
    new Set(actual),
    new Set(expected),
    `${filename} ${enumName} must mirror the JavaScript bootstrap values`
  );
}

function assertMemberType(filename, structureName, memberName, expectedType) {
  const source = readModel(filename);
  const match = source.match(new RegExp(`structure\\s+${structureName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected Smithy structure ${structureName}`);
  assert.match(
    match[1],
    new RegExp(`${memberName}:\\s+${expectedType}\\b`),
    `${filename} ${structureName}.${memberName} must use ${expectedType}`
  );
}

function assertUnionContains(filename, unionName, memberName, expectedType) {
  const source = readModel(filename);
  const match = source.match(new RegExp(`union\\s+${unionName}\\s+\\{([\\s\\S]*?)\\n\\}`));
  assert.ok(match, `Expected Smithy union ${unionName}`);
  assert.match(
    match[1],
    new RegExp(`${memberName}:\\s+${expectedType}\\b`),
    `${filename} ${unionName}.${memberName} must target ${expectedType}`
  );
}

test("declares the expected Smithy source inventory", () => {
  const actual = readdirSync(modelRoot)
    .filter((filename) => filename.endsWith(".smithy"))
    .sort();

  assert.deepEqual(actual, expectedModelFiles);
});

test("keeps smithy-build focused on source validation until tooling is declared", () => {
  const build = JSON.parse(readFileSync(join(repoRoot, "smithy-build.json"), "utf8"));

  assert.deepEqual(build.sources, ["model"]);
  assert.deepEqual(Object.keys(build.projections), ["source"]);
  assert.deepEqual(build.projections.source.transforms, []);
});

test("mirrors JavaScript bootstrap enum values in Smithy models", () => {
  const productCredentialErrorKinds = Object.fromEntries(
    Object.keys(PRODUCT_CREDENTIAL_ERROR_REFS).map((key) => [key, key])
  );

  assertEnumValues("common.smithy", "ErrorCategory", ERROR_CATEGORIES);
  assertEnumValues("common.smithy", "StandardErrorCode", STANDARD_ERROR_CODES);
  assertEnumValues("auth.smithy", "ProductCredentialErrorKind", productCredentialErrorKinds);
  assertEnumValues("context.smithy", "ContextMode", CONTEXT_MODES);
  assertEnumValues("context.smithy", "ContextSourceType", CONTEXT_SOURCE_TYPES);
  assertEnumValues("context.smithy", "ContextTrustLevel", CONTEXT_TRUST_LEVELS);
  assertEnumValues("context.smithy", "ConsentGrantStatus", CONSENT_GRANT_STATUSES);
  assertEnumValues("actions.smithy", "ProposedActionType", PROPOSED_ACTION_TYPES);
  assertEnumValues("actions.smithy", "ProposedActionStatus", PROPOSED_ACTION_STATUSES);
  assertEnumValues("events.smithy", "SessionEventType", SESSION_EVENT_TYPES);
  assertEnumValues("events.smithy", "ProgressStatus", PROGRESS_STATUSES);
  assertEnumValues("commands.smithy", "HttpCommandType", HTTP_COMMAND_TYPES);
  assertEnumValues(
    "commands.smithy",
    "HttpCommandResponseStatus",
    HTTP_COMMAND_RESPONSE_STATUSES
  );
  assertEnumValues("connectors.smithy", "Connector", CONNECTORS);
  assertEnumValues("connectors.smithy", "ConnectorOperation", CONNECTOR_OPERATIONS);
  assertEnumValues(
    "connectors.smithy",
    "ConnectorResponseStatus",
    CONNECTOR_RESPONSE_STATUSES
  );
  assertEnumValues(
    "connectors.smithy",
    "ConnectorErrorCategory",
    CONNECTOR_ERROR_CATEGORIES
  );
  assertEnumValues("providers.smithy", "ModelProvider", MODEL_PROVIDERS);
  assertEnumValues("providers.smithy", "ProviderResponseStatus", PROVIDER_RESPONSE_STATUSES);
  assertEnumValues("providers.smithy", "ProviderErrorCategory", PROVIDER_ERROR_CATEGORIES);
  assertEnumValues("providers.smithy", "ProviderStreamEventType", PROVIDER_STREAM_EVENT_TYPES);
  assertEnumValues("secrets.smithy", "SessionSecretStatus", SESSION_SECRET_STATUSES);
  assertEnumValues("setup.smithy", "ProductSessionStatus", PRODUCT_SESSION_STATUSES);
  assertEnumValues("setup.smithy", "OAuthProvider", OAUTH_PROVIDERS);
  assertEnumValues(
    "setup.smithy",
    "GoogleOAuthConnectionStatus",
    GOOGLE_OAUTH_CONNECTION_STATUSES
  );
  assertEnumValues(
    "setup.smithy",
    "ProviderSecretReadinessStatus",
    PROVIDER_SECRET_READINESS_STATUSES
  );
  assertEnumValues(
    "setup.smithy",
    "ResourceSessionReadinessStatus",
    RESOURCE_SESSION_READINESS_STATUSES
  );
  assertEnumValues("setup.smithy", "SetupErrorKind", SETUP_ERROR_KINDS);
  assertEnumValues("logging.smithy", "LogStatus", LOG_STATUS_VALUES);
});

test("uses typed Smithy payload and vocabulary members where generated artifacts need enforcement", () => {
  assertMemberType("events.smithy", "SessionEvent", "payload", "SessionEventPayload");
  assertUnionContains(
    "events.smithy",
    "SessionEventPayload",
    "assistantDelta",
    "AssistantDeltaPayload"
  );
  assertUnionContains(
    "events.smithy",
    "SessionEventPayload",
    "assistantFinal",
    "AssistantFinalPayload"
  );
  assertUnionContains("events.smithy", "SessionEventPayload", "progress", "ProgressPayload");
  assertUnionContains("events.smithy", "SessionEventPayload", "error", "ErrorPayload");
  assertUnionContains(
    "events.smithy",
    "SessionEventPayload",
    "actionProposed",
    "ActionProposedPayload"
  );
  assertUnionContains(
    "events.smithy",
    "SessionEventPayload",
    "actionStatusChanged",
    "ActionStatusChangedPayload"
  );

  assertMemberType("context.smithy", "ResourceRef", "connector", "Connector");
  assertMemberType("context.smithy", "ContextConsentGrantRef", "provider", "Connector");
  assertMemberType("context.smithy", "ContextConsentGrantRef", "contextMode", "ContextMode");
  assertMemberType("context.smithy", "ContextConsentGrantRef", "resourceRef", "ResourceRef");
  assertMemberType("context.smithy", "ContextConsentGrantRef", "scopes", "ScopeList");
  assertMemberType("context.smithy", "ContextConsentGrantRef", "status", "ConsentGrantStatus");
  assertMemberType("context.smithy", "Provenance", "connector", "Connector");
  assertMemberType("context.smithy", "NormalizedContext", "provider", "Connector");
  assertMemberType("actions.smithy", "ActionTargetAnchor", "connector", "Connector");
  assertMemberType("actions.smithy", "ProposedActionRef", "provider", "Connector");
  assertMemberType("actions.smithy", "ProposedActionReviewRef", "resourceRef", "ResourceRef");
  assertMemberType("actions.smithy", "ProposedActionReviewRef", "target", "ProposedActionTarget");
  assertUnionContains(
    "actions.smithy",
    "ProposedActionTarget",
    "targetAnchor",
    "ActionTargetAnchor"
  );
  assertUnionContains(
    "actions.smithy",
    "ProposedActionTarget",
    "targetRange",
    "ActionTargetRange"
  );
  assertMemberType(
    "commands.smithy",
    "ApplyActionCommandPayload",
    "actionId",
    "String"
  );
  assertUnionContains(
    "providers.smithy",
    "ProviderStreamEvent",
    "assistantDelta",
    "ProviderStreamDeltaEvent"
  );
  assertUnionContains(
    "providers.smithy",
    "ProviderStreamEvent",
    "assistantFinal",
    "ProviderStreamFinalEvent"
  );
  assertUnionContains(
    "providers.smithy",
    "ProviderStreamEvent",
    "error",
    "ProviderStreamErrorEvent"
  );
  assertMemberType(
    "connectors.smithy",
    "ConnectorReadContextResult",
    "context",
    "NormalizedContext"
  );
  assertMemberType(
    "providers.smithy",
    "ProviderTextProposal",
    "actionType",
    "ProposedActionType"
  );
  assertMemberType(
    "providers.smithy",
    "ProviderTextProposal",
    "targetHint",
    "ProviderTextProposalTargetHint"
  );
  assertMemberType("secrets.smithy", "SessionSecretStatusRef", "provider", "ModelProvider");
  assertMemberType("setup.smithy", "ProductSessionStatusRef", "status", "ProductSessionStatus");
  assertMemberType("setup.smithy", "GoogleOAuthConnectionStatusRef", "provider", "OAuthProvider");
  assertMemberType(
    "setup.smithy",
    "GoogleOAuthConnectionStatusRef",
    "status",
    "GoogleOAuthConnectionStatus"
  );
  assertMemberType(
    "setup.smithy",
    "ProviderSecretReadinessRef",
    "provider",
    "ModelProvider"
  );
  assertMemberType(
    "setup.smithy",
    "ProviderSecretReadinessRef",
    "status",
    "ProviderSecretReadinessStatus"
  );
  assertMemberType(
    "setup.smithy",
    "ResourceSessionReadinessRef",
    "resourceRef",
    "ResourceRef"
  );
  assertMemberType("setup.smithy", "SetupErrorRef", "error", "ContractError");
  assertMemberType(
    "setup.smithy",
    "FirstRunSetupStatus",
    "providerSecrets",
    "ProviderSecretReadinessList"
  );
});

test("documents JS compatibility mapping and Smithy tooling notes", () => {
  const migrationNotes = readFileSync(join(repoRoot, "docs", "smithy-migration.md"), "utf8");

  for (const moduleName of [
    "src/versioning.js",
    "src/identity.js",
    "src/errors.js",
    "src/auth.js",
    "src/connector-vocabulary.js",
    "src/context.js",
    "src/actions.js",
    "src/events.js",
    "src/commands.js",
    "src/connectors.js",
    "src/providers.js",
    "src/secrets.js",
    "src/setup.js",
    "src/logging.js"
  ]) {
    assert.match(migrationNotes, new RegExp(moduleName.replace(".", "\\.")));
  }

  assert.match(migrationNotes, /smithy validate model/);
  assert.match(migrationNotes, /Generated artifacts are still intentionally blocked/);
});
