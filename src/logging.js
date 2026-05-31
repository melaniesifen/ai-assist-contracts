import { ERROR_CATEGORY_SET } from "./errors.js";
import { MODEL_PROVIDER_SET } from "./providers.js";
import {
  enumSet,
  freezeValues,
  issue,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";

export const METADATA_LOG_FIELDS = freezeValues({
  REQUEST_ID: "requestId",
  CORRELATION_ID: "correlationId",
  TENANT_ID: "tenantId",
  USER_ID: "userId",
  SERVICE: "service",
  ROUTE: "route",
  OPERATION: "operation",
  STATUS: "status",
  ERROR_CATEGORY: "errorCategory",
  LATENCY_MS: "latencyMs",
  PROVIDER: "provider",
  INPUT_TOKENS: "inputTokens",
  OUTPUT_TOKENS: "outputTokens",
  TOTAL_TOKENS: "totalTokens",
  COST_ESTIMATE_MICRO_USD: "costEstimateMicroUsd"
});

export const SENSITIVE_LOG_FIELD_NAMES = Object.freeze([
  "providerKey",
  "apiKey",
  "oauthToken",
  "accessToken",
  "refreshToken",
  "prompt",
  "documentText",
  "selectedText",
  "modelResponse",
  "screenshot",
  "ocrText",
  "accessibilityTree",
  "actionPayload"
]);

export const LOG_STATUS_VALUES = freezeValues({
  STARTED: "started",
  SUCCEEDED: "succeeded",
  FAILED: "failed"
});

export const LOG_STATUS_SET = enumSet(LOG_STATUS_VALUES);
export const METADATA_LOG_FIELD_SET = enumSet(METADATA_LOG_FIELDS);
export const SENSITIVE_LOG_FIELD_SET = new Set(SENSITIVE_LOG_FIELD_NAMES);

export function createMetadataLogEvent({
  requestId,
  correlationId,
  tenantId,
  userId,
  service,
  route,
  operation,
  status,
  errorCategory,
  latencyMs,
  provider,
  inputTokens,
  outputTokens,
  totalTokens,
  costEstimateMicroUsd
}) {
  return {
    requestId,
    correlationId,
    tenantId,
    userId,
    service,
    route,
    operation,
    status,
    ...(errorCategory === undefined ? {} : { errorCategory }),
    ...(latencyMs === undefined ? {} : { latencyMs }),
    ...(provider === undefined ? {} : { provider }),
    ...(inputTokens === undefined ? {} : { inputTokens }),
    ...(outputTokens === undefined ? {} : { outputTokens }),
    ...(totalTokens === undefined ? {} : { totalTokens }),
    ...(costEstimateMicroUsd === undefined ? {} : { costEstimateMicroUsd })
  };
}

export function validateMetadataLogEvent(event) {
  const issues = [
    ...requireRecord(event, "metadataLogEvent")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(event.requestId, "requestId"),
    ...requireString(event.correlationId, "correlationId"),
    ...requireString(event.tenantId, "tenantId"),
    ...requireString(event.userId, "userId"),
    ...requireString(event.service, "service"),
    ...requireString(event.route, "route"),
    ...requireString(event.operation, "operation"),
    ...requireEnum(event.status, "status", LOG_STATUS_SET),
    ...requireEnum(event.errorCategory, "errorCategory", ERROR_CATEGORY_SET, { optional: true }),
    ...requireInteger(event.latencyMs, "latencyMs", { optional: true, min: 0 }),
    ...requireEnum(event.provider, "provider", MODEL_PROVIDER_SET, { optional: true }),
    ...requireInteger(event.inputTokens, "inputTokens", { optional: true, min: 0 }),
    ...requireInteger(event.outputTokens, "outputTokens", { optional: true, min: 0 }),
    ...requireInteger(event.totalTokens, "totalTokens", { optional: true, min: 0 }),
    ...requireInteger(event.costEstimateMicroUsd, "costEstimateMicroUsd", {
      optional: true,
      min: 0
    })
  );

  for (const field of Object.keys(event)) {
    if (SENSITIVE_LOG_FIELD_SET.has(field)) {
      issues.push(
        issue(
          field,
          VALIDATION_ISSUE_CODES.UNSUPPORTED,
          `${field} is not allowed in metadata logs`
        )
      );
    } else if (!METADATA_LOG_FIELD_SET.has(field)) {
      issues.push(
        issue(
          field,
          VALIDATION_ISSUE_CODES.UNSUPPORTED,
          `${field} is not a metadata log field`
        )
      );
    }
  }

  return validationResult(issues);
}
