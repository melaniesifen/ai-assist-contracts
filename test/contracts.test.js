import assert from "node:assert/strict";
import test from "node:test";

import {
  CONNECTOR_ERROR_CATEGORIES,
  CONNECTOR_OPERATIONS,
  CONNECTOR_RESPONSE_STATUSES,
  CONNECTORS,
  CONTRACT_VERSION,
  CONTEXT_MODES,
  CONTEXT_SOURCE_TYPES,
  CONTEXT_TRUST_LEVELS,
  ERROR_CATEGORIES,
  HTTP_COMMAND_RESPONSE_STATUSES,
  HTTP_COMMAND_TYPES,
  LOG_STATUS_VALUES,
  METADATA_LOG_FIELDS,
  MODEL_PROVIDERS,
  PROPOSED_ACTION_STATUSES,
  PROPOSED_ACTION_TYPES,
  PROVIDER_ERROR_CATEGORIES,
  PROVIDER_RESPONSE_STATUSES,
  PROVIDER_STREAM_EVENT_TYPES,
  SESSION_EVENT_TYPES,
  SESSION_SECRET_STATUSES,
  STANDARD_ERROR_CODES,
  createConnectorError,
  createConnectorReadContextResult,
  createConnectorResponse,
  createConnectorResourceListResult,
  createContextConsentGrantRef,
  createContractError,
  createUnsupportedContractVersionError,
  createActionTargetRange,
  createActionTargetAnchor,
  createProposedActionTarget,
  createActionDecisionCommandPayload,
  createApplyActionCommandPayload,
  createContractVersionRef,
  createHttpCommandRequest,
  createHttpCommandResponse,
  createIdentityScope,
  createMetadataLogEvent,
  createNormalizedContext,
  createProductCredentialError,
  createProviderError,
  createProviderResponse,
  createProviderStreamEvent,
  createProviderTextProposal,
  createProviderTextProposalBatch,
  createProviderTextProposalTargetHint,
  createProposedActionRef,
  createProposedActionReviewRef,
  createProvenance,
  createResourceRef,
  createSessionEvent,
  createSessionSecretStatusRef,
  isSupportedContractVersion,
  canTransitionProposedActionStatus,
  isMvpContextMode,
  isTerminalProposedActionStatus,
  validateSupportedContractVersion,
  validateActionDecisionCommandPayload,
  validateApplyActionCommandPayload,
  validateHttpCommandRequest,
  validateHttpCommandResponse,
  validateConnectorReadContextResult,
  validateConnectorResourceListResult,
  validateConnectorResponse,
  validateContextConsentGrantRef,
  validateContractError,
  validateActionTargetRange,
  validateProposedActionTarget,
  validateIdentityScope,
  validateMetadataLogEvent,
  validateNormalizedContext,
  validateProviderResponse,
  validateProviderStreamEvent,
  validateProviderTextProposal,
  validateProviderTextProposalBatch,
  validateProviderTextProposalTargetHint,
  validateProposedActionRef,
  validateProposedActionReviewRef,
  validateProposedActionStatusTransition,
  validateSessionEvent,
  validateSessionEventPayload,
  validateSessionSecretStatusRef
} from "../src/index.js";
import {
  applyActionCommand,
  googleDocsReadContextResult,
  googleDocsResourceListResult,
  proposedActionReviewRef,
  providerProposalBatch
} from "./fixtures/google-docs-vertical-slice.fixture.js";

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

test("validates contract version refs and unsupported versions", () => {
  const versionRef = createContractVersionRef();

  assert.deepEqual(versionRef, {
    major: CONTRACT_VERSION.MAJOR,
    minor: CONTRACT_VERSION.MINOR,
    patch: CONTRACT_VERSION.PATCH
  });
  assert.equal(validateSupportedContractVersion(versionRef).valid, true);
  assert.equal(isSupportedContractVersion({ ...versionRef, major: 9 }), false);

  const invalid = validateSupportedContractVersion({ ...versionRef, major: 9 });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.issues[0].code, "unsupported");

  const error = createUnsupportedContractVersionError();
  assert.equal(error.code, STANDARD_ERROR_CODES.UNSUPPORTED_CONTRACT_VERSION);
  assert.equal(error.category, ERROR_CATEGORIES.VALIDATION);
  assert.equal(validateContractError(error).valid, true);
});

