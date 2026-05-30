import assert from "node:assert/strict";
import test from "node:test";

import {
  CONNECTOR_ERROR_CATEGORIES,
  CONNECTOR_OPERATIONS,
  CONNECTOR_RESPONSE_STATUSES,
  CONNECTORS,
  CONTEXT_MODES,
  CONTEXT_SOURCE_TYPES,
  CONTEXT_TRUST_LEVELS,
  ERROR_CATEGORIES,
  MODEL_PROVIDERS,
  PROPOSED_ACTION_STATUSES,
  PROPOSED_ACTION_TYPES,
  PROVIDER_ERROR_CATEGORIES,
  PROVIDER_RESPONSE_STATUSES,
  SESSION_EVENT_TYPES,
  SESSION_SECRET_STATUSES,
  createConnectorError,
  createConnectorResponse,
  createContractError,
  createActionTargetRange,
  createIdentityScope,
  createNormalizedContext,
  createProviderError,
  createProviderResponse,
  createProposedActionRef,
  createProvenance,
  createResourceRef,
  createSessionEvent,
  createSessionSecretStatusRef,
  isMvpContextMode,
  isTerminalProposedActionStatus,
  validateConnectorResponse,
  validateContractError,
  validateActionTargetRange,
  validateIdentityScope,
  validateNormalizedContext,
  validateProviderResponse,
  validateProposedActionRef,
  validateSessionEvent,
  validateSessionSecretStatusRef
} from "../src/index.js";

const NOW = "2026-05-29T00:00:00.000Z";
const LATER = "2026-05-29T01:00:00.000Z";

test("exports stable MVP vocabularies", () => {
  assert.equal(CONTEXT_MODES.SELECTION, "SELECTION");
  assert.equal(CONTEXT_MODES.ACTIVE_RESOURCE, "ACTIVE_RESOURCE");
  assert.equal(isMvpContextMode(CONTEXT_MODES.SELECTION), true);
  assert.equal(isMvpContextMode(CONTEXT_MODES.SCREEN), false);
  assert.equal(ERROR_CATEGORIES.PROVIDER_QUOTA, "PROVIDER_QUOTA");
  assert.equal(SESSION_SECRET_STATUSES.ACTIVE, "active");
  assert.equal(PROPOSED_ACTION_TYPES.REPLACE_TEXT, "REPLACE_TEXT");
  assert.equal(PROVIDER_ERROR_CATEGORIES.QUOTA, "quota");
  assert.equal(CONNECTOR_ERROR_CATEGORIES.CONSENT_REQUIRED, "consent_required");
});

test("validates server-derived identity scope", () => {
  const scope = createIdentityScope({
    tenantId: "tenant_01",
    userId: "user_01",
    authSubject: "sub_01",
    requestId: "req_01",
    correlationId: "corr_01"
  });

  assert.deepEqual(validateIdentityScope(scope), { valid: true, issues: [] });

  const result = validateIdentityScope({ ...scope, tenantId: "   " });
  assert.equal(result.valid, false);
  assert.equal(result.issues[0].field, "tenantId");
});

test("validates safe contract error envelope", () => {
  const error = createContractError({
    code: "AUTHORIZATION_DENIED",
    category: ERROR_CATEGORIES.AUTHORIZATION,
    message: "Access denied.",
    retryable: false,
    httpStatus: 403
  });

  assert.equal(validateContractError(error).valid, true);
  assert.equal(
    validateContractError({ ...error, category: "authz" }).issues[0].code,
    "enum"
  );
});

