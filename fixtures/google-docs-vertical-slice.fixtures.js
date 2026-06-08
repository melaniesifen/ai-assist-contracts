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
  MODEL_PROVIDERS,
  PROPOSED_ACTION_STATUSES,
  PROPOSED_ACTION_TYPES,
  PROVIDER_ERROR_CATEGORIES,
  PROVIDER_RESPONSE_STATUSES,
  SESSION_EVENT_TYPES,
  SESSION_SECRET_STATUSES,
  STANDARD_ERROR_CODES,
  createActionDecisionCommandPayload,
  createActionTargetRange,
  createApplyActionCommandPayload,
  createConnectorError,
  createConnectorReadContextResult,
  createConnectorResponse,
  createConnectorResourceListResult,
  createContextConsentGrantRef,
  createContractError,
  createContractVersionRef,
  createHttpCommandRequest,
  createHttpCommandResponse,
  createIdentityScope,
  createNormalizedContext,
  createProductCredentialError,
  createProviderError,
  createProviderResponse,
  createProviderTextProposal,
  createProviderTextProposalBatch,
  createProviderTextProposalTargetHint,
  createProposedActionReviewRef,
  createProvenance,
  createResourceRef,
  createSessionEvent,
  createSessionSecretStatusRef,
  createUnsupportedContractVersionError
} from "../src/index.js";

export const GOOGLE_DOCS_FIXTURE_NOW = "2026-06-02T18:00:00.000Z";
export const GOOGLE_DOCS_FIXTURE_EXPIRES_AT = "2026-06-03T18:00:00.000Z";
export const GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION = createContractVersionRef();

export const googleDocsIdentityScope = createIdentityScope({
  tenantId: "tenant_google_docs_demo",
  userId: "user_google_docs_demo",
  authSubject: "auth_subject_google_docs_demo",
  requestId: "req_google_docs_demo",
  correlationId: "corr_google_docs_demo"
});

export const googleDocsResourceRef = createResourceRef({
  connector: CONNECTORS.GOOGLE_DOCS,
  resourceId: "gdoc_google_docs_demo",
  resourceType: "document",
  displayName: "Google Docs fixture document",
  externalUrl: "https://docs.google.com/document/d/gdoc_google_docs_demo/edit"
});

const selectionRange = createActionTargetRange({ start: 42, end: 64 });
const replacementRange = createActionTargetRange({ start: 42, end: 64 });

function fixture({ name, taskArea, flow, validator, value }) {
  return Object.freeze({
    name,
    taskArea,
    flow,
    contractVersion: GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION,
    validator,
    value
  });
}

export const verifiedAuthSubjectFixture = fixture({
  name: "auth-identity-verified-subject",
  taskArea: "AUTH-001",
  flow: "server-derived identity",
  validator: "validateIdentityScope",
  value: googleDocsIdentityScope
});

export const authenticatedCommandEnvelopeFixture = fixture({
  name: "auth-command-envelope-create-assistant-command",
  taskArea: "AUTH-001 EVT-001",
  flow: "authenticated command envelope",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION,
    commandId: "cmd_google_docs_create_assistant",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    identityScope: googleDocsIdentityScope,
    payload: {
      sessionId: "session_google_docs_demo",
      resourceId: googleDocsResourceRef.resourceId,
      contextMode: CONTEXT_MODES.SELECTION,
      provider: MODEL_PROVIDERS.OPENAI
    }
  })
});

export const unsupportedVersionCommandFixture = fixture({
  name: "version-command-envelope-unsupported-major",
  taskArea: "ARCH-003",
  flow: "unsupported contract version",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: createContractVersionRef({ major: 99, minor: 0, patch: 0 }),
    commandId: "cmd_google_docs_unsupported_version",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    identityScope: googleDocsIdentityScope,
    payload: {
      sessionId: "session_google_docs_demo"
    }
  })
});

