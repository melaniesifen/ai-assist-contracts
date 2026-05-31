import { validateContractError } from "./errors.js";
import { validateIdentityScope } from "./identity.js";
import { validateSupportedContractVersion } from "./versioning.js";
import {
  enumSet,
  freezeValues,
  issue,
  requireRecord,
  requireString,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";

export const HTTP_COMMAND_TYPES = freezeValues({
  START_OAUTH: "auth.oauth.start",
  COMPLETE_OAUTH: "auth.oauth.complete",
  VALIDATE_PROVIDER_KEY: "secrets.provider_key.validate",
  CREATE_RESOURCE_SESSION: "resources.session.create",
  PREVIEW_CONTEXT: "context.preview",
  CREATE_ASSISTANT_COMMAND: "assistant.command.create",
  APPROVE_ACTION: "actions.approve",
  REJECT_ACTION: "actions.reject",
  APPLY_ACTION: "actions.apply"
});

export const HTTP_COMMAND_TYPE_SET = enumSet(HTTP_COMMAND_TYPES);

export const IDEMPOTENT_HTTP_COMMAND_TYPES = Object.freeze([
  HTTP_COMMAND_TYPES.APPLY_ACTION
]);

export const IDEMPOTENT_HTTP_COMMAND_TYPE_SET = new Set(IDEMPOTENT_HTTP_COMMAND_TYPES);

export const HTTP_COMMAND_RESPONSE_STATUSES = freezeValues({
  ACCEPTED: "accepted",
  COMPLETED: "completed",
  REJECTED: "rejected"
});

export const HTTP_COMMAND_RESPONSE_STATUS_SET = enumSet(HTTP_COMMAND_RESPONSE_STATUSES);

export function createHttpCommandRequest({
  contractVersion,
  commandId,
  commandType,
  identityScope,
  idempotencyKey,
  payload = {}
}) {
  return {
    contractVersion,
    commandId,
    commandType,
    identityScope,
    ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    payload
  };
}

export function validateHttpCommandRequest(request) {
  const issues = [
    ...requireRecord(request, "httpCommandRequest")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateSupportedContractVersion(request.contractVersion).issues,
    ...requireString(request.commandId, "commandId"),
    ...requireString(request.commandType, "commandType"),
    ...validateIdentityScope(request.identityScope).issues,
    ...requireString(request.idempotencyKey, "idempotencyKey", {
      optional: !IDEMPOTENT_HTTP_COMMAND_TYPE_SET.has(request.commandType)
    }),
    ...requireRecord(request.payload, "payload")
  );

  if (
    typeof request.commandType === "string" &&
    !HTTP_COMMAND_TYPE_SET.has(request.commandType)
  ) {
    issues.push(
      issue(
        "commandType",
        VALIDATION_ISSUE_CODES.ENUM,
        `commandType must be one of: ${Array.from(HTTP_COMMAND_TYPE_SET).join(", ")}`
      )
    );
  }

  return validationResult(issues);
}

export function createHttpCommandResponse({
  contractVersion,
  requestId,
  correlationId,
  commandId,
  commandType,
  status,
  result,
  error
}) {
  return {
    contractVersion,
    requestId,
    correlationId,
    commandId,
    commandType,
    status,
    ...(result === undefined ? {} : { result }),
    ...(error === undefined ? {} : { error })
  };
}

export function validateHttpCommandResponse(response) {
  const issues = [
    ...requireRecord(response, "httpCommandResponse")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateSupportedContractVersion(response.contractVersion).issues,
    ...requireString(response.requestId, "requestId"),
    ...requireString(response.correlationId, "correlationId"),
    ...requireString(response.commandId, "commandId"),
    ...requireString(response.commandType, "commandType"),
    ...requireString(response.status, "status")
  );

  if (
    typeof response.commandType === "string" &&
    !HTTP_COMMAND_TYPE_SET.has(response.commandType)
  ) {
    issues.push(
      issue(
        "commandType",
        VALIDATION_ISSUE_CODES.ENUM,
        `commandType must be one of: ${Array.from(HTTP_COMMAND_TYPE_SET).join(", ")}`
      )
    );
  }

  if (typeof response.status === "string" && !HTTP_COMMAND_RESPONSE_STATUS_SET.has(response.status)) {
    issues.push(
      issue(
        "status",
        VALIDATION_ISSUE_CODES.ENUM,
        `status must be one of: ${Array.from(HTTP_COMMAND_RESPONSE_STATUS_SET).join(", ")}`
      )
    );
  }

  if (response.status === HTTP_COMMAND_RESPONSE_STATUSES.REJECTED && response.error === undefined) {
    issues.push(
      issue("error", VALIDATION_ISSUE_CODES.REQUIRED, "error is required when status is rejected")
    );
  }

  if (response.status !== HTTP_COMMAND_RESPONSE_STATUSES.REJECTED && response.error !== undefined) {
    issues.push(
      issue("error", VALIDATION_ISSUE_CODES.UNSUPPORTED, "error is only allowed when status is rejected")
    );
  }

  if (response.error !== undefined) {
    issues.push(...validateContractError(response.error).issues);
  }

  return validationResult(issues);
}