test("builds and validates normalized context with provenance", () => {
  const resourceRef = createResourceRef({
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: "doc_01",
    resourceType: "document",
    displayName: "Quarterly plan"
  });

  const provenance = createProvenance({
    sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_SELECTION,
    trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: "doc_01",
    resourceVersion: "rev_01",
    selectionAnchor: { start: 1, end: 10 },
    capturedAt: NOW,
    clientSupplied: false,
    connectorVerified: true
  });

  const context = createNormalizedContext({
    contextId: "ctx_01",
    tenantId: "tenant_01",
    userId: "user_01",
    sessionId: "session_01",
    provider: CONNECTORS.GOOGLE_DOCS,
    resourceRef,
    contextMode: CONTEXT_MODES.SELECTION,
    sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_SELECTION,
    trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
    content: "selected text",
    contentHash: "sha256:abc",
    anchors: [{ start: 1, end: 10 }],
    resourceRevision: "rev_01",
    metadata: { truncated: false },
    provenance,
    capturedAt: NOW,
    expiresAt: LATER
  });

  assert.equal(validateNormalizedContext(context).valid, true);

  const invalid = validateNormalizedContext({
    ...context,
    provenance: { ...provenance, connectorVerified: "yes" }
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues.some((item) => item.field === "provenance.connectorVerified"), true);
});

test("validates session event envelope and typed payloads", () => {
  const event = createSessionEvent({
    eventId: "evt_01",
    tenantId: "tenant_01",
    userId: "user_01",
    sessionId: "session_01",
    requestId: "req_01",
    correlationId: "corr_01",
    type: SESSION_EVENT_TYPES.ACTION_STATUS_CHANGED,
    sequence: 2,
    createdAt: NOW,
    payload: {
      actionId: "action_01",
      previousStatus: PROPOSED_ACTION_STATUSES.APPROVED,
      status: PROPOSED_ACTION_STATUSES.APPLIED,
      reasonCode: "APPLY_SUCCEEDED"
    }
  });

  assert.equal(validateSessionEvent(event).valid, true);

  const invalid = validateSessionEvent({
    ...event,
    payload: { ...event.payload, status: "DONE" }
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues[0].field, "payload.status");
});

test("validates action.proposed events with full resource references", () => {
  const event = createSessionEvent({
    eventId: "evt_02",
    tenantId: "tenant_01",
    userId: "user_01",
    sessionId: "session_01",
    requestId: "req_01",
    correlationId: "corr_01",
    type: SESSION_EVENT_TYPES.ACTION_PROPOSED,
    sequence: 3,
    createdAt: NOW,
    payload: {
      actionId: "action_01",
      actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
      resourceRef: createResourceRef({
        connector: CONNECTORS.GOOGLE_DOCS,
        resourceId: "doc_01",
        resourceType: "document"
      }),
      summary: "Replace selected text.",
      expiresAt: LATER
    }
  });

  assert.equal(validateSessionEvent(event).valid, true);

  const invalid = validateSessionEvent({
    ...event,
    payload: {
      ...event.payload,
      resourceRef: { resourceId: "doc_01" }
    }
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues.some((item) => item.field === "payload.resourceRef.connector"), true);
});

test("validates proposed action refs and terminal status helpers", () => {
  const action = createProposedActionRef({
    actionId: "action_01",
    tenantId: "tenant_01",
    userId: "user_01",
    sessionId: "session_01",
    provider: CONNECTORS.GOOGLE_DOCS,
    resourceId: "doc_01",
    resourceRevision: "rev_01",
    targetRange: createActionTargetRange({ start: 1, end: 10 }),
    originalTextHash: "sha256:original",
    actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
    status: PROPOSED_ACTION_STATUSES.PROPOSED,
    createdAt: NOW,
    updatedAt: NOW,
    expiresAt: LATER
  });

  assert.equal(validateProposedActionRef(action).valid, true);
  assert.equal(isTerminalProposedActionStatus(PROPOSED_ACTION_STATUSES.PROPOSED), false);
  assert.equal(isTerminalProposedActionStatus(PROPOSED_ACTION_STATUSES.CONFLICTED), true);

  const invalid = validateProposedActionRef({
    ...action,
    targetRange: undefined,
    targetAnchor: undefined
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues.some((item) => item.message.includes("targetAnchor")), true);

  const invalidRange = validateProposedActionRef({
    ...action,
    targetRange: "not-a-range"
  });
  assert.equal(invalidRange.valid, false);
  assert.equal(invalidRange.issues.some((item) => item.field === "targetRange"), true);

  const reversedRange = validateActionTargetRange({ start: 10, end: 1 });
  assert.equal(reversedRange.valid, false);
  assert.equal(reversedRange.issues[0].field, "targetRange.end");
});

test("validates session secret metadata without raw secret material", () => {
  const secret = createSessionSecretStatusRef({
    tenantId: "tenant_01",
    userId: "user_01",
    provider: MODEL_PROVIDERS.OPENAI,
    secretId: "secret_01",
    fingerprint: "fp_01",
    status: SESSION_SECRET_STATUSES.ACTIVE,
    createdAt: NOW,
    lastValidatedAt: NOW,
    expiresAt: LATER
  });

  assert.equal(validateSessionSecretStatusRef(secret).valid, true);
  assert.equal(Object.hasOwn(secret, "secretCiphertext"), false);
});

test("validates provider response and normalized provider error", () => {
  const success = createProviderResponse({
    provider: MODEL_PROVIDERS.OPENAI,
    status: PROVIDER_RESPONSE_STATUSES.SUCCESS,
    model: "gpt-example",
    messageId: "msg_01",
    finishReason: "stop",
    usage: {
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30
    }
  });
  assert.equal(validateProviderResponse(success).valid, true);

  const response = createProviderResponse({
    provider: MODEL_PROVIDERS.OPENAI,
    status: PROVIDER_RESPONSE_STATUSES.RETRYABLE_ERROR,
    model: "gpt-example",
    error: createProviderError({
      category: PROVIDER_ERROR_CATEGORIES.RATE_LIMITED,
      code: "PROVIDER_RATE_LIMITED",
      message: "Provider asked the service to retry later.",
      retryAfterSeconds: 30
    })
  });

  assert.equal(validateProviderResponse(response).valid, true);
  assert.equal(
    validateProviderResponse({ ...response, provider: "unknown" }).issues[0].field,
    "provider"
  );

  assert.doesNotThrow(() => {
    const result = validateProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.SUCCESS,
      usage: null
    });
    assert.equal(result.valid, false);
  });

  assert.equal(
    validateProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.SUCCESS,
      usage: []
    }).valid,
    false
  );
  assert.equal(
    validateProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.RETRYABLE_ERROR,
      usage: { inputTokens: -1 }
    }).issues.some((item) => item.field === "usage.inputTokens"),
    true
  );
  assert.equal(
    validateProviderResponse({
      ...success,
      error: response.error
    }).issues.some((item) => item.field === "error"),
    true
  );
  assert.equal(
    validateProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.TERMINAL_ERROR
    }).issues.some((item) => item.field === "error"),
    true
  );
});

test("validates connector response and normalized connector error", () => {
  const success = createConnectorResponse({
    connector: CONNECTORS.GOOGLE_DOCS,
    operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
    status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
    requestId: "req_01",
    result: { contextId: "ctx_01" }
  });
  assert.equal(validateConnectorResponse(success).valid, true);

  const response = createConnectorResponse({
    connector: CONNECTORS.GOOGLE_DOCS,
    operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
    status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
    requestId: "req_01",
    error: createConnectorError({
      category: CONNECTOR_ERROR_CATEGORIES.CONSENT_REQUIRED,
      code: "CONSENT_REQUIRED",
      message: "Consent is required before reading context."
    })
  });

  assert.equal(validateConnectorResponse(response).valid, true);
  assert.equal(
    validateConnectorResponse({ ...response, operation: "Read" }).issues[0].field,
    "operation"
  );
  assert.equal(
    validateConnectorResponse({
      ...success,
      error: response.error
    }).issues.some((item) => item.field === "error"),
    true
  );
  assert.equal(
    validateConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR,
      requestId: "req_01"
    }).issues.some((item) => item.field === "error"),
    true
  );
});