export const unsupportedVersionErrorResponseFixture = fixture({
  name: "version-error-unsupported-contract-version",
  taskArea: "ARCH-003",
  flow: "unsupported contract version error",
  validator: "validateHttpCommandResponse",
  value: createHttpCommandResponse({
    contractVersion: GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION,
    requestId: googleDocsIdentityScope.requestId,
    correlationId: googleDocsIdentityScope.correlationId,
    commandId: "cmd_google_docs_unsupported_version",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    status: HTTP_COMMAND_RESPONSE_STATUSES.REJECTED,
    error: createUnsupportedContractVersionError()
  })
});

export const productCredentialErrorFixtures = Object.freeze([
  fixture({
    name: "auth-error-product-session-unauthorized",
    taskArea: "AUTH-002",
    flow: "missing product session",
    validator: "validateContractError",
    value: createProductCredentialError({
      kind: "UNAUTHORIZED",
      message: "Product session is required."
    })
  }),
  fixture({
    name: "auth-error-product-session-expired",
    taskArea: "AUTH-002",
    flow: "expired product session",
    validator: "validateContractError",
    value: createProductCredentialError({
      kind: "EXPIRED",
      message: "Product session expired."
    })
  }),
  fixture({
    name: "auth-error-product-session-malformed",
    taskArea: "AUTH-002",
    flow: "malformed product session",
    validator: "validateContractError",
    value: createProductCredentialError({
      kind: "MALFORMED",
      message: "Product session credential is malformed."
    })
  })
]);

export const sessionSecretFixtures = Object.freeze([
  fixture({
    name: "secrets-session-secret-active-metadata",
    taskArea: "AUTH-004",
    flow: "metadata-only active session secret",
    validator: "validateSessionSecretStatusRef",
    value: createSessionSecretStatusRef({
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      provider: MODEL_PROVIDERS.OPENAI,
      secretId: "secret_google_docs_openai",
      fingerprint: "fp_google_docs_openai",
      status: SESSION_SECRET_STATUSES.ACTIVE,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      lastValidatedAt: GOOGLE_DOCS_FIXTURE_NOW,
      expiresAt: GOOGLE_DOCS_FIXTURE_EXPIRES_AT
    })
  }),
  fixture({
    name: "secrets-session-secret-expired-error",
    taskArea: "AUTH-004",
    flow: "expired provider session secret",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.PROVIDER_SECRET_EXPIRED,
      category: ERROR_CATEGORIES.AUTHENTICATION,
      message: "Provider session secret expired.",
      retryable: false,
      httpStatus: 401,
      target: "sessionSecret"
    })
  }),
  fixture({
    name: "secrets-session-secret-validation-failed-metadata",
    taskArea: "AUTH-004",
    flow: "invalid provider secret metadata",
    validator: "validateSessionSecretStatusRef",
    value: createSessionSecretStatusRef({
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      provider: MODEL_PROVIDERS.OPENAI,
      secretId: "secret_google_docs_invalid",
      fingerprint: "fp_google_docs_invalid",
      status: SESSION_SECRET_STATUSES.VALIDATION_FAILED,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      lastValidatedAt: GOOGLE_DOCS_FIXTURE_NOW,
      expiresAt: GOOGLE_DOCS_FIXTURE_EXPIRES_AT
    })
  })
]);

export const activeConsentGrantFixture = fixture({
  name: "context-consent-grant-active-google-docs-selection",
  taskArea: "CTX-002",
  flow: "active context consent grant",
  validator: "validateContextConsentGrantRef",
  value: createContextConsentGrantRef({
    grantId: "grant_google_docs_google_docs_selection",
    tenantId: googleDocsIdentityScope.tenantId,
    userId: googleDocsIdentityScope.userId,
    provider: CONNECTORS.GOOGLE_DOCS,
    resourceRef: googleDocsResourceRef,
    contextMode: CONTEXT_MODES.SELECTION,
    scopes: Object.freeze(["documents.readonly"]),
    status: CONSENT_GRANT_STATUSES.ACTIVE,
    grantedAt: GOOGLE_DOCS_FIXTURE_NOW,
    expiresAt: GOOGLE_DOCS_FIXTURE_EXPIRES_AT
  })
});

