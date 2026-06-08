import {
  CONNECTORS,
  ERROR_CATEGORIES,
  GOOGLE_OAUTH_CONNECTION_STATUSES,
  MODEL_PROVIDERS,
  OAUTH_PROVIDERS,
  PRODUCT_SESSION_STATUSES,
  PROVIDER_SECRET_READINESS_STATUSES,
  RESOURCE_SESSION_READINESS_STATUSES,
  SETUP_ERROR_KINDS,
  STANDARD_ERROR_CODES,
  createContractError,
  createContractVersionRef,
  createFirstRunSetupStatus,
  createGoogleOAuthConnectionStatusRef,
  createProductCredentialError,
  createProductSessionStatusRef,
  createProviderSecretReadinessRef,
  createResourceRef,
  createResourceSessionReadinessRef,
  createSetupErrorRef
} from "../src/index.js";

export const SETUP_FIXTURE_NOW = "2026-06-06T18:00:00.000Z";
export const SETUP_FIXTURE_SESSION_EXPIRES_AT = "2026-06-06T20:00:00.000Z";
export const SETUP_FIXTURE_SECRET_EXPIRES_AT = "2026-06-07T02:00:00.000Z";
export const SETUP_FIXTURE_CONTRACT_VERSION = createContractVersionRef();

function fixture({ name, taskArea, flow, validator, value }) {
  return Object.freeze({
    name,
    taskArea,
    flow,
    contractVersion: SETUP_FIXTURE_CONTRACT_VERSION,
    validator,
    value
  });
}

export const setupGoogleDocsResourceRef = createResourceRef({
  connector: CONNECTORS.GOOGLE_DOCS,
  resourceId: "gdoc_setup_demo",
  resourceType: "document",
  displayName: "Setup fixture document"
});

export const authenticatedProductSessionFixture = fixture({
  name: "setup-product-session-authenticated",
  taskArea: "AUTH-002",
  flow: "first-run product session status",
  validator: "validateProductSessionStatusRef",
  value: createProductSessionStatusRef({
    status: PRODUCT_SESSION_STATUSES.AUTHENTICATED,
    tenantId: "tenant_setup_demo",
    userId: "user_setup_demo",
    authSubject: "auth_subject_setup_demo",
    sessionId: "session_setup_demo",
    expiresAt: SETUP_FIXTURE_SESSION_EXPIRES_AT
  })
});

export const googleOAuthConnectedFixture = fixture({
  name: "setup-google-oauth-connected",
  taskArea: "AUTH-003",
  flow: "Google OAuth connection status",
  validator: "validateGoogleOAuthConnectionStatusRef",
  value: createGoogleOAuthConnectionStatusRef({
    provider: OAUTH_PROVIDERS.GOOGLE,
    status: GOOGLE_OAUTH_CONNECTION_STATUSES.CONNECTED,
    googleAccountId: "google_account_setup_demo",
    scopes: Object.freeze(["https://www.googleapis.com/auth/documents"]),
    connectedAt: SETUP_FIXTURE_NOW,
    expiresAt: SETUP_FIXTURE_SESSION_EXPIRES_AT
  })
});

export const googleOAuthReconnectRequiredFixture = fixture({
  name: "setup-google-oauth-reconnect-required",
  taskArea: "AUTH-003",
  flow: "Google OAuth reconnect required status",
  validator: "validateGoogleOAuthConnectionStatusRef",
  value: createGoogleOAuthConnectionStatusRef({
    provider: OAUTH_PROVIDERS.GOOGLE,
    status: GOOGLE_OAUTH_CONNECTION_STATUSES.RECONNECT_REQUIRED,
    googleAccountId: "google_account_setup_demo",
    error: createContractError({
      code: STANDARD_ERROR_CODES.OAUTH_RECONNECT_REQUIRED,
      category: ERROR_CATEGORIES.OAUTH,
      message: "Google connection must be refreshed.",
      retryable: false,
      httpStatus: 401,
      target: "googleOAuth"
    })
  })
});

export const providerSecretValidFixture = fixture({
  name: "setup-provider-secret-valid-openai",
  taskArea: "AUTH-004 AUTH-005",
  flow: "provider secret readiness status",
  validator: "validateProviderSecretReadinessRef",
  value: createProviderSecretReadinessRef({
    provider: MODEL_PROVIDERS.OPENAI,
    status: PROVIDER_SECRET_READINESS_STATUSES.VALID,
    secretId: "secret_setup_openai",
    fingerprint: "fp_setup_openai",
    lastValidatedAt: SETUP_FIXTURE_NOW,
    expiresAt: SETUP_FIXTURE_SECRET_EXPIRES_AT
  })
});

