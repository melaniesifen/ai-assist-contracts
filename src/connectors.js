import {
  enumSet,
  freezeValues,
  issue,
  requireArray,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";
import { CONNECTOR_SET, CONNECTORS } from "./connector-vocabulary.js";
import { validateNormalizedContext, validateResourceRef } from "./context.js";

export { CONNECTOR_SET, CONNECTORS };

export const CONNECTOR_OPERATIONS = freezeValues({
  LIST_RESOURCES: "ListResources",
  GET_RESOURCE_METADATA: "GetResourceMetadata",
  READ_CONTEXT: "ReadContext",
  RESOLVE_SELECTION: "ResolveSelection",
  VALIDATE_RESOURCE_REVISION: "ValidateResourceRevision",
  VALIDATE_MUTATION_TARGET: "ValidateMutationTarget",
  APPLY_MUTATION: "ApplyMutation"
});

export const CONNECTOR_OPERATION_SET = enumSet(CONNECTOR_OPERATIONS);

export const CONNECTOR_RESPONSE_STATUSES = freezeValues({
  SUCCESS: "success",
  RETRYABLE_ERROR: "retryable_error",
  TERMINAL_ERROR: "terminal_error"
});

export const CONNECTOR_RESPONSE_STATUS_SET = enumSet(CONNECTOR_RESPONSE_STATUSES);

export const CONNECTOR_ERROR_CATEGORIES = freezeValues({
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  CONSENT_REQUIRED: "consent_required",
  NOT_FOUND: "not_found",
  CONFLICT: "conflict",
  RATE_LIMITED: "rate_limited",
  TIMEOUT: "timeout",
  UNAVAILABLE: "unavailable",
  UNSUPPORTED_OPERATION: "unsupported_operation",
  DEPENDENCY: "dependency",
  INTERNAL: "internal"
});

export const CONNECTOR_ERROR_CATEGORY_SET = enumSet(CONNECTOR_ERROR_CATEGORIES);

export function createConnectorResponse({
  connector,
  operation,
  status,
  requestId,
  resourceRevision,
  result,
  error
}) {
  return {
    connector,
    operation,
    status,
    requestId,
    ...(resourceRevision === undefined ? {} : { resourceRevision }),
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error })
  };
}

export function validateConnectorResponse(response) {
  const issues = [
    ...requireRecord(response, "connectorResponse")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(response.connector, "connector", CONNECTOR_SET),
    ...requireEnum(response.operation, "operation", CONNECTOR_OPERATION_SET),
    ...requireEnum(response.status, "status", CONNECTOR_RESPONSE_STATUS_SET),
    ...requireString(response.requestId, "requestId"),
    ...requireString(response.resourceRevision, "resourceRevision", { optional: true })
  );

  issues.push(...validateConnectorResponseStatusError(response));

  if (response.error !== undefined) {
    issues.push(...validateConnectorError(response.error).issues);
  }

  return validationResult(issues);
}

function validateConnectorResponseStatusError(response) {
  if (!CONNECTOR_RESPONSE_STATUS_SET.has(response.status)) {
    return [];
  }

  if (response.status === CONNECTOR_RESPONSE_STATUSES.SUCCESS && response.error !== undefined) {
    return [
      issue(
        "error",
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        "error is not allowed when status is success"
      )
    ];
  }

  if (response.status !== CONNECTOR_RESPONSE_STATUSES.SUCCESS && response.error === undefined) {
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

export function createConnectorError({
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

export function validateConnectorError(error) {
  const issues = [
    ...requireRecord(error, "connectorError")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(error.category, "connectorError.category", CONNECTOR_ERROR_CATEGORY_SET),
    ...requireString(error.code, "connectorError.code"),
    ...requireString(error.message, "connectorError.message"),
    ...requireInteger(error.retryAfterSeconds, "connectorError.retryAfterSeconds", {
      optional: true,
      min: 0
    }),
    ...requireString(error.dependencyStatus, "connectorError.dependencyStatus", { optional: true })
  );

  return validationResult(issues);
}

export function createConnectorResourceListResult({
  resources,
  nextPageToken
}) {
  return {
    resources,
    ...(nextPageToken === undefined ? {} : { nextPageToken })
  };
}

export function validateConnectorResourceListResult(result, field = "resourceListResult") {
  const issues = [
    ...requireRecord(result, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireArray(result.resources, `${field}.resources`),
    ...requireString(result.nextPageToken, `${field}.nextPageToken`, { optional: true })
  );

  if (Array.isArray(result.resources)) {
    for (const [index, resource] of result.resources.entries()) {
      issues.push(...validateResourceRef(resource, `${field}.resources.${index}`).issues);
    }
  }

  return validationResult(issues);
}

export function createConnectorReadContextResult({
  context,
  resourceRevision
}) {
  return {
    context,
    resourceRevision
  };
}

export function validateConnectorReadContextResult(result, field = "readContextResult") {
  const issues = [
    ...requireRecord(result, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateNormalizedContext(result.context).issues.map((item) => ({
      ...item,
      field: item.field === "context" ? `${field}.context` : `${field}.context.${item.field}`
    })),
    ...requireString(result.resourceRevision, `${field}.resourceRevision`)
  );

  return validationResult(issues);
}
