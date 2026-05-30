import {
  enumSet,
  freezeValues,
  requireEnum,
  requireRecord,
  requireString,
  validationResult
} from "./validation.js";

export const SESSION_SECRET_DEFAULT_TTL_HOURS = 8;
export const SESSION_SECRET_DEFAULT_TTL_SECONDS = SESSION_SECRET_DEFAULT_TTL_HOURS * 60 * 60;

export const SESSION_SECRET_STATUSES = freezeValues({
  PENDING_VALIDATION: "pending_validation",
  ACTIVE: "active",
  VALIDATION_FAILED: "validation_failed",
  EXPIRED: "expired",
  DELETED: "deleted"
});

export const SESSION_SECRET_STATUS_SET = enumSet(SESSION_SECRET_STATUSES);

export function createSessionSecretStatusRef({
  tenantId,
  userId,
  provider,
  secretId,
  fingerprint,
  status,
  createdAt,
  lastValidatedAt,
  expiresAt
}) {
  return {
    tenantId,
    userId,
    provider,
    secretId,
    fingerprint,
    status,
    createdAt,
    ...(lastValidatedAt === undefined ? {} : { lastValidatedAt }),
    expiresAt
  };
}

export function validateSessionSecretStatusRef(secret) {
  const issues = [
    ...requireRecord(secret, "sessionSecret")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(secret.tenantId, "tenantId"),
    ...requireString(secret.userId, "userId"),
    ...requireString(secret.provider, "provider"),
    ...requireString(secret.secretId, "secretId"),
    ...requireString(secret.fingerprint, "fingerprint"),
    ...requireEnum(secret.status, "status", SESSION_SECRET_STATUS_SET),
    ...requireString(secret.createdAt, "createdAt", { isoTimestamp: true }),
    ...requireString(secret.lastValidatedAt, "lastValidatedAt", {
      isoTimestamp: true,
      optional: true
    }),
    ...requireString(secret.expiresAt, "expiresAt", { isoTimestamp: true })
  );

  return validationResult(issues);
}
