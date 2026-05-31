import {
  enumSet,
  freezeValues,
  requireBoolean,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  validationResult
} from "./validation.js";

export const ERROR_CATEGORIES = freezeValues({
  AUTHENTICATION: "AUTHENTICATION",
  AUTHORIZATION: "AUTHORIZATION",
  RATE_LIMITED: "RATE_LIMITED",
  VALIDATION: "VALIDATION",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  CONFLICT: "CONFLICT",
  DEPENDENCY: "DEPENDENCY",
  PROVIDER_QUOTA: "PROVIDER_QUOTA",
  KMS: "KMS",
  OAUTH: "OAUTH",
  CONNECTOR: "CONNECTOR",
  POLICY: "POLICY",
  INTERNAL: "INTERNAL"
});

export const ERROR_CATEGORY_SET = enumSet(ERROR_CATEGORIES);

export const STANDARD_ERROR_CODES = freezeValues({
  AUTHENTICATION_REQUIRED: "AUTHENTICATION_REQUIRED",
  AUTHENTICATION_EXPIRED: "AUTHENTICATION_EXPIRED",
  MALFORMED_PRODUCT_CREDENTIAL: "MALFORMED_PRODUCT_CREDENTIAL",
  AUTHORIZATION_DENIED: "AUTHORIZATION_DENIED",
  CONTRACT_VALIDATION_FAILED: "CONTRACT_VALIDATION_FAILED",
  UNSUPPORTED_CONTRACT_VERSION: "UNSUPPORTED_CONTRACT_VERSION",
  UNSUPPORTED_CONTEXT_MODE: "UNSUPPORTED_CONTEXT_MODE",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  RESOURCE_CONFLICT: "RESOURCE_CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  PROVIDER_SECRET_EXPIRED: "PROVIDER_SECRET_EXPIRED",
  PROVIDER_QUOTA_EXCEEDED: "PROVIDER_QUOTA_EXCEEDED",
  OAUTH_RECONNECT_REQUIRED: "OAUTH_RECONNECT_REQUIRED",
  CONNECTOR_OPERATION_FAILED: "CONNECTOR_OPERATION_FAILED",
  KMS_OPERATION_FAILED: "KMS_OPERATION_FAILED",
  INTERNAL_ERROR: "INTERNAL_ERROR"
});

export function createContractError({
  code,
  category,
  message,
  retryable = false,
  httpStatus,
  target,
  details
}) {
  return {
    code,
    category,
    message,
    retryable,
    ...(httpStatus === undefined ? {} : { httpStatus }),
    ...(target === undefined ? {} : { target }),
    ...(details === undefined ? {} : { details })
  };
}

export function validateContractError(error) {
  const issues = [
    ...requireRecord(error, "error")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(error.code, "code"),
    ...requireEnum(error.category, "category", ERROR_CATEGORY_SET),
    ...requireString(error.message, "message"),
    ...requireBoolean(error.retryable, "retryable"),
    ...requireInteger(error.httpStatus, "httpStatus", { optional: true, min: 100 }),
    ...requireString(error.target, "target", { optional: true })
  );

  return validationResult(issues);
}
