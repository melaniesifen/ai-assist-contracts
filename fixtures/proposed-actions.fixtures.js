import {
  CONNECTORS,
  ERROR_CATEGORIES,
  HTTP_COMMAND_RESPONSE_STATUSES,
  HTTP_COMMAND_TYPES,
  PROPOSED_ACTION_STATUSES,
  PROPOSED_ACTION_TYPES,
  SESSION_EVENT_TYPES,
  STANDARD_ERROR_CODES,
  createActionDecisionCommandPayload,
  createActionTargetRange,
  createApplyActionCommandPayload,
  createContractError,
  createContractVersionRef,
  createHttpCommandRequest,
  createHttpCommandResponse,
  createIdentityScope,
  createProposedActionRef,
  createProposedActionReviewRef,
  createProposedActionTarget,
  createResourceRef,
  createSessionEvent
} from "../src/index.js";

export const PROPOSED_ACTION_FIXTURE_NOW = "2026-06-08T16:00:00.000Z";
export const PROPOSED_ACTION_FIXTURE_UPDATED_AT = "2026-06-08T16:05:00.000Z";
export const PROPOSED_ACTION_FIXTURE_EXPIRES_AT = "2026-06-09T16:00:00.000Z";
export const PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION = createContractVersionRef();

export const proposedActionIdentityScope = createIdentityScope({
  tenantId: "tenant_proposed_action_demo",
  userId: "user_proposed_action_demo",
  authSubject: "auth_subject_proposed_action_demo",
  requestId: "req_proposed_action_demo",
  correlationId: "corr_proposed_action_demo"
});

export const proposedActionWrongTenantIdentityScope = createIdentityScope({
  tenantId: "tenant_other_demo",
  userId: proposedActionIdentityScope.userId,
  authSubject: "auth_subject_other_demo",
  requestId: "req_proposed_action_wrong_tenant",
  correlationId: proposedActionIdentityScope.correlationId
});

export const proposedActionResourceRef = createResourceRef({
  connector: CONNECTORS.GOOGLE_DOCS,
  resourceId: "resource_proposed_action_demo",
  resourceType: "document",
  displayName: "Fixture proposal document"
});

function fixture({ name, taskArea, flow, validator, value }) {
  return Object.freeze({
    name,
    taskArea,
    flow,
    contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
    validator,
    value
  });
}

function actionRef(status, overrides = {}) {
  return createProposedActionRef({
    actionId: "action_proposed_action_demo",
    tenantId: proposedActionIdentityScope.tenantId,
    userId: proposedActionIdentityScope.userId,
    sessionId: "session_proposed_action_demo",
    provider: CONNECTORS.GOOGLE_DOCS,
    resourceId: proposedActionResourceRef.resourceId,
    resourceRevision: "revision_proposed_action_demo",
    targetRange: createActionTargetRange({ start: 10, end: 28 }),
    originalTextHash: "sha256:fixture-original-text",
    actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
    status,
    createdAt: PROPOSED_ACTION_FIXTURE_NOW,
    updatedAt: PROPOSED_ACTION_FIXTURE_UPDATED_AT,
    expiresAt: PROPOSED_ACTION_FIXTURE_EXPIRES_AT,
    ...overrides
  });
}

function reviewRef(status, overrides = {}) {
  return createProposedActionReviewRef({
    actionId: "action_proposed_action_demo",
    actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
    status,
    resourceRef: proposedActionResourceRef,
    target: createProposedActionTarget({
      targetRange: createActionTargetRange({ start: 10, end: 28 })
    }),
    originalTextHash: "sha256:fixture-original-text",
    currentText: "<current text excerpt>",
    proposedText: "<proposed text excerpt>",
    surroundingText: "<surrounding text excerpt>",
    rationale: "Clarify the selected sentence.",
    expiresAt: PROPOSED_ACTION_FIXTURE_EXPIRES_AT,
    ...overrides
  });
}

function statusEvent({ eventId, previousStatus, status, reasonCode, sequence }) {
  return createSessionEvent({
    eventId,
    tenantId: proposedActionIdentityScope.tenantId,
    userId: proposedActionIdentityScope.userId,
    sessionId: "session_proposed_action_demo",
    requestId: proposedActionIdentityScope.requestId,
    correlationId: proposedActionIdentityScope.correlationId,
    type: SESSION_EVENT_TYPES.ACTION_STATUS_CHANGED,
    sequence,
    createdAt: PROPOSED_ACTION_FIXTURE_UPDATED_AT,
    payload: {
      actionId: "action_proposed_action_demo",
      previousStatus,
      status,
      reasonCode
    }
  });
}

