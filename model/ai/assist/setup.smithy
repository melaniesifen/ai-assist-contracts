$version: "2"

namespace ai.assist.setup

use ai.assist.common#ContractError
use ai.assist.common#Timestamp
use ai.assist.context#ResourceRef
use ai.assist.context#ScopeList
use ai.assist.providers#ModelProvider

enum ProductSessionStatus {
    @enumValue("anonymous")
    ANONYMOUS

    @enumValue("authenticated")
    AUTHENTICATED

    @enumValue("expired")
    EXPIRED
}

enum OAuthProvider {
    @enumValue("google")
    GOOGLE
}

enum GoogleOAuthConnectionStatus {
    @enumValue("not_connected")
    NOT_CONNECTED

    @enumValue("connected")
    CONNECTED

    @enumValue("reconnect_required")
    RECONNECT_REQUIRED
}

enum ProviderSecretReadinessStatus {
    @enumValue("missing")
    MISSING

    @enumValue("pending_validation")
    PENDING_VALIDATION

    @enumValue("valid")
    VALID

    @enumValue("invalid")
    INVALID

    @enumValue("expired")
    EXPIRED

    @enumValue("validation_failed")
    VALIDATION_FAILED
}

enum ResourceSessionReadinessStatus {
    @enumValue("not_started")
    NOT_STARTED

    @enumValue("ready")
    READY

    @enumValue("not_ready")
    NOT_READY
}

enum SetupErrorKind {
    @enumValue("product_session_required")
    PRODUCT_SESSION_REQUIRED

    @enumValue("product_session_expired")
    PRODUCT_SESSION_EXPIRED

    @enumValue("google_oauth_reconnect_required")
    GOOGLE_OAUTH_RECONNECT_REQUIRED

    @enumValue("provider_secret_required")
    PROVIDER_SECRET_REQUIRED

    @enumValue("provider_secret_invalid")
    PROVIDER_SECRET_INVALID

    @enumValue("provider_secret_expired")
    PROVIDER_SECRET_EXPIRED

    @enumValue("resource_session_not_ready")
    RESOURCE_SESSION_NOT_READY

    @enumValue("dependency_unavailable")
    DEPENDENCY_UNAVAILABLE
}

@documentation("Metadata-only product session status for first-run setup UI.")
structure ProductSessionStatusRef {
    @required
    status: ProductSessionStatus

    tenantId: String
    userId: String
    authSubject: String
    sessionId: String
    expiresAt: Timestamp
    error: ContractError
}

@documentation("Metadata-only Google OAuth connection status. OAuth tokens and authorization codes are never modeled.")
structure GoogleOAuthConnectionStatusRef {
    @required
    provider: OAuthProvider

    @required
    status: GoogleOAuthConnectionStatus

    googleAccountId: String
    scopes: ScopeList
    connectedAt: Timestamp
    expiresAt: Timestamp
    error: ContractError
}

@documentation("Metadata-only provider secret readiness. Raw keys and ciphertext are never returned to clients.")
structure ProviderSecretReadinessRef {
    @required
    provider: ModelProvider

    @required
    status: ProviderSecretReadinessStatus

    secretId: String
    fingerprint: String
    lastValidatedAt: Timestamp
    expiresAt: Timestamp
    error: ContractError
}

@documentation("Resource-session readiness for first-run setup. Raw document content is never modeled.")
structure ResourceSessionReadinessRef {
    @required
    status: ResourceSessionReadinessStatus

    sessionId: String
    resourceRef: ResourceRef
    resourceRevision: String
    createdAt: Timestamp
    error: ContractError
}

structure SetupErrorRef {
    @required
    kind: SetupErrorKind

    @required
    error: ContractError
}

list ProviderSecretReadinessList {
    member: ProviderSecretReadinessRef
}

list SetupErrorList {
    member: SetupErrorRef
}

@documentation("Backend-shaped first-run setup status composed for UI display.")
structure FirstRunSetupStatus {
    @required
    productSession: ProductSessionStatusRef

    @required
    googleOAuth: GoogleOAuthConnectionStatusRef

    @required
    providerSecrets: ProviderSecretReadinessList

    resourceSession: ResourceSessionReadinessRef

    @required
    errors: SetupErrorList

    @required
    updatedAt: Timestamp
}