export const consentErrorFixtures = Object.freeze([
  fixture({
    name: "context-error-consent-missing",
    taskArea: "CTX-002",
    flow: "missing context consent",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.CONSENT_REQUIRED,
      category: ERROR_CATEGORIES.CONSENT_REQUIRED,
      message: "Consent is required before reading this resource.",
      retryable: false,
      httpStatus: 403,
      target: "contextConsentGrant"
    })
  }),
  fixture({
    name: "context-error-consent-revoked",
    taskArea: "CTX-002",
    flow: "revoked context consent",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.CONSENT_REQUIRED,
      category: ERROR_CATEGORIES.CONSENT_REQUIRED,
      message: "Consent grant was revoked.",
      retryable: false,
      httpStatus: 403,
      target: "contextConsentGrant"
    })
  }),
  fixture({
    name: "context-error-consent-expired",
    taskArea: "CTX-002",
    flow: "expired context consent",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.CONSENT_REQUIRED,
      category: ERROR_CATEGORIES.CONSENT_REQUIRED,
      message: "Consent grant expired.",
      retryable: false,
      httpStatus: 403,
      target: "contextConsentGrant"
    })
  })
]);

export const selectionContext = createNormalizedContext({
  contextId: "ctx_google_docs_selection",
  tenantId: googleDocsIdentityScope.tenantId,
  userId: googleDocsIdentityScope.userId,
  sessionId: "session_google_docs_demo",
  provider: CONNECTORS.GOOGLE_DOCS,
  resourceRef: googleDocsResourceRef,
  contextMode: CONTEXT_MODES.SELECTION,
  sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_SELECTION,
  trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
  content: "<fixture selected excerpt>",
  contentHash: "sha256:google-docs-selection",
  anchors: [selectionRange],
  resourceRevision: "rev_google_docs",
  metadata: {
    truncated: false,
    contentLength: 26
  },
  provenance: createProvenance({
    sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_SELECTION,
    trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: googleDocsResourceRef.resourceId,
    resourceVersion: "rev_google_docs",
    selectionAnchor: selectionRange,
    capturedAt: GOOGLE_DOCS_FIXTURE_NOW,
    clientSupplied: false,
    connectorVerified: true
  }),
  capturedAt: GOOGLE_DOCS_FIXTURE_NOW,
  expiresAt: GOOGLE_DOCS_FIXTURE_EXPIRES_AT
});

export const activeResourceContext = createNormalizedContext({
  ...selectionContext,
  contextId: "ctx_google_docs_active_resource",
  contextMode: CONTEXT_MODES.ACTIVE_RESOURCE,
  sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_RESOURCE_EXCERPT,
  content: "<fixture active resource excerpt>",
  contentHash: "sha256:google-docs-active-resource",
  metadata: {
    truncated: false,
    contentLength: 33
  },
  provenance: createProvenance({
    sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_RESOURCE_EXCERPT,
    trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: googleDocsResourceRef.resourceId,
    resourceVersion: "rev_google_docs",
    capturedAt: GOOGLE_DOCS_FIXTURE_NOW,
    clientSupplied: false,
    connectorVerified: true
  })
});

export const truncatedContext = createNormalizedContext({
  ...activeResourceContext,
  contextId: "ctx_google_docs_truncated",
  content: "<fixture truncated resource excerpt>",
  contentHash: "sha256:google-docs-truncated",
  metadata: {
    truncated: true,
    contentLength: 34,
    originalContentLength: 9000,
    truncationReason: "MAX_CONTEXT_BYTES"
  }
});

export const normalizedContextFixtures = Object.freeze([
  fixture({
    name: "context-normalized-selection-connector-verified",
    taskArea: "CTX-003",
    flow: "selection context",
    validator: "validateNormalizedContext",
    value: selectionContext
  }),
  fixture({
    name: "context-normalized-active-resource-connector-verified",
    taskArea: "CTX-003",
    flow: "active resource context",
    validator: "validateNormalizedContext",
    value: activeResourceContext
  }),
  fixture({
    name: "context-normalized-active-resource-truncated",
    taskArea: "CTX-003",
    flow: "truncated active resource context",
    validator: "validateNormalizedContext",
    value: truncatedContext
  })
]);

