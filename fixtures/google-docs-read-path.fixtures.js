import {
  CONNECTOR_ERROR_CATEGORIES,
  CONNECTOR_OPERATIONS,
  CONNECTOR_RESPONSE_STATUSES,
  CONNECTORS,
  CONTEXT_MODES,
  ERROR_CATEGORIES,
  HTTP_COMMAND_TYPES,
  STANDARD_ERROR_CODES,
  createConnectorError,
  createConnectorReadContextResult,
  createConnectorResponse,
  createConnectorResourceListResult,
  createContextConsentGrantRef,
  createContractError,
  createContractVersionRef,
  createHttpCommandRequest
} from "../src/index.js";
import {
  activeConsentGrantFixture,
  activeResourceContext,
  authenticatedCommandEnvelopeFixture,
  consentErrorFixtures,
  googleDocsIdentityScope,
  googleDocsResourceRef,
  normalizedContextFixtures,
  truncatedContext
} from "./m1-google-docs-vertical-slice.fixtures.js";
import {
  googleOAuthReconnectRequiredFixture
} from "./m3-first-run-setup.fixtures.js";

export const GOOGLE_DOCS_READ_PATH_FIXTURE_CONTRACT_VERSION = createContractVersionRef();

function fixture({ name, taskArea, flow, validator, value }) {
  return Object.freeze({
    name,
    taskArea,
    flow,
    contractVersion: GOOGLE_DOCS_READ_PATH_FIXTURE_CONTRACT_VERSION,
    validator,
    value
  });
}

export const unsupportedFutureContextModeCommandFixture = fixture({
  name: "context-command-unsupported-visible-region-mode",
  taskArea: "CTX-001 CTX-006",
  flow: "unsupported future context mode request",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: GOOGLE_DOCS_READ_PATH_FIXTURE_CONTRACT_VERSION,
    commandId: "cmd_read_path_unsupported_visible_region",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    identityScope: googleDocsIdentityScope,
    payload: {
      sessionId: "session_read_path",
      resourceId: googleDocsResourceRef.resourceId,
      contextMode: CONTEXT_MODES.VISIBLE_REGION
    }
  })
});

export const unsupportedFutureContextModeErrorFixture = fixture({
  name: "context-error-unsupported-visible-region-mode",
  taskArea: "CTX-001 CTX-006",
  flow: "unsupported future context mode error",
  validator: "validateContractError",
  value: createContractError({
    code: STANDARD_ERROR_CODES.UNSUPPORTED_CONTEXT_MODE,
    category: ERROR_CATEGORIES.VALIDATION,
    message: "VISIBLE_REGION is not supported for the MVP read path.",
    retryable: false,
    httpStatus: 400,
    target: "contextMode"
  })
});

export const wrongUserConsentGrantFixture = fixture({
  name: "context-consent-grant-active-wrong-user",
  taskArea: "CTX-002",
  flow: "wrong-user consent grant",
  validator: "validateContextConsentGrantRef",
  value: createContextConsentGrantRef({
    ...activeConsentGrantFixture.value,
    grantId: "grant_read_path_wrong_user",
    userId: "user_read_path_other"
  })
});

export const wrongResourceConsentGrantFixture = fixture({
  name: "context-consent-grant-active-wrong-resource",
  taskArea: "CTX-002",
  flow: "wrong-resource consent grant",
  validator: "validateContextConsentGrantRef",
  value: createContextConsentGrantRef({
    ...activeConsentGrantFixture.value,
    grantId: "grant_read_path_wrong_resource",
    resourceRef: {
      ...googleDocsResourceRef,
      resourceId: "gdoc_read_path_other"
    }
  })
});

export const scopedConsentErrorFixtures = Object.freeze([
  fixture({
    name: "context-error-consent-wrong-user",
    taskArea: "CTX-002 CTX-006",
    flow: "wrong-user consent failure",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.CONSENT_REQUIRED,
      category: ERROR_CATEGORIES.CONSENT_REQUIRED,
      message: "Consent grant does not belong to the authenticated user.",
      retryable: false,
      httpStatus: 403,
      target: "contextConsentGrant.userId"
    })
  }),
  fixture({
    name: "context-error-consent-wrong-resource",
    taskArea: "CTX-002 CTX-006",
    flow: "wrong-resource consent failure",
    validator: "validateContractError",
    value: createContractError({
      code: STANDARD_ERROR_CODES.CONSENT_REQUIRED,
      category: ERROR_CATEGORIES.CONSENT_REQUIRED,
      message: "Consent grant does not cover the requested resource.",
      retryable: false,
      httpStatus: 403,
      target: "contextConsentGrant.resourceRef"
    })
  })
]);

