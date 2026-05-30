import {
  requireRecord,
  requireString,
  validationResult
} from "./validation.js";

export const IDENTITY_REFERENCE_FIELDS = Object.freeze({
  TENANT_ID: "tenantId",
  USER_ID: "userId",
  AUTH_SUBJECT: "authSubject",
  SESSION_ID: "sessionId",
  RESOURCE_ID: "resourceId",
  ACTION_ID: "actionId",
  CONSENT_GRANT_ID: "consentGrantId",
  SECRET_ID: "secretId",
  REQUEST_ID: "requestId",
  CORRELATION_ID: "correlationId"
});

export const TENANT_USER_ROLES = Object.freeze({
  OWNER: "owner",
  MEMBER: "member"
});

export const TENANT_USER_STATUSES = Object.freeze({
  ACTIVE: "active",
  DISABLED: "disabled"
});

export function createIdentityScope({
  tenantId,
  userId,
  authSubject,
  requestId,
  correlationId
}) {
  return {
    tenantId,
    userId,
    authSubject,
    requestId,
    correlationId
  };
}

export function validateIdentityScope(scope) {
  const issues = [
    ...requireRecord(scope, "identityScope")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(scope.tenantId, "tenantId"),
    ...requireString(scope.userId, "userId"),
    ...requireString(scope.authSubject, "authSubject"),
    ...requireString(scope.requestId, "requestId"),
    ...requireString(scope.correlationId, "correlationId")
  );

  return validationResult(issues);
}