export const googleDocsResourceListResult = createConnectorResourceListResult({
  resources: [googleDocsResourceRef],
  nextPageToken: "page_google_docs_next"
});

export const googleDocsReadContextResult = createConnectorReadContextResult({
  context: selectionContext,
  resourceRevision: "rev_google_docs"
});

export const googleConnectorFixtures = Object.freeze([
  fixture({
    name: "connector-google-docs-list-success",
    taskArea: "CTX-005 DOCS-001",
    flow: "Google Docs resource discovery",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.LIST_RESOURCES,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      result: googleDocsResourceListResult
    })
  }),
  fixture({
    name: "connector-google-docs-list-permission-error",
    taskArea: "CTX-005 DOCS-001",
    flow: "Google Docs resource permission failure",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.LIST_RESOURCES,
      status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.AUTHORIZATION,
        code: "GOOGLE_DOCS_PERMISSION_DENIED",
        message: "User is not authorized to list this resource."
      })
    })
  }),
  fixture({
    name: "connector-google-docs-read-context-success",
    taskArea: "CTX-005 DOCS-002",
    flow: "Google Docs read context",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: "rev_google_docs",
      result: googleDocsReadContextResult
    })
  }),
  fixture({
    name: "connector-google-docs-target-verify-success",
    taskArea: "CTX-005 ACTION-004",
    flow: "write-back target verification",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.VALIDATE_MUTATION_TARGET,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: "rev_google_docs",
      result: {
        resourceId: googleDocsResourceRef.resourceId,
        resourceRevision: "rev_google_docs",
        targetRange: replacementRange,
        originalTextHash: "sha256:google-docs-original",
        connectorVerified: true
      }
    })
  }),
  fixture({
    name: "connector-google-docs-target-conflict-stale-revision",
    taskArea: "CTX-005 ACTION-004",
    flow: "stale revision conflict",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.VALIDATE_MUTATION_TARGET,
      status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.CONFLICT,
        code: "STALE_RESOURCE_REVISION",
        message: "Resource revision no longer matches the proposed action."
      })
    })
  }),
  fixture({
    name: "connector-google-docs-target-conflict-ambiguous-target",
    taskArea: "CTX-005 ACTION-004",
    flow: "ambiguous target conflict",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.VALIDATE_MUTATION_TARGET,
      status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.CONFLICT,
        code: "AMBIGUOUS_TARGET",
        message: "Target text matched more than one location."
      })
    })
  }),
  fixture({
    name: "connector-google-docs-quota-error",
    taskArea: "CTX-005 DOCS-002 OPS-004",
    flow: "Google API quota error",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.RATE_LIMITED,
        code: "GOOGLE_DOCS_RATE_LIMITED",
        message: "Google Docs API asked the service to retry later.",
        retryAfterSeconds: 60
      })
    })
  }),
  fixture({
    name: "connector-google-docs-oauth-reconnect-required",
    taskArea: "CTX-005 DOCS-002 AUTH-003",
    flow: "revoked Google OAuth token",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.AUTHENTICATION,
        code: STANDARD_ERROR_CODES.OAUTH_RECONNECT_REQUIRED,
        message: "Reconnect Google before reading this resource."
      })
    })
  }),
  fixture({
    name: "connector-google-docs-apply-mutation-success",
    taskArea: "CTX-005 ACTION-004 DOCS-004",
    flow: "Google Docs apply mutation success",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.APPLY_MUTATION,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: "rev_google_docs_after_apply",
      result: {
        actionId: "action_review_replace",
        operationId: "google_docs_apply_m1",
        resourceId: googleDocsResourceRef.resourceId,
        resourceRevision: "rev_google_docs_after_apply",
        status: PROPOSED_ACTION_STATUSES.APPLIED,
        appliedAt: GOOGLE_DOCS_FIXTURE_NOW
      }
    })
  }),
  fixture({
    name: "connector-google-docs-apply-mutation-conflict-no-mutation",
    taskArea: "CTX-005 ACTION-004 DOCS-004",
    flow: "Google Docs apply mutation conflict",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.APPLY_MUTATION,
      status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: "rev_google_docs_changed",
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.CONFLICT,
        code: "APPLY_TARGET_CONFLICTED",
        message: "Apply target changed before mutation."
      })
    })
  })
]);

