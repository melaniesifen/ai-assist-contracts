$version: "2"

namespace ai.assist.events

use ai.assist.actions#ProposedActionStatus
use ai.assist.actions#ProposedActionType
use ai.assist.common#ErrorCategory
use ai.assist.common#NonNegativeInteger
use ai.assist.common#Timestamp
use ai.assist.context#ResourceRef
use ai.assist.providers#ProviderUsage

enum SessionEventType {
    @enumValue("assistant.delta")
    ASSISTANT_DELTA

    @enumValue("assistant.final")
    ASSISTANT_FINAL

    @enumValue("progress")
    PROGRESS

    @enumValue("error")
    ERROR

    @enumValue("action.proposed")
    ACTION_PROPOSED

    @enumValue("action.status_changed")
    ACTION_STATUS_CHANGED
}

enum ProgressStatus {
    @enumValue("started")
    STARTED

    @enumValue("in_progress")
    IN_PROGRESS

    @enumValue("completed")
    COMPLETED

    @enumValue("skipped")
    SKIPPED
}

structure AssistantDeltaPayload {
    @required
    messageId: String

    @required
    delta: String

    @required
    index: NonNegativeInteger
}

structure AssistantFinalPayload {
    @required
    messageId: String

    @required
    finishReason: String

    usage: ProviderUsage
}

structure ProgressPayload {
    @required
    stage: String

    @required
    status: ProgressStatus

    @required
    messageCode: String
}

structure ErrorPayload {
    @required
    errorCode: String

    @required
    category: ErrorCategory

    @required
    retryable: Boolean

    @required
    message: String
}

structure ActionProposedPayload {
    @required
    actionId: String

    @required
    actionType: ProposedActionType

    @required
    resourceRef: ResourceRef

    @required
    summary: String

    @required
    expiresAt: Timestamp
}

structure ActionStatusChangedPayload {
    @required
    actionId: String

    @required
    previousStatus: ProposedActionStatus

    @required
    status: ProposedActionStatus

    @required
    reasonCode: String
}

@documentation("Typed event payload variants. The current JavaScript compatibility layer keeps the flat payload object and dispatches by SessionEvent.type; generated artifacts must preserve that discriminator mapping.")
union SessionEventPayload {
    assistantDelta: AssistantDeltaPayload
    assistantFinal: AssistantFinalPayload
    progress: ProgressPayload
    error: ErrorPayload
    actionProposed: ActionProposedPayload
    actionStatusChanged: ActionStatusChangedPayload
}

@documentation("Transport-neutral session event envelope for SSE MVP and future transports.")
structure SessionEvent {
    @required
    eventId: String

    @required
    tenantId: String

    @required
    userId: String

    @required
    sessionId: String

    @required
    requestId: String

    @required
    correlationId: String

    @required
    type: SessionEventType

    sequence: NonNegativeInteger

    @required
    createdAt: Timestamp

    @required
    payload: SessionEventPayload
}
