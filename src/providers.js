import {
  enumSet,
  freezeValues,
  isRecord,
  issue,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";

export const MODEL_PROVIDERS = freezeValues({
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  BEDROCK: "bedrock"
});

export const MODEL_PROVIDER_SET = enumSet(MODEL_PROVIDERS);

export const PROVIDER_RESPONSE_STATUSES = freezeValues({
  SUCCESS: "success",
  RETRYABLE_ERROR: "retryable_error",
  TERMINAL_ERROR: "terminal_error"
});

export const PROVIDER_RESPONSE_STATUS_SET = enumSet(PROVIDER_RESPONSE_STATUSES);

export const PROVIDER_ERROR_CATEGORIES = freezeValues({
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  INVALID_REQUEST: "invalid_request",
  RATE_LIMITED: "rate_limited",
  QUOTA: "quota",
  TIMEOUT: "timeout",
  UNAVAILABLE: "unavailable",
  MODEL_UNAVAILABLE: "model_unavailable",
  CONTENT_FILTERED: "content_filtered",
  INTERNAL: "internal"
});

export const PROVIDER_ERROR_CATEGORY_SET = enumSet(PROVIDER_ERROR_CATEGORIES);

export function createProviderResponse({
  provider,
  status,
  model,
  messageId,
  finishReason,
  usage,
  error
}) {
  return {
    provider,
    status,
    ...(model === undefined ? {} : { model }),
    ...(messageId === undefined ? {} : { messageId }),
    ...(finishReason === undefined ? {} : { finishReason }),
    ...(usage === undefined ? {} : { usage }),
    ...(error === undefined ? {} : { error })
  };
}

export function validateProviderResponse(response) {
  const issues = [
    ...requireRecord(response, "providerResponse")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(response.provider, "provider", MODEL_PROVIDER_SET),
    ...requireEnum(response.status, "status", PROVIDER_RESPONSE_STATUS_SET),
    ...requireString(response.model, "model", { optional: true }),
    ...requireString(response.messageId, "messageId", { optional: true }),
    ...requireString(response.finishReason, "finishReason", { optional: true })
  );

  if (response.usage !== undefined) {
    issues.push(...requireRecord(response.usage, "usage"));
    if (isRecord(response.usage)) {
      issues.push(
        ...requireInteger(response.usage.inputTokens, "usage.inputTokens", { optional: true, min: 0 }),
        ...requireInteger(response.usage.outputTokens, "usage.outputTokens", { optional: true, min: 0 }),
        ...requireInteger(response.usage.totalTokens, "usage.totalTokens", { optional: true, min: 0 })
      );
    }
  }

  issues.push(...validateProviderResponseStatusError(response));

  if (response.error !== undefined) {
    issues.push(...validateProviderError(response.error).issues);
  }

  return validationResult(issues);
}

function validateProviderResponseStatusError(response) {
  if (!PROVIDER_RESPONSE_STATUS_SET.has(response.status)) {
    return [];
  }

  if (response.status === PROVIDER_RESPONSE_STATUSES.SUCCESS && response.error !== undefined) {
    return [
      issue(
        "error",
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        "error is not allowed when status is success"
      )
    ];
  }

  if (response.status !== PROVIDER_RESPONSE_STATUSES.SUCCESS && response.error === undefined) {
    return [
      issue(
        "error",
        VALIDATION_ISSUE_CODES.REQUIRED,
        "error is required when status is retryable_error or terminal_error"
      )
    ];
  }

  return [];
}

export function createProviderError({
  category,
  code,
  message,
  retryAfterSeconds,
  dependencyStatus
}) {
  return {
    category,
    code,
    message,
    ...(retryAfterSeconds === undefined ? {} : { retryAfterSeconds }),
    ...(dependencyStatus === undefined ? {} : { dependencyStatus })
  };
}

export function validateProviderError(error) {
  const issues = [
    ...requireRecord(error, "providerError")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(error.category, "providerError.category", PROVIDER_ERROR_CATEGORY_SET),
    ...requireString(error.code, "providerError.code"),
    ...requireString(error.message, "providerError.message"),
    ...requireInteger(error.retryAfterSeconds, "providerError.retryAfterSeconds", {
      optional: true,
      min: 0
    }),
    ...requireString(error.dependencyStatus, "providerError.dependencyStatus", { optional: true })
  );

  return validationResult(issues);
}
