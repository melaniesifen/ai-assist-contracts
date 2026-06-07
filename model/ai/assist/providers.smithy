$version: "2"

namespace ai.assist.providers

use ai.assist.actions#ActionTargetAnchor
use ai.assist.actions#ActionTargetRange
use ai.assist.actions#ProposedActionType
use ai.assist.common#NonNegativeInteger

enum ModelProvider {
    @enumValue("openai")
    OPENAI

    @enumValue("anthropic")
    ANTHROPIC

    @enumValue("bedrock")
    BEDROCK
}

enum ProviderResponseStatus {
    @enumValue("success")
    SUCCESS

    @enumValue("retryable_error")
    RETRYABLE_ERROR

    @enumValue("terminal_error")
    TERMINAL_ERROR
}

enum ProviderErrorCategory {
    @enumValue("authentication")
    AUTHENTICATION

    @enumValue("authorization")
    AUTHORIZATION

    @enumValue("invalid_request")
    INVALID_REQUEST

    @enumValue("rate_limited")
    RATE_LIMITED

    @enumValue("quota")
    QUOTA

    @enumValue("timeout")
    TIMEOUT

    @enumValue("unavailable")
    UNAVAILABLE

    @enumValue("model_unavailable")
    MODEL_UNAVAILABLE

    @enumValue("content_filtered")
    CONTENT_FILTERED

    @enumValue("internal")
    INTERNAL
}

enum ProviderStreamEventType {
    @enumValue("assistant.delta")
    ASSISTANT_DELTA

    @enumValue("assistant.final")
    ASSISTANT_FINAL

    @enumValue("error")
    ERROR
}

structure ProviderUsage {
    inputTokens: NonNegativeInteger
    outputTokens: NonNegativeInteger
    totalTokens: NonNegativeInteger
}

structure ProviderError {
    @required
    category: ProviderErrorCategory

    @required
    code: String

    @required
    message: String

    retryAfterSeconds: NonNegativeInteger
    dependencyStatus: String
}

structure ProviderResponse {
    @required
    provider: ModelProvider

    @required
    status: ProviderResponseStatus

    model: String
    messageId: String
    finishReason: String
    usage: ProviderUsage
    error: ProviderError
}

structure ProviderStreamDeltaEvent {
    @required
    type: ProviderStreamEventType

    @required
    provider: ModelProvider

    model: String

    @required
    delta: String
}

structure ProviderStreamFinalEvent {
    @required
    type: ProviderStreamEventType

    @required
    provider: ModelProvider

    model: String

    @required
    finishReason: String

    usage: ProviderUsage
}

structure ProviderStreamErrorEvent {
    @required
    type: ProviderStreamEventType

    @required
    provider: ModelProvider

    model: String

    @required
    error: ProviderError
}

@documentation("Provider-neutral stream event emitted by provider adapters before orchestration wraps it in SessionEvent envelopes.")
union ProviderStreamEvent {
    assistantDelta: ProviderStreamDeltaEvent
    assistantFinal: ProviderStreamFinalEvent
    error: ProviderStreamErrorEvent
}

structure ProviderTextProposalTargetHint {
    originalTextHash: String
    targetAnchor: ActionTargetAnchor
    targetRange: ActionTargetRange
}

@documentation("Provider-neutral structured text edit proposal. Text members carry active review content and must not be logged.")
structure ProviderTextProposal {
    @required
    proposalId: String

    @required
    actionType: ProposedActionType

    currentText: String

    @required
    proposedText: String

    surroundingText: String

    @required
    rationale: String

    targetHint: ProviderTextProposalTargetHint
}

list ProviderTextProposalList {
    member: ProviderTextProposal
}

structure ProviderTextProposalBatch {
    @required
    provider: ModelProvider

    model: String
    messageId: String

    @required
    proposals: ProviderTextProposalList

    usage: ProviderUsage
}