const providerProposalOne = createProviderTextProposal({
  proposalId: "proposal_google_docs_one",
  actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
  currentText: "<fixture current text>",
  proposedText: "<fixture proposed text>",
  surroundingText: "<fixture surrounding context>",
  rationale: "Clarify the selected sentence.",
  targetHint: createProviderTextProposalTargetHint({
    originalTextHash: "sha256:google-docs-original",
    targetRange: replacementRange
  })
});

const providerProposalTwo = createProviderTextProposal({
  proposalId: "proposal_google_docs_two",
  actionType: PROPOSED_ACTION_TYPES.INSERT_TEXT,
  proposedText: "<fixture inserted text>",
  surroundingText: "<fixture second context>",
  rationale: "Add a transition.",
  targetHint: createProviderTextProposalTargetHint({
    targetRange: createActionTargetRange({ start: 80, end: 80 })
  })
});

const providerProposalOverlap = createProviderTextProposal({
  proposalId: "proposal_google_docs_overlap",
  actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
  currentText: "<fixture overlapping current>",
  proposedText: "<fixture overlapping replacement>",
  surroundingText: "<fixture overlap context>",
  rationale: "This intentionally overlaps another proposed edit.",
  targetHint: createProviderTextProposalTargetHint({
    originalTextHash: "sha256:google-docs-overlap",
    targetRange: createActionTargetRange({ start: 50, end: 70 })
  })
});

export const providerProposalBatch = createProviderTextProposalBatch({
  provider: MODEL_PROVIDERS.OPENAI,
  model: "model_google_docs_fixture",
  messageId: "msg_google_docs_provider",
  proposals: [providerProposalOne],
  usage: {
    inputTokens: 12,
    outputTokens: 18,
    totalTokens: 30
  }
});

