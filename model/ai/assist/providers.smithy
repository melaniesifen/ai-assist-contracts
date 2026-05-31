$version: "2"

namespace ai.assist.providers

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