export const providerSecretInvalidFixture = fixture({
  name: "setup-provider-secret-invalid-anthropic",
  taskArea: "AUTH-005",
  flow: "invalid provider secret readiness status",
  validator: "validateProviderSecretReadinessRef",
  value: createProviderSecretReadinessRef({
    provider: MODEL_PROVIDERS.ANTHROPIC,
    status: PROVIDER_SECRET_READINESS_STATUSES.INVALID,
    lastValidatedAt: SETUP_FIXTURE_NOW,
    error: createContractError({
      code: "PROVIDER_SECRET_INVALID",
      category: ERROR_CATEGORIES.AUTHENTICATION,
      message: "Provider key validation failed.",
      retryable: false,
      httpStatus: 400,
      target: "providerSecret"
    })
  })
});

export const resourceSessionReadyFixture = fixture({
  name: "setup-resource-session-ready-google-docs",
  taskArea: "CTX-005",
  flow: "resource-session readiness status",
  validator: "validateResourceSessionReadinessRef",
  value: createResourceSessionReadinessRef({
    status: RESOURCE_SESSION_READINESS_STATUSES.READY,
    sessionId: "resource_session_setup_demo",
    resourceRef: setupGoogleDocsResourceRef,
    resourceRevision: "rev_setup_demo",
    createdAt: SETUP_FIXTURE_NOW
  })
});

export const setupErrorFixtures = Object.freeze([
  fixture({
    name: "setup-error-product-session-required",
    taskArea: "AUTH-002",
    flow: "safe setup error",
    validator: "validateSetupErrorRef",
    value: createSetupErrorRef({
      kind: SETUP_ERROR_KINDS.PRODUCT_SESSION_REQUIRED,
      error: createProductCredentialError({
        kind: "UNAUTHORIZED",
        message: "Product session is required."
      })
    })
  }),
  fixture({
    name: "setup-error-product-session-expired",
    taskArea: "AUTH-002",
    flow: "safe setup error",
    validator: "validateSetupErrorRef",
    value: createSetupErrorRef({
      kind: SETUP_ERROR_KINDS.PRODUCT_SESSION_EXPIRED,
      error: createProductCredentialError({
        kind: "EXPIRED",
        message: "Product session expired."
      })
    })
  }),
  fixture({
    name: "setup-error-provider-secret-expired",
    taskArea: "AUTH-004",
    flow: "safe setup error",
    validator: "validateSetupErrorRef",
    value: createSetupErrorRef({
      kind: SETUP_ERROR_KINDS.PROVIDER_SECRET_EXPIRED,
      error: createContractError({
        code: STANDARD_ERROR_CODES.PROVIDER_SECRET_EXPIRED,
        category: ERROR_CATEGORIES.AUTHENTICATION,
        message: "Provider session secret expired.",
        retryable: false,
        httpStatus: 401,
        target: "providerSecret"
      })
    })
  })
]);

export const firstRunSetupReadyFixture = fixture({
  name: "setup-first-run-ready",
  taskArea: "SETUP",
  flow: "first-run setup status",
  validator: "validateFirstRunSetupStatus",
  value: createFirstRunSetupStatus({
    productSession: authenticatedProductSessionFixture.value,
    googleOAuth: googleOAuthConnectedFixture.value,
    providerSecrets: Object.freeze([providerSecretValidFixture.value]),
    resourceSession: resourceSessionReadyFixture.value,
    errors: Object.freeze([]),
    updatedAt: SETUP_FIXTURE_NOW
  })
});

export const firstRunSetupNeedsUserActionFixture = fixture({
  name: "setup-first-run-needs-user-action",
  taskArea: "SETUP",
  flow: "first-run setup status",
  validator: "validateFirstRunSetupStatus",
  value: createFirstRunSetupStatus({
    productSession: createProductSessionStatusRef({
      status: PRODUCT_SESSION_STATUSES.EXPIRED,
      error: createProductCredentialError({
        kind: "EXPIRED",
        message: "Product session expired."
      })
    }),
    googleOAuth: googleOAuthReconnectRequiredFixture.value,
    providerSecrets: Object.freeze([providerSecretInvalidFixture.value]),
    resourceSession: createResourceSessionReadinessRef({
      status: RESOURCE_SESSION_READINESS_STATUSES.NOT_READY,
      error: createContractError({
        code: "RESOURCE_SESSION_NOT_READY",
        category: ERROR_CATEGORIES.VALIDATION,
        message: "Choose a Google Docs resource before starting.",
        retryable: false,
        httpStatus: 400,
        target: "resourceSession"
      })
    }),
    errors: Object.freeze([
      setupErrorFixtures[1].value,
      setupErrorFixtures[2].value
    ]),
    updatedAt: SETUP_FIXTURE_NOW
  })
});

export const FIRST_RUN_SETUP_FIXTURES = Object.freeze([
  authenticatedProductSessionFixture,
  googleOAuthConnectedFixture,
  googleOAuthReconnectRequiredFixture,
  providerSecretValidFixture,
  providerSecretInvalidFixture,
  resourceSessionReadyFixture,
  ...setupErrorFixtures,
  firstRunSetupReadyFixture,
  firstRunSetupNeedsUserActionFixture
]);