export const providerFixtures = Object.freeze([
  fixture({
    name: "provider-credential-validation-success",
    taskArea: "PROVIDER-001 AUTH-005",
    flow: "provider credential validation success",
    validator: "validateProviderResponse",
    value: createProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.SUCCESS,
      model: "model_google_docs_fixture",
      messageId: "msg_google_docs_validation",
      finishReason: "validated",
      usage: {
        inputTokens: 1,
        outputTokens: 1,
        totalTokens: 2
      }
    })
  }),
  fixture({
    name: "provider-credential-validation-failure",
    taskArea: "PROVIDER-001 AUTH-005",
    flow: "provider credential validation failure",
    validator: "validateProviderResponse",
    value: createProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.TERMINAL_ERROR,
      model: "model_google_docs_fixture",
      error: createProviderError({
        category: PROVIDER_ERROR_CATEGORIES.AUTHENTICATION,
        code: "PROVIDER_AUTHENTICATION_FAILED",
        message: "Provider rejected the credential."
      })
    })
  }),
  fixture({
    name: "provider-text-proposal-batch-single-edit",
    taskArea: "PROVIDER-001",
    flow: "single proposed edit",
    validator: "validateProviderTextProposalBatch",
    value: providerProposalBatch
  }),
  fixture({
    name: "provider-text-proposal-batch-non-overlapping-edits",
    taskArea: "PROVIDER-001",
    flow: "multiple non-overlapping proposed edits",
    validator: "validateProviderTextProposalBatch",
    value: createProviderTextProposalBatch({
      provider: MODEL_PROVIDERS.OPENAI,
      model: "model_google_docs_fixture",
      messageId: "msg_google_docs_provider_multi",
      proposals: [providerProposalOne, providerProposalTwo],
      usage: {
        inputTokens: 18,
        outputTokens: 26,
        totalTokens: 44
      }
    })
  }),
  fixture({
    name: "provider-text-proposal-batch-overlapping-edits",
    taskArea: "PROVIDER-001",
    flow: "overlapping proposed edits",
    validator: "validateProviderTextProposalBatch",
    value: createProviderTextProposalBatch({
      provider: MODEL_PROVIDERS.OPENAI,
      model: "model_google_docs_fixture",
      messageId: "msg_google_docs_provider_overlap",
      proposals: [providerProposalOne, providerProposalOverlap],
      usage: {
        inputTokens: 18,
        outputTokens: 30,
        totalTokens: 48
      }
    })
  }),
  fixture({
    name: "provider-usage-metadata",
    taskArea: "PROVIDER-001 OPS-003",
    flow: "provider usage metadata",
    validator: "validateProviderResponse",
    value: createProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.SUCCESS,
      model: "model_google_docs_fixture",
      messageId: "msg_google_docs_usage",
      finishReason: "stop",
      usage: {
        inputTokens: 20,
        outputTokens: 15,
        totalTokens: 35
      }
    })
  }),
  fixture({
    name: "provider-rate-limit-error",
    taskArea: "PROVIDER-001 OPS-004",
    flow: "provider rate limit",
    validator: "validateProviderResponse",
    value: createProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.RETRYABLE_ERROR,
      model: "model_google_docs_fixture",
      error: createProviderError({
        category: PROVIDER_ERROR_CATEGORIES.RATE_LIMITED,
        code: "PROVIDER_RATE_LIMITED",
        message: "Provider asked the service to retry later.",
        retryAfterSeconds: 30
      })
    })
  })
]);

function actionReview(status, extra = {}) {
  return createProposedActionReviewRef({
    actionId: extra.actionId ?? `action_review_${status.toLowerCase()}`,
    actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
    status,
    resourceRef: googleDocsResourceRef,
    targetRange: replacementRange,
    originalTextHash: "sha256:google-docs-original",
    currentText: "<fixture current text>",
    proposedText: "<fixture proposed text>",
    surroundingText: "<fixture surrounding context>",
    rationale: "Clarify the selected sentence.",
    expiresAt: GOOGLE_DOCS_FIXTURE_EXPIRES_AT,
    ...extra
  });
}

export const proposedActionReviewRef = actionReview(PROPOSED_ACTION_STATUSES.PROPOSED, {
  actionId: "action_review_replace"
});

export const approveActionCommand = createHttpCommandRequest({
  contractVersion: GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION,
  commandId: "cmd_google_docs_approve_action",
  commandType: HTTP_COMMAND_TYPES.APPROVE_ACTION,
  identityScope: googleDocsIdentityScope,
  payload: createActionDecisionCommandPayload({
    sessionId: "session_google_docs_demo",
    actionId: proposedActionReviewRef.actionId,
    reasonCode: "USER_APPROVED"
  })
});

export const rejectActionCommand = createHttpCommandRequest({
  contractVersion: GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION,
  commandId: "cmd_google_docs_reject_action",
  commandType: HTTP_COMMAND_TYPES.REJECT_ACTION,
  identityScope: googleDocsIdentityScope,
  payload: createActionDecisionCommandPayload({
    sessionId: "session_google_docs_demo",
    actionId: proposedActionReviewRef.actionId,
    reasonCode: "USER_REJECTED"
  })
});

export const applyActionCommand = createHttpCommandRequest({
  contractVersion: GOOGLE_DOCS_FIXTURE_CONTRACT_VERSION,
  commandId: "cmd_google_docs_apply_action",
  commandType: HTTP_COMMAND_TYPES.APPLY_ACTION,
  identityScope: googleDocsIdentityScope,
  idempotencyKey: "idem_apply_action",
  payload: createApplyActionCommandPayload({
    sessionId: "session_google_docs_demo",
    actionId: proposedActionReviewRef.actionId
  })
});

