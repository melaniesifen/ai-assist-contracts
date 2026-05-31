$version: "2"

namespace ai.assist.connectors

use ai.assist.common#NonNegativeInteger

enum Connector {
    @enumValue("google_docs")
    GOOGLE_DOCS
}

enum ConnectorOperation {
    @enumValue("ListResources")
    LIST_RESOURCES

    @enumValue("GetResourceMetadata")
    GET_RESOURCE_METADATA

    @enumValue("ReadContext")
    READ_CONTEXT

    @enumValue("ResolveSelection")
    RESOLVE_SELECTION

    @enumValue("ValidateResourceRevision")
    VALIDATE_RESOURCE_REVISION

    @enumValue("ValidateMutationTarget")
    VALIDATE_MUTATION_TARGET

    @enumValue("ApplyMutation")
    APPLY_MUTATION
}

enum ConnectorResponseStatus {
    @enumValue("success")
    SUCCESS

    @enumValue("retryable_error")
    RETRYABLE_ERROR

    @enumValue("terminal_error")
    TERMINAL_ERROR
}

enum ConnectorErrorCategory {
    @enumValue("authentication")
    AUTHENTICATION

    @enumValue("authorization")
    AUTHORIZATION

    @enumValue("consent_required")
    CONSENT_REQUIRED

    @enumValue("not_found")
    NOT_FOUND

    @enumValue("conflict")
    CONFLICT

    @enumValue("rate_limited")
    RATE_LIMITED

    @enumValue("timeout")
    TIMEOUT

    @enumValue("unavailable")
    UNAVAILABLE

    @enumValue("unsupported_operation")
    UNSUPPORTED_OPERATION

    @enumValue("dependency")
    DEPENDENCY

    @enumValue("internal")
    INTERNAL
}

structure ConnectorError {
    @required
    category: ConnectorErrorCategory

    @required
    code: String

    @required
    message: String

    retryAfterSeconds: NonNegativeInteger
    dependencyStatus: String
}

structure ConnectorResponse {
    @required
    connector: Connector

    @required
    operation: ConnectorOperation

    @required
    status: ConnectorResponseStatus

    @required
    requestId: String

    resourceRevision: String
    result: Document
    error: ConnectorError
}
