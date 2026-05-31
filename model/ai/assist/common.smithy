$version: "2"

namespace ai.assist.common

@documentation("Semantic version attached to cross-service contracts.")
structure ContractVersionRef {
    @required
    major: NonNegativeInteger

    @required
    minor: NonNegativeInteger

    @required
    patch: NonNegativeInteger
}

@documentation("Server-derived identity and tracing scope. Callers must not trust client-supplied identity fields.")
structure IdentityScope {
    @required
    tenantId: String

    @required
    userId: String

    @required
    authSubject: String

    @required
    requestId: String

    @required
    correlationId: String
}

@documentation("Stable error categories shared across service boundaries.")
enum ErrorCategory {
    AUTHENTICATION
    AUTHORIZATION
    RATE_LIMITED
    VALIDATION
    CONSENT_REQUIRED
    CONFLICT
    DEPENDENCY
    PROVIDER_QUOTA
    KMS
    OAUTH
    CONNECTOR
    POLICY
    INTERNAL
}

@documentation("Stable error code values shared across service boundaries.")
enum StandardErrorCode {
    AUTHENTICATION_REQUIRED
    AUTHENTICATION_EXPIRED
    MALFORMED_PRODUCT_CREDENTIAL
    AUTHORIZATION_DENIED
    CONTRACT_VALIDATION_FAILED
    UNSUPPORTED_CONTRACT_VERSION
    UNSUPPORTED_CONTEXT_MODE
    CONSENT_REQUIRED
    RESOURCE_CONFLICT
    RATE_LIMITED
    PROVIDER_SECRET_EXPIRED
    PROVIDER_QUOTA_EXCEEDED
    OAUTH_RECONNECT_REQUIRED
    CONNECTOR_OPERATION_FAILED
    KMS_OPERATION_FAILED
    INTERNAL_ERROR
}

@documentation("Safe error envelope. Details must remain metadata-only and must not contain secrets or raw user content.")
structure ContractError {
    @required
    code: String

    @required
    category: ErrorCategory

    @required
    message: String

    @required
    retryable: Boolean

    httpStatus: NonNegativeInteger
    target: String
    details: Document
}

@range(min: 0)
integer NonNegativeInteger

@timestampFormat("date-time")
timestamp Timestamp