test("creates distinct typed product credential errors", () => {
  const malformed = createProductCredentialError({
    kind: "MALFORMED",
    message: "Credential header is malformed."
  });

  assert.equal(malformed.code, STANDARD_ERROR_CODES.MALFORMED_PRODUCT_CREDENTIAL);
  assert.equal(malformed.category, ERROR_CATEGORIES.AUTHENTICATION);
  assert.equal(malformed.httpStatus, 400);
  assert.equal(validateContractError(malformed).valid, true);

  const expired = createProductCredentialError({
    kind: "EXPIRED",
    message: "Product session expired."
  });
  assert.equal(expired.code, STANDARD_ERROR_CODES.AUTHENTICATION_EXPIRED);
  assert.equal(expired.httpStatus, 401);

  const unknown = createProductCredentialError({
    kind: "UNKNOWN",
    message: "Unknown kind."
  });
  assert.equal(unknown.code, STANDARD_ERROR_CODES.CONTRACT_VALIDATION_FAILED);
  assert.equal(unknown.category, ERROR_CATEGORIES.VALIDATION);
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
  assert.equal(
    validateNormalizedContext({
      ...context,
      provider: "made_up_connector"
    }).issues.some((item) => item.field === "provider"),
    true
  );
  assert.equal(
    validateNormalizedContext({
      ...context,
      provenance: { ...provenance, connector: "made_up_connector" }
    }).issues.some((item) => item.field === "provenance.connector"),
    true
  );
});