function applyResult({
  status,
  idempotencyKey = "idem_apply_action_demo",
  replayed = false,
  operationId,
  conflictReasonCode,
  failureCode,
  resourceRevision
}) {
  return {
    actionId: "action_proposed_action_demo",
    sessionId: "session_proposed_action_demo",
    resourceId: proposedActionResourceRef.resourceId,
    status,
    idempotencyKey,
    replayed,
    ...(operationId === undefined ? {} : { operationId }),
    ...(conflictReasonCode === undefined ? {} : { conflictReasonCode }),
    ...(failureCode === undefined ? {} : { failureCode }),
    ...(resourceRevision === undefined ? {} : { resourceRevision }),
    resultRecordedAt: PROPOSED_ACTION_FIXTURE_UPDATED_AT
  };
}

function applyResponse({ name, flow, result }) {
  return fixture({
    name,
    taskArea: "ACTION-004 EVT-001",
    flow,
    validator: "validateHttpCommandResponse",
    value: createHttpCommandResponse({
      contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
      requestId: proposedActionIdentityScope.requestId,
      correlationId: proposedActionIdentityScope.correlationId,
      commandId: "cmd_proposed_action_apply",
      commandType: HTTP_COMMAND_TYPES.APPLY_ACTION,
      status: HTTP_COMMAND_RESPONSE_STATUSES.COMPLETED,
      result
    })
  });
}

export const proposedActionRefFixture = fixture({
  name: "proposed-action-record-proposed",
  taskArea: "ACTION-001",
  flow: "proposed action record creation",
  validator: "validateProposedActionRef",
  value: actionRef(PROPOSED_ACTION_STATUSES.PROPOSED)
});

export const proposedActionReviewFixtures = Object.freeze([
  fixture({
    name: "proposed-action-review-proposed",
    taskArea: "ACTION-001",
    flow: "review card proposed state",
    validator: "validateProposedActionReviewRef",
    value: reviewRef(PROPOSED_ACTION_STATUSES.PROPOSED)
  }),
  fixture({
    name: "proposed-action-review-approved",
    taskArea: "ACTION-003",
    flow: "review card approved state",
    validator: "validateProposedActionReviewRef",
    value: reviewRef(PROPOSED_ACTION_STATUSES.APPROVED)
  }),
  fixture({
    name: "proposed-action-review-rejected",
    taskArea: "ACTION-003",
    flow: "review card rejected state",
    validator: "validateProposedActionReviewRef",
    value: reviewRef(PROPOSED_ACTION_STATUSES.REJECTED)
  }),
  fixture({
    name: "proposed-action-review-expired",
    taskArea: "ACTION-001 ACTION-003",
    flow: "review card expired state",
    validator: "validateProposedActionReviewRef",
    value: reviewRef(PROPOSED_ACTION_STATUSES.EXPIRED, {
      expiresAt: "2026-06-08T15:59:00.000Z"
    })
  })
]);

export const approveActionCommandFixture = fixture({
  name: "action-decision-approve-command",
  taskArea: "ACTION-003 EVT-001",
  flow: "approve action decision command",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
    commandId: "cmd_proposed_action_approve",
    commandType: HTTP_COMMAND_TYPES.APPROVE_ACTION,
    identityScope: proposedActionIdentityScope,
    payload: createActionDecisionCommandPayload({
      sessionId: "session_proposed_action_demo",
      actionId: "action_proposed_action_demo",
      reasonCode: "USER_APPROVED"
    })
  })
});

export const rejectActionCommandFixture = fixture({
  name: "action-decision-reject-command",
  taskArea: "ACTION-003 EVT-001",
  flow: "reject action decision command",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
    commandId: "cmd_proposed_action_reject",
    commandType: HTTP_COMMAND_TYPES.REJECT_ACTION,
    identityScope: proposedActionIdentityScope,
    payload: createActionDecisionCommandPayload({
      sessionId: "session_proposed_action_demo",
      actionId: "action_proposed_action_demo",
      reasonCode: "USER_REJECTED"
    })
  })
});

