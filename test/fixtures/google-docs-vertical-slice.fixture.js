import {
  CONNECTORS,
  CONTEXT_MODES,
  CONTEXT_SOURCE_TYPES,
  CONTEXT_TRUST_LEVELS,
  MODEL_PROVIDERS,
  PROPOSED_ACTION_STATUSES,
  PROPOSED_ACTION_TYPES,
  createActionTargetRange,
  createApplyActionCommandPayload,
  createConnectorReadContextResult,
  createConnectorResourceListResult,
  createContractVersionRef,
  createHttpCommandRequest,
  createIdentityScope,
  createNormalizedContext,
  createProviderTextProposal,
  createProviderTextProposalBatch,
  createProviderTextProposalTargetHint,
  createProposedActionReviewRef,
  createProvenance,
  createResourceRef
} from "../../src/index.js";

export const FIXTURE_NOW = "2026-05-31T22:00:00.000Z";
export const FIXTURE_EXPIRES_AT = "2026-06-01T22:00:00.000Z";

export const googleDocsIdentityScope = createIdentityScope({
  tenantId: "tenant_fixture",
  userId: "user_fixture",
  authSubject: "auth_subject_fixture",
  requestId: "req_fixture",
  correlationId: "corr_fixture"
});

export const googleDocsResourceRef = createResourceRef({
  connector: CONNECTORS.GOOGLE_DOCS,
  resourceId: "gdoc_fixture",
  resourceType: "document",
  displayName: "Fixture document",
  externalUrl: "https://docs.google.com/document/d/gdoc_fixture/edit"
});

export const googleDocsResourceListResult = createConnectorResourceListResult({
  resources: [googleDocsResourceRef],
  nextPageToken: "next_page_fixture"
});

export const googleDocsContext = createNormalizedContext({
  contextId: "ctx_fixture",
  tenantId: googleDocsIdentityScope.tenantId,
  userId: googleDocsIdentityScope.userId,
  sessionId: "session_fixture",
  provider: CONNECTORS.GOOGLE_DOCS,
  resourceRef: googleDocsResourceRef,
  contextMode: CONTEXT_MODES.SELECTION,
  sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_SELECTION,
  trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
  content: "<document excerpt visible to the active reviewer>",
  contentHash: "sha256:context_fixture",
  anchors: [createActionTargetRange({ start: 10, end: 32 })],
  resourceRevision: "rev_fixture",
  metadata: {
    truncated: false,
    contentLength: 49
  },
  provenance: createProvenance({
    sourceType: CONTEXT_SOURCE_TYPES.CONNECTOR_SELECTION,
    trustLevel: CONTEXT_TRUST_LEVELS.CONNECTOR_VERIFIED,
    connector: CONNECTORS.GOOGLE_DOCS,
    resourceId: googleDocsResourceRef.resourceId,
    resourceVersion: "rev_fixture",
    selectionAnchor: createActionTargetRange({ start: 10, end: 32 }),
    capturedAt: FIXTURE_NOW,
    clientSupplied: false,
    connectorVerified: true
  }),
  capturedAt: FIXTURE_NOW,
  expiresAt: FIXTURE_EXPIRES_AT
});

export const googleDocsReadContextResult = createConnectorReadContextResult({
  context: googleDocsContext,
  resourceRevision: "rev_fixture"
});

export const providerProposalBatch = createProviderTextProposalBatch({
  provider: MODEL_PROVIDERS.OPENAI,
  model: "model_fixture",
  messageId: "msg_fixture",
  proposals: [
    createProviderTextProposal({
      proposalId: "proposal_fixture",
      actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
      currentText: "<current review text>",
      proposedText: "<proposed review text>",
      surroundingText: "<surrounding review context>",
      rationale: "Clarify the sentence.",
      targetHint: createProviderTextProposalTargetHint({
        originalTextHash: "sha256:original_fixture"
      })
    })
  ],
  usage: {
    inputTokens: 10,
    outputTokens: 20,
    totalTokens: 30
  }
});

export const proposedActionReviewRef = createProposedActionReviewRef({
  actionId: "action_fixture",
  actionType: PROPOSED_ACTION_TYPES.REPLACE_TEXT,
  status: PROPOSED_ACTION_STATUSES.PROPOSED,
  resourceRef: googleDocsResourceRef,
  targetRange: createActionTargetRange({ start: 10, end: 32 }),
  originalTextHash: "sha256:original_fixture",
  currentText: "<current review text>",
  proposedText: "<proposed review text>",
  surroundingText: "<surrounding review context>",
  rationale: "Clarify the sentence.",
  expiresAt: FIXTURE_EXPIRES_AT
});

export const applyActionCommand = createHttpCommandRequest({
  contractVersion: createContractVersionRef(),
  commandId: "cmd_apply_fixture",
  commandType: "actions.apply",
  identityScope: googleDocsIdentityScope,
  idempotencyKey: "idem_fixture",
  payload: createApplyActionCommandPayload({
    sessionId: "session_fixture",
    actionId: proposedActionReviewRef.actionId
  })
});
