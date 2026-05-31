$version: "2"

namespace ai.assist.secrets

use ai.assist.common#Timestamp
use ai.assist.providers#ModelProvider

enum SessionSecretStatus {
    @enumValue("pending_validation")
    PENDING_VALIDATION

    @enumValue("active")
    ACTIVE

    @enumValue("validation_failed")
    VALIDATION_FAILED

    @enumValue("expired")
    EXPIRED

    @enumValue("deleted")
    DELETED
}

@documentation("Metadata-only session secret status. Secret material is never modeled for clients or logs.")
structure SessionSecretStatusRef {
    @required
    tenantId: String

    @required
    userId: String

    @required
    provider: ModelProvider

    @required
    secretId: String

    @required
    fingerprint: String

    @required
    status: SessionSecretStatus

    @required
    createdAt: Timestamp

    lastValidatedAt: Timestamp

    @required
    expiresAt: Timestamp
}