export const applyActionCommandFixture = fixture({
  name: "action-command-apply-idempotent",
  taskArea: "ACTION-004 EVT-001",
  flow: "apply action command",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
    commandId: "cmd_proposed_action_apply",
    commandType: HTTP_COMMAND_TYPES.APPLY_ACTION,
    identityScope: proposedActionIdentityScope,
    idempotencyKey: "idem_apply_action_demo",
    payload: createApplyActionCommandPayload({
      sessionId: "session_proposed_action_demo",
      actionId: "action_proposed_action_demo"
    })
  })
});

export const applyActionResultResponseFixtures = Object.freeze([
  applyResponse({
    name: "action-apply-result-applied",
    flow: "successful apply result",
    result: applyResult({
      status: PROPOSED_ACTION_STATUSES.APPLIED,
      operationId: "operation_apply_demo",
      resourceRevision: "revision_after_apply_demo"
    })
  }),
  applyResponse({
    name: "action-apply-result-duplicate-replay",
    flow: "same-key duplicate apply replay",
    result: applyResult({
      status: PROPOSED_ACTION_STATUSES.APPLIED,
      replayed: true,
      operationId: "operation_apply_demo",
      resourceRevision: "revision_after_apply_demo"
    })
  }),
  applyResponse({
    name: "action-apply-result-conflict-no-mutation",
    flow: "stale target conflict with no mutation",
    result: applyResult({
      status: PROPOSED_ACTION_STATUSES.CONFLICTED,
      conflictReasonCode: "STALE_RESOURCE_REVISION",
      resourceRevision: "revision_changed_demo"
    })
  }),
  applyResponse({
    name: "action-apply-result-failed",
    flow: "failed apply result",
    result: applyResult({
      status: PROPOSED_ACTION_STATUSES.FAILED,
      failureCode: STANDARD_ERROR_CODES.CONNECTOR_OPERATION_FAILED
    })
  })
]);

export const crossScopeDeniedResponseFixture = fixture({
  name: "safe-error-cross-scope-denied",
  taskArea: "ACTION-003 OPS-004 SAFE-003",
  flow: "cross-tenant action decision denied",
  validator: "validateHttpCommandResponse",
  value: createHttpCommandResponse({
    contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
    requestId: proposedActionWrongTenantIdentityScope.requestId,
    correlationId: proposedActionWrongTenantIdentityScope.correlationId,
    commandId: "cmd_proposed_action_wrong_tenant",
    commandType: HTTP_COMMAND_TYPES.APPROVE_ACTION,
    status: HTTP_COMMAND_RESPONSE_STATUSES.REJECTED,
    error: createContractError({
      code: STANDARD_ERROR_CODES.AUTHORIZATION_DENIED,
      category: ERROR_CATEGORIES.AUTHORIZATION,
      message: "Access denied.",
      retryable: false,
      httpStatus: 403,
      target: "actionId"
    })
  })
});

export const reconnectRequiredApplyResponseFixture = fixture({
  name: "safe-error-reconnect-required-apply",
  taskArea: "AUTH-003 ACTION-004 OPS-004 SAFE-003",
  flow: "apply action reconnect-required safe error",
  validator: "validateHttpCommandResponse",
  value: createHttpCommandResponse({
    contractVersion: PROPOSED_ACTION_FIXTURE_CONTRACT_VERSION,
    requestId: proposedActionIdentityScope.requestId,
    correlationId: proposedActionIdentityScope.correlationId,
    commandId: "cmd_proposed_action_apply_reconnect_required",
    commandType: HTTP_COMMAND_TYPES.APPLY_ACTION,
    status: HTTP_COMMAND_RESPONSE_STATUSES.REJECTED,
    error: createContractError({
      code: STANDARD_ERROR_CODES.OAUTH_RECONNECT_REQUIRED,
      category: ERROR_CATEGORIES.OAUTH,
      message: "Reconnect Google before applying this action.",
      retryable: false,
      httpStatus: 401,
      target: "googleOAuth"
    })
  })
});