test("validates context consent grant refs", () => {
  const resourceRef = createResourceRef({
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: "doc_01",
    resourceType: "document"
  });
  const grant = createContextConsentGrantRef({
    grantId: "grant_01",
    tenantId: "tenant_01",
    userId: "user_01",
    provider: CONNECTORS.GOOGLE_DOCS,
    contextMode: CONTEXT_MODES.ACTIVE_RESOURCE,
    resourceRef,
    scopes: ["documents.readonly"],
    status: "active",
    grantedAt: NOW,
    expiresAt: LATER
  });

  assert.equal(validateContextConsentGrantRef(grant).valid, true);
  assert.equal(
    validateContextConsentGrantRef({
      ...grant,
      resourceRef: undefined,
      workspaceBoundary: undefined
    }).issues.some((item) => item.field === "contextConsentGrant"),
    true
  );
  assert.equal(
    validateContextConsentGrantRef({
      ...grant,
      workspaceBoundary: { workspaceId: "workspace_01" }
    }).issues.some((item) => item.field === "contextConsentGrant"),
    true
  );
  assert.equal(
    validateContextConsentGrantRef({
      ...grant,
      scopes: [" "]
    }).issues.some((item) => item.field === "contextConsentGrant.scopes.0"),
    true
  );
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

test("validates all session event payload variants", () => {
  assert.equal(
    validateSessionEventPayload(SESSION_EVENT_TYPES.ASSISTANT_DELTA, {
      messageId: "msg_01",
      delta: "",
      index: 0
    }).valid,
    true
  );
  assert.equal(
    validateSessionEventPayload(SESSION_EVENT_TYPES.ASSISTANT_FINAL, {
      messageId: "msg_01",
      finishReason: "stop",
      usage: {
        inputTokens: 4,
        outputTokens: 8,
        totalTokens: 12
      }
    }).valid,
    true
  );
  assert.equal(
    validateSessionEventPayload(SESSION_EVENT_TYPES.ASSISTANT_FINAL, {
      messageId: "msg_01",
      finishReason: "stop",
      usage: { outputTokens: -1 }
    }).issues.some((item) => item.field === "payload.usage.outputTokens"),
    true
  );
  assert.equal(
    validateSessionEventPayload(SESSION_EVENT_TYPES.PROGRESS, {
      stage: "provider.call",
      status: "in_progress",
      messageCode: "PROVIDER_CALL"
    }).valid,
    true
  );
  assert.equal(
    validateSessionEventPayload(SESSION_EVENT_TYPES.ERROR, {
      errorCode: "PROVIDER_TIMEOUT",
      category: ERROR_CATEGORIES.DEPENDENCY,
      retryable: true,
      message: "Provider request timed out."
    }).valid,
    true
  );
  assert.equal(validateSessionEventPayload("unknown", {}).issues[0].field, "type");
  assert.equal(validateSessionEvent("not-event").issues[0].field, "event");
  assert.equal(
    validateSessionEvent({
      type: "unknown",
      payload: {}
    }).issues.some((item) => item.field === "type"),
    true
  );
});

test("validates HTTP command request and response envelopes", () => {
  const identityScope = createIdentityScope({
    tenantId: "tenant_01",
    userId: "user_01",
    authSubject: "sub_01",
    requestId: "req_01",
    correlationId: "corr_01"
  });
  const command = createHttpCommandRequest({
    contractVersion: createContractVersionRef(),
    commandId: "cmd_01",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    identityScope,
    payload: {
      sessionId: "session_01"
    }
  });

  assert.equal(validateHttpCommandRequest(command).valid, true);
  assert.equal(validateHttpCommandRequest("bad").issues[0].field, "httpCommandRequest");
  assert.equal(
    validateHttpCommandRequest({
      ...command,
      contractVersion: { major: 9, minor: 0, patch: 0 }
    }).issues.some((item) => item.field === "contractVersion"),
    true
  );
  assert.equal(
    validateHttpCommandRequest({
      ...command,
      commandType: "unknown"
    }).issues.some((item) => item.field === "commandType"),
    true
  );
  assert.equal(
    validateHttpCommandRequest({
      ...command,
      commandType: HTTP_COMMAND_TYPES.APPLY_ACTION
    }).issues.some((item) => item.field === "idempotencyKey"),
    true
  );
  assert.equal(
    validateHttpCommandRequest({
      ...command,
      commandType: HTTP_COMMAND_TYPES.APPLY_ACTION,
      idempotencyKey: "idem_01"
    }).valid,
    true
  );

  const response = createHttpCommandResponse({
    contractVersion: createContractVersionRef(),
    requestId: "req_01",
    correlationId: "corr_01",
    commandId: "cmd_01",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    status: HTTP_COMMAND_RESPONSE_STATUSES.COMPLETED,
    result: { accepted: true }
  });

  assert.equal(validateHttpCommandResponse(response).valid, true);
  assert.equal(validateHttpCommandResponse("bad").issues[0].field, "httpCommandResponse");
  assert.equal(
    validateHttpCommandResponse({ ...response, commandType: "unknown" }).issues.some(
      (item) => item.field === "commandType"
    ),
    true
  );
  assert.equal(
    validateHttpCommandResponse({ ...response, status: "done" }).issues.some(
      (item) => item.field === "status"
    ),
    true
  );
  assert.equal(
    validateHttpCommandResponse({
      ...response,
      error: createUnsupportedContractVersionError()
    }).issues.some((item) => item.field === "error"),
    true
  );

  const rejected = createHttpCommandResponse({
    ...response,
    status: HTTP_COMMAND_RESPONSE_STATUSES.REJECTED,
    result: undefined,
    error: createUnsupportedContractVersionError()
  });

  assert.equal(validateHttpCommandResponse(rejected).valid, true);
  assert.equal(
    validateHttpCommandResponse({ ...rejected, error: undefined }).issues.some(
      (item) => item.field === "error"
    ),
    true
  );
});

test("validates action decision and apply-action command payloads", () => {
  const decision = createActionDecisionCommandPayload({
    sessionId: "session_01",
    actionId: "action_01",
    reasonCode: "USER_APPROVED"
  });

  assert.equal(validateActionDecisionCommandPayload(decision).valid, true);
  assert.equal(
    validateActionDecisionCommandPayload({ ...decision, actionId: " " }).issues[0].field,
    "actionDecisionPayload.actionId"
  );

  const applyPayload = createApplyActionCommandPayload({
    sessionId: "session_01",
    actionId: "action_01"
  });

  assert.equal(validateApplyActionCommandPayload(applyPayload).valid, true);
  assert.equal(
    validateApplyActionCommandPayload({
      ...applyPayload,
      actionId: " "
    }).issues.some((item) => item.field === "applyActionPayload.actionId"),
    true
  );
  assert.equal(
    validateHttpCommandRequest({
      ...applyActionCommand,
      idempotencyKey: undefined
    }).issues.some((item) => item.field === "idempotencyKey"),
    true
  );
  assert.equal(validateHttpCommandRequest(applyActionCommand).valid, true);
  assert.equal(validateApplyActionCommandPayload(applyActionCommand.payload).valid, true);
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
  assert.equal(
    validateProposedActionRef({
      ...action,
      provider: "made_up_connector"
    }).issues.some((item) => item.field === "provider"),
    true
  );
  assert.equal(isTerminalProposedActionStatus(PROPOSED_ACTION_STATUSES.PROPOSED), false);
  assert.equal(isTerminalProposedActionStatus(PROPOSED_ACTION_STATUSES.CONFLICTED), true);
  assert.equal(
    canTransitionProposedActionStatus(
      PROPOSED_ACTION_STATUSES.PROPOSED,
      PROPOSED_ACTION_STATUSES.REJECTED
    ),
    true
  );
  assert.equal(canTransitionProposedActionStatus("bad", PROPOSED_ACTION_STATUSES.REJECTED), false);

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

  const anchoredAction = createProposedActionRef({
    ...action,
    targetRange: undefined,
    targetAnchor: createActionTargetAnchor({
      connector: CONNECTORS.GOOGLE_DOCS,
      anchorId: "anchor_01",
      resourceRevision: "rev_01"
    })
  });
  assert.equal(validateProposedActionRef(anchoredAction).valid, true);
  assert.equal(validateActionTargetRange("bad").issues[0].field, "targetRange");

  assert.equal(
    validateProposedActionStatusTransition({
      fromStatus: PROPOSED_ACTION_STATUSES.PROPOSED,
      toStatus: PROPOSED_ACTION_STATUSES.APPROVED,
      expiresAt: LATER,
      now: NOW
    }).valid,
    true
  );
  assert.equal(
    validateProposedActionStatusTransition({
      fromStatus: PROPOSED_ACTION_STATUSES.APPLIED,
      toStatus: PROPOSED_ACTION_STATUSES.APPROVED
    }).issues.some((item) => item.field === "toStatus"),
    true
  );
  assert.equal(
    validateProposedActionStatusTransition({
      fromStatus: PROPOSED_ACTION_STATUSES.PROPOSED,
      toStatus: PROPOSED_ACTION_STATUSES.APPROVED,
      expiresAt: NOW,
      now: LATER
    }).issues.some((item) => item.field === "expiresAt"),
    true
  );
});

test("validates reviewable proposed-action refs for PR-style diff cards", () => {
  const reviewRef = createProposedActionReviewRef({
    actionId: "action_01",
    actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
    status: PROPOSED_ACTION_STATUSES.PROPOSED,
    resourceRef: createResourceRef({
      connector: CONNECTORS.GOOGLE_DOCS,
      resourceId: "doc_01",
      resourceType: "document"
    }),
    target: createProposedActionTarget({
      targetRange: createActionTargetRange({ start: 1, end: 10 })
    }),
    originalTextHash: "sha256:original",
    currentText: "<current review text>",
    proposedText: "<proposed review text>",
    surroundingText: "<surrounding review context>",
    rationale: "Clarify the selected sentence.",
    expiresAt: LATER
  });

  assert.equal(validateProposedActionReviewRef(reviewRef).valid, true);
  assert.equal(validateProposedActionReviewRef(proposedActionReviewRef).valid, true);
  assert.equal(validateProposedActionTarget(reviewRef.target).valid, true);

  const noTarget = validateProposedActionReviewRef({
    ...reviewRef,
    target: undefined
  });
  assert.equal(noTarget.valid, false);
  assert.equal(noTarget.issues.some((item) => item.field === "actionReview.target"), true);
  assert.equal(
    validateProposedActionTarget({
      targetAnchor: createActionTargetAnchor({
        connector: CONNECTORS.GOOGLE_DOCS,
        anchorId: "anchor_01"
      }),
      targetRange: createActionTargetRange({ start: 1, end: 10 })
    }).issues.some((item) => item.field === "target"),
    true
  );

  assert.equal(
    validateProposedActionReviewRef({
      ...reviewRef,
      resourceRef: { resourceId: "doc_01" }
    }).issues.some((item) => item.field === "actionReview.resourceRef.connector"),
    true
  );
  assert.equal(
    validateProposedActionReviewRef({
      ...reviewRef,
      resourceRef: { ...reviewRef.resourceRef, connector: "made_up_connector" }
    }).issues.some((item) => item.field === "actionReview.resourceRef.connector"),
    true
  );
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

test("validates provider-neutral stream events", () => {
  const delta = createProviderStreamEvent({
    type: PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_DELTA,
    provider: MODEL_PROVIDERS.OPENAI,
    model: "gpt-example",
    delta: "fixture-delta"
  });

  assert.equal(validateProviderStreamEvent(delta).valid, true);

  const final = createProviderStreamEvent({
    type: PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_FINAL,
    provider: MODEL_PROVIDERS.OPENAI,
    model: "gpt-example",
    finishReason: "stop",
    usage: {
      inputTokens: 4,
      outputTokens: 8,
      totalTokens: 12
    }
  });

  assert.equal(validateProviderStreamEvent(final).valid, true);

  const error = createProviderStreamEvent({
    type: PROVIDER_STREAM_EVENT_TYPES.ERROR,
    provider: MODEL_PROVIDERS.ANTHROPIC,
    model: "claude-example",
    error: createProviderError({
      category: PROVIDER_ERROR_CATEGORIES.RATE_LIMITED,
      code: "PROVIDER_RATE_LIMITED",
      message: "Provider asked the service to retry later.",
      retryAfterSeconds: 30
    })
  });

  assert.equal(validateProviderStreamEvent(error).valid, true);
  assert.equal(
    validateProviderStreamEvent({ ...delta, provider: "unknown" }).issues.some(
      (item) => item.field === "provider"
    ),
    true
  );
  assert.equal(
    validateProviderStreamEvent({
      ...final,
      usage: { totalTokens: -1 }
    }).issues.some((item) => item.field === "usage.totalTokens"),
    true
  );
  assert.equal(
    validateProviderStreamEvent({
      ...delta,
      error: error.error
    }).issues.some((item) => item.field === "error"),
    true
  );
  assert.equal(
    validateProviderStreamEvent({
      type: PROVIDER_STREAM_EVENT_TYPES.ERROR,
      provider: MODEL_PROVIDERS.OPENAI
    }).issues.some((item) => item.field === "providerError"),
    true
  );
});

test("validates provider text proposal batches without provider-specific workflow ownership", () => {
  const proposal = createProviderTextProposal({
    proposalId: "proposal_01",
    actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
    currentText: "<current review text>",
    proposedText: "<proposed review text>",
    surroundingText: "<surrounding review context>",
    rationale: "Clarify the selected sentence.",
    targetHint: createProviderTextProposalTargetHint({
      originalTextHash: "sha256:original"
    })
  });
  const batch = createProviderTextProposalBatch({
    provider: MODEL_PROVIDERS.OPENAI,
    model: "gpt-example",
    messageId: "msg_01",
    proposals: [proposal],
    usage: {
      inputTokens: 10,
      outputTokens: 20,
      totalTokens: 30
    }
  });

  assert.equal(validateProviderTextProposal(proposal).valid, true);
  assert.equal(validateProviderTextProposalBatch(batch).valid, true);
  assert.equal(validateProviderTextProposalBatch(providerProposalBatch).valid, true);
  assert.equal(validateProviderTextProposalTargetHint(proposal.targetHint).valid, true);
  assert.equal(
    validateProviderTextProposal({
      ...proposal,
      actionType: "rewrite"
    }).issues[0].field,
    "providerTextProposal.actionType"
  );
  assert.equal(
    validateProviderTextProposalBatch({
      ...batch,
      proposals: [{ ...proposal, proposedText: undefined }]
    }).issues.some((item) => item.field === "providerTextProposalBatch.proposals.0.proposedText"),
    true
  );
  assert.equal(
    validateProviderTextProposal({
      ...proposal,
      targetHint: {
        originalTextHash: "sha256:original",
        rawDocumentText: "<not allowed>"
      }
    }).issues.some((item) => item.field === "providerTextProposal.targetHint.rawDocumentText"),
    true
  );
  assert.equal(
    validateProviderTextProposal({
      ...proposal,
      targetHint: createProviderTextProposalTargetHint({
        targetAnchor: {
          connector: "made_up_connector",
          anchorId: "anchor_01"
        }
      })
    }).issues.some((item) => item.field === "providerTextProposal.targetHint.targetAnchor.connector"),
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

test("validates Google Docs resource list and read-context connector results", () => {
  const resourceRef = createResourceRef({
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: "doc_01",
    resourceType: "document",
    displayName: "Quarterly plan"
  });
  const listResult = createConnectorResourceListResult({
    resources: [resourceRef],
    nextPageToken: "next_page"
  });

  assert.equal(validateConnectorResourceListResult(listResult).valid, true);
  assert.equal(validateConnectorResourceListResult(googleDocsResourceListResult).valid, true);
  assert.equal(
    validateConnectorResourceListResult({
      resources: [{ resourceId: "doc_01" }]
    }).issues.some((item) => item.field === "resourceListResult.resources.0.connector"),
    true
  );
  assert.equal(
    validateConnectorResourceListResult({
      resources: [{ ...resourceRef, connector: "made_up_connector" }]
    }).issues.some((item) => item.field === "resourceListResult.resources.0.connector"),
    true
  );

  const readResult = createConnectorReadContextResult({
    context: googleDocsReadContextResult.context,
    resourceRevision: "rev_01"
  });
  assert.equal(validateConnectorReadContextResult(readResult).valid, true);
  assert.equal(validateConnectorReadContextResult(googleDocsReadContextResult).valid, true);
  assert.equal(
    validateConnectorReadContextResult({
      resourceRevision: "rev_01"
    }).issues.some((item) => item.field === "readContextResult.context"),
    true
  );
  assert.equal(
    validateConnectorReadContextResult({
      ...readResult,
      context: { ...readResult.context, contentHash: " " }
    }).issues.some((item) => item.field === "readContextResult.context.contentHash"),
    true
  );
  assert.equal(
    validateConnectorReadContextResult({
      ...readResult,
      context: { ...readResult.context, provider: "made_up_connector" }
    }).issues.some((item) => item.field === "readContextResult.context.provider"),
    true
  );
});

test("validates metadata-only log events", () => {
  const event = createMetadataLogEvent({
    requestId: "req_01",
    correlationId: "corr_01",
    tenantId: "tenant_01",
    userId: "user_01",
    service: "orchestration",
    route: "/commands",
    operation: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    status: LOG_STATUS_VALUES.SUCCEEDED,
    errorCategory: ERROR_CATEGORIES.DEPENDENCY,
    provider: MODEL_PROVIDERS.OPENAI,
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30,
    costEstimateMicroUsd: 100
  });

  assert.equal(METADATA_LOG_FIELDS.REQUEST_ID, "requestId");
  assert.equal(validateMetadataLogEvent(event).valid, true);
  assert.equal(
    validateMetadataLogEvent({ ...event, status: "ok" }).issues[0].field,
    "status"
  );
  assert.equal(
    validateMetadataLogEvent({ ...event, provider: "unknown" }).issues[0].field,
    "provider"
  );
  assert.equal(
    validateMetadataLogEvent({ ...event, errorCategory: "dependency" }).issues[0].field,
    "errorCategory"
  );
  assert.equal(
    validateMetadataLogEvent({ ...event, prompt: "raw prompt text" }).issues[0].field,
    "prompt"
  );
  assert.equal(
    validateMetadataLogEvent({ ...event, providerKey: "sk-test" }).issues[0].field,
    "providerKey"
  );
  assert.equal(
    validateMetadataLogEvent({ ...event, arbitraryField: "value" }).issues[0].field,
    "arbitraryField"
  );
  assert.equal(validateMetadataLogEvent("bad").issues[0].field, "metadataLogEvent");
});