export const proposedActionFixtures = Object.freeze([
  fixture({
    name: "action-review-proposed-diff-card",
    taskArea: "ACTION-001",
    flow: "proposed PR-style review card",
    validator: "validateProposedActionReviewRef",
    value: proposedActionReviewRef
  }),
  fixture({
    name: "action-review-approved-diff-card",
    taskArea: "ACTION-001 ACTION-003",
    flow: "approved PR-style review card",
    validator: "validateProposedActionReviewRef",
    value: actionReview(PROPOSED_ACTION_STATUSES.APPROVED)
  }),
  fixture({
    name: "action-review-rejected-diff-card",
    taskArea: "ACTION-001 ACTION-003",
    flow: "rejected PR-style review card",
    validator: "validateProposedActionReviewRef",
    value: actionReview(PROPOSED_ACTION_STATUSES.REJECTED)
  }),
  fixture({
    name: "action-review-applied-diff-card",
    taskArea: "ACTION-001 ACTION-004",
    flow: "applied PR-style review card",
    validator: "validateProposedActionReviewRef",
    value: actionReview(PROPOSED_ACTION_STATUSES.APPLIED)
  }),
  fixture({
    name: "action-review-conflicted-diff-card",
    taskArea: "ACTION-001 ACTION-004",
    flow: "conflicted PR-style review card",
    validator: "validateProposedActionReviewRef",
    value: actionReview(PROPOSED_ACTION_STATUSES.CONFLICTED, {
      conflictReasonCode: "STALE_RESOURCE_REVISION"
    })
  }),
  fixture({
    name: "action-command-approve-payload",
    taskArea: "ACTION-003 EVT-001",
    flow: "approve action command",
    validator: "validateHttpCommandRequest",
    value: approveActionCommand
  }),
  fixture({
    name: "action-command-reject-payload",
    taskArea: "ACTION-003 EVT-001",
    flow: "reject action command",
    validator: "validateHttpCommandRequest",
    value: rejectActionCommand
  }),
  fixture({
    name: "action-command-apply-idempotent",
    taskArea: "ACTION-004 EVT-001",
    flow: "apply action command",
    validator: "validateHttpCommandRequest",
    value: applyActionCommand
  })
]);

export const sessionEventFixtures = Object.freeze([
  fixture({
    name: "event-session-progress-provider-generating",
    taskArea: "EVT-002",
    flow: "assistant progress event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_google_docs_progress",
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      sessionId: "session_google_docs_demo",
      requestId: googleDocsIdentityScope.requestId,
      correlationId: googleDocsIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.PROGRESS,
      sequence: 1,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      payload: {
        stage: "provider.generating",
        status: "in_progress",
        messageCode: "PROVIDER_GENERATING"
      }
    })
  }),
  fixture({
    name: "event-session-assistant-final",
    taskArea: "EVT-002",
    flow: "assistant final event metadata",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_google_docs_final",
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      sessionId: "session_google_docs_demo",
      requestId: googleDocsIdentityScope.requestId,
      correlationId: googleDocsIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ASSISTANT_FINAL,
      sequence: 2,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      payload: {
        messageId: "msg_google_docs_provider",
        finishReason: "stop"
      }
    })
  }),
  fixture({
    name: "event-session-action-proposed",
    taskArea: "EVT-002 ACTION-001",
    flow: "action proposed event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_google_docs_action_proposed",
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      sessionId: "session_google_docs_demo",
      requestId: googleDocsIdentityScope.requestId,
      correlationId: googleDocsIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ACTION_PROPOSED,
      sequence: 3,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      payload: {
        actionId: proposedActionReviewRef.actionId,
        actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
        resourceRef: googleDocsResourceRef,
        summary: "Review one proposed edit.",
        expiresAt: GOOGLE_DOCS_FIXTURE_EXPIRES_AT
      }
    })
  }),
  fixture({
    name: "event-session-action-status-changed",
    taskArea: "EVT-002 ACTION-003",
    flow: "action status event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_google_docs_action_status",
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      sessionId: "session_google_docs_demo",
      requestId: googleDocsIdentityScope.requestId,
      correlationId: googleDocsIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ACTION_STATUS_CHANGED,
      sequence: 4,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      payload: {
        actionId: proposedActionReviewRef.actionId,
        previousStatus: PROPOSED_ACTION_STATUSES.PROPOSED,
        status: PROPOSED_ACTION_STATUSES.APPROVED,
        reasonCode: "USER_APPROVED"
      }
    })
  }),
  fixture({
    name: "event-session-typed-error",
    taskArea: "EVT-002 OPS-004",
    flow: "typed error event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_google_docs_error",
      tenantId: googleDocsIdentityScope.tenantId,
      userId: googleDocsIdentityScope.userId,
      sessionId: "session_google_docs_demo",
      requestId: googleDocsIdentityScope.requestId,
      correlationId: googleDocsIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ERROR,
      sequence: 5,
      createdAt: GOOGLE_DOCS_FIXTURE_NOW,
      payload: {
        errorCode: STANDARD_ERROR_CODES.CONNECTOR_OPERATION_FAILED,
        category: ERROR_CATEGORIES.DEPENDENCY,
        retryable: true,
        message: "Connector operation failed."
      }
    })
  })
]);