export const actionProposedEventFixture = fixture({
  name: "action-proposed-event",
  taskArea: "EVT-002 ACTION-001",
  flow: "action proposed session event",
  validator: "validateSessionEvent",
  value: createSessionEvent({
    eventId: "evt_action_proposed",
    tenantId: proposedActionIdentityScope.tenantId,
    userId: proposedActionIdentityScope.userId,
    sessionId: "session_proposed_action_demo",
    requestId: proposedActionIdentityScope.requestId,
    correlationId: proposedActionIdentityScope.correlationId,
    type: SESSION_EVENT_TYPES.ACTION_PROPOSED,
    sequence: 1,
    createdAt: PROPOSED_ACTION_FIXTURE_NOW,
    payload: {
      actionId: "action_proposed_action_demo",
      actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
      resourceRef: proposedActionResourceRef,
      summary: "Review one proposed edit.",
      expiresAt: PROPOSED_ACTION_FIXTURE_EXPIRES_AT
    }
  })
});

export const actionStatusEventFixtures = Object.freeze([
  fixture({
    name: "action-status-changed-approved",
    taskArea: "EVT-002 ACTION-003",
    flow: "action approved status event",
    validator: "validateSessionEvent",
    value: statusEvent({
      eventId: "evt_action_status_approved",
      previousStatus: PROPOSED_ACTION_STATUSES.PROPOSED,
      status: PROPOSED_ACTION_STATUSES.APPROVED,
      reasonCode: "USER_APPROVED",
      sequence: 2
    })
  }),
  fixture({
    name: "action-status-changed-rejected",
    taskArea: "EVT-002 ACTION-003",
    flow: "action rejected status event",
    validator: "validateSessionEvent",
    value: statusEvent({
      eventId: "evt_action_status_rejected",
      previousStatus: PROPOSED_ACTION_STATUSES.PROPOSED,
      status: PROPOSED_ACTION_STATUSES.REJECTED,
      reasonCode: "USER_REJECTED",
      sequence: 3
    })
  }),
  fixture({
    name: "action-status-changed-expired",
    taskArea: "EVT-002 ACTION-001 ACTION-003",
    flow: "action expired status event",
    validator: "validateSessionEvent",
    value: statusEvent({
      eventId: "evt_action_status_expired",
      previousStatus: PROPOSED_ACTION_STATUSES.PROPOSED,
      status: PROPOSED_ACTION_STATUSES.EXPIRED,
      reasonCode: "ACTION_EXPIRED",
      sequence: 4
    })
  }),
  fixture({
    name: "action-status-changed-applied",
    taskArea: "EVT-002 ACTION-004",
    flow: "action applied status event",
    validator: "validateSessionEvent",
    value: statusEvent({
      eventId: "evt_action_status_applied",
      previousStatus: PROPOSED_ACTION_STATUSES.APPROVED,
      status: PROPOSED_ACTION_STATUSES.APPLIED,
      reasonCode: "APPLY_SUCCEEDED",
      sequence: 5
    })
  }),
  fixture({
    name: "action-status-changed-conflicted",
    taskArea: "EVT-002 ACTION-004",
    flow: "action conflicted status event",
    validator: "validateSessionEvent",
    value: statusEvent({
      eventId: "evt_action_status_conflicted",
      previousStatus: PROPOSED_ACTION_STATUSES.APPROVED,
      status: PROPOSED_ACTION_STATUSES.CONFLICTED,
      reasonCode: "STALE_RESOURCE_REVISION",
      sequence: 6
    })
  }),
  fixture({
    name: "action-status-changed-failed",
    taskArea: "EVT-002 ACTION-004",
    flow: "action failed status event",
    validator: "validateSessionEvent",
    value: statusEvent({
      eventId: "evt_action_status_failed",
      previousStatus: PROPOSED_ACTION_STATUSES.APPROVED,
      status: PROPOSED_ACTION_STATUSES.FAILED,
      reasonCode: STANDARD_ERROR_CODES.CONNECTOR_OPERATION_FAILED,
      sequence: 7
    })
  })
]);

export const PROPOSED_ACTION_FIXTURES = Object.freeze([
  proposedActionRefFixture,
  ...proposedActionReviewFixtures,
  approveActionCommandFixture,
  rejectActionCommandFixture,
  applyActionCommandFixture,
  ...applyActionResultResponseFixtures,
  crossScopeDeniedResponseFixture,
  reconnectRequiredApplyResponseFixture,
  actionProposedEventFixture,
  ...actionStatusEventFixtures
]);