export const googleDocsActiveResourceReadContextResult = createConnectorReadContextResult({
  context: activeResourceContext,
  resourceRevision: activeResourceContext.resourceRevision
});

export const googleDocsTruncatedReadContextResult = createConnectorReadContextResult({
  context: truncatedContext,
  resourceRevision: truncatedContext.resourceRevision
});

export const googleDocsReadPathResourceListResult = createConnectorResourceListResult({
  resources: [
    googleDocsResourceRef,
    {
      ...googleDocsResourceRef,
      resourceId: "gdoc_read_path_second",
      displayName: "Read-path second fixture document"
    }
  ],
  nextPageToken: "page_read_path_next"
});

export const googleDocsReadPathConnectorFixtures = Object.freeze([
  fixture({
    name: "connector-google-docs-list-success-multiple-metadata-only",
    taskArea: "DOCS-001",
    flow: "Google Docs resource discovery success",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.LIST_RESOURCES,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      result: googleDocsReadPathResourceListResult
    })
  }),
  fixture({
    name: "connector-google-docs-list-rate-limited",
    taskArea: "DOCS-001 OPS-003",
    flow: "Google Docs resource discovery rate limit",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.LIST_RESOURCES,
      status: CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.RATE_LIMITED,
        code: "GOOGLE_DOCS_LIST_RATE_LIMITED",
        message: "Google resource discovery asked the service to retry later.",
        retryAfterSeconds: 45
      })
    })
  }),
  fixture({
    name: "connector-google-docs-read-selection-success",
    taskArea: "DOCS-002 CTX-003",
    flow: "Google Docs selection read context",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: normalizedContextFixtures[0].value.resourceRevision,
      result: createConnectorReadContextResult({
        context: normalizedContextFixtures[0].value,
        resourceRevision: normalizedContextFixtures[0].value.resourceRevision
      })
    })
  }),
  fixture({
    name: "connector-google-docs-read-active-resource-success",
    taskArea: "DOCS-002 CTX-003",
    flow: "Google Docs active-resource read context",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: activeResourceContext.resourceRevision,
      result: googleDocsActiveResourceReadContextResult
    })
  }),
  fixture({
    name: "connector-google-docs-read-active-resource-truncated",
    taskArea: "DOCS-002 CTX-003",
    flow: "Google Docs truncated active-resource read context",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.SUCCESS,
      requestId: googleDocsIdentityScope.requestId,
      resourceRevision: truncatedContext.resourceRevision,
      result: googleDocsTruncatedReadContextResult
    })
  }),
  fixture({
    name: "connector-google-docs-read-permission-denied",
    taskArea: "DOCS-002",
    flow: "Google Docs read permission failure",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.TERMINAL_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.AUTHORIZATION,
        code: "GOOGLE_DOCS_READ_PERMISSION_DENIED",
        message: "User is not authorized to read this resource."
      })
    })
  }),
  fixture({
    name: "connector-google-docs-read-timeout",
    taskArea: "DOCS-002 CTX-006",
    flow: "Google Docs read timeout",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.TIMEOUT,
        code: "GOOGLE_DOCS_READ_TIMEOUT",
        message: "Google Docs read timed out."
      })
    })
  }),
  fixture({
    name: "connector-google-docs-read-unavailable",
    taskArea: "DOCS-002 CTX-006",
    flow: "Google Docs connector dependency failure",
    validator: "validateConnectorResponse",
    value: createConnectorResponse({
      connector: CONNECTORS.GOOGLE_DOCS,
      operation: CONNECTOR_OPERATIONS.READ_CONTEXT,
      status: CONNECTOR_RESPONSE_STATUSES.RETRYABLE_ERROR,
      requestId: googleDocsIdentityScope.requestId,
      error: createConnectorError({
        category: CONNECTOR_ERROR_CATEGORIES.UNAVAILABLE,
        code: "GOOGLE_DOCS_READ_UNAVAILABLE",
        message: "Google Docs read dependency is unavailable.",
        dependencyStatus: "503"
      })
    })
  })
]);

export const GOOGLE_DOCS_READ_PATH_FIXTURES = Object.freeze([
  authenticatedCommandEnvelopeFixture,
  activeConsentGrantFixture,
  ...consentErrorFixtures,
  wrongUserConsentGrantFixture,
  wrongResourceConsentGrantFixture,
  ...scopedConsentErrorFixtures,
  unsupportedFutureContextModeCommandFixture,
  unsupportedFutureContextModeErrorFixture,
  ...normalizedContextFixtures,
  googleOAuthReconnectRequiredFixture,
  ...googleDocsReadPathConnectorFixtures
]);

export const M4_GOOGLE_DOCS_READ_PATH_FIXTURES = GOOGLE_DOCS_READ_PATH_FIXTURES;