export const operationsErrorFixtures = Object.freeze([
  fixture({
    name: "ops-error-kms-decrypt-failure",
    taskArea: "OPS-004",
    flow: "KMS decrypt failure",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.KMS_OPERATION_FAILED,
      category: ERROR_CATEGORIES.KMS,
      message: "KMS decrypt operation failed.",
      retryable: true,
      httpStatus: 503,
      target: "kms"
    })
  }),
  fixture({
    name: "ops-error-dependency-unavailable",
    taskArea: "OPS-004",
    flow: "dependency unavailable",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.CONNECTOR_OPERATION_FAILED,
      category: ERROR_CATEGORIES.DEPENDENCY,
      message: "Required dependency is unavailable.",
      retryable: true,
      httpStatus: 503,
      target: "dependency"
    })
  }),
  fixture({
    name: "ops-error-rate-limited",
    taskArea: "OPS-004",
    flow: "rate limited",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.RATE_LIMITED,
      category: ERROR_CATEGORIES.RATE_LIMITED,
      message: "Request was rate limited.",
      retryable: true,
      httpStatus: 429,
      target: "rateLimit"
    })
  }),
  fixture({
    name: "ops-error-connector-timeout",
    taskArea: "OPS-004",
    flow: "connector timeout",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.TIMEOUT,
        code: "CONNECTOR_TIMEOUT",
        message: "Connector operation timed out.",
        dependencyStatus: "timeout"
      })
    })
  }),
  fixture({
    name: "ops-error-provider-unavailable",
    taskArea: "OPS-004",
    flow: "provider unavailable",
    validator: "validateProviderResponse",
    value: createProviderResponse({
      provider: MODEL_PROVIDERS.OPENAI,
      status: PROVIDER_RESPONSE_STATUSES.RETRYABLE_ERROR,
      model: "model_google_docs_fixture",
      error: createProviderError({
        category: PROVIDER_ERROR_CATEGORIES.UNAVAILABLE,
        code: "PROVIDER_UNAVAILABLE",
        message: "Provider is temporarily unavailable.",
        dependencyStatus: "unavailable"
      })
    })
  })
]);

export const GOOGLE_DOCS_VERTICAL_SLICE_FIXTURES = Object.freeze([
  verifiedAuthSubjectFixture,
  authenticatedCommandEnvelopeFixture,
  unsupportedVersionCommandFixture,
  unsupportedVersionErrorResponseFixture,
  ...productCredentialErrorFixtures,
  ...sessionSecretFixtures,
  activeConsentGrantFixture,
  ...consentErrorFixtures,
  ...normalizedContextFixtures,
  ...googleConnectorFixtures,
  ...providerFixtures,
  ...proposedActionFixtures,
  ...sessionEventFixtures,
  ...operationsErrorFixtures
]);
