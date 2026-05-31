$version: "2"

namespace ai.assist.logging

use ai.assist.common#ErrorCategory
use ai.assist.common#NonNegativeInteger
use ai.assist.providers#ModelProvider

enum LogStatus {
    @enumValue("started")
    STARTED

    @enumValue("succeeded")
    SUCCEEDED

    @enumValue("failed")
    FAILED
}

@documentation("Metadata-only log event. Raw prompts, document text, model responses, credentials, and action payloads are excluded by policy.")
structure MetadataLogEvent {
    @required
    requestId: String

    @required
    correlationId: String

    @required
    tenantId: String

    @required
    userId: String

    @required
    service: String

    @required
    route: String

    @required
    operation: String

    @required
    status: LogStatus

    errorCategory: ErrorCategory
    latencyMs: NonNegativeInteger
    provider: ModelProvider
    inputTokens: NonNegativeInteger
    outputTokens: NonNegativeInteger
    totalTokens: NonNegativeInteger
    costEstimateMicroUsd: NonNegativeInteger
}
