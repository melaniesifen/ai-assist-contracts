import { validateResourceRef } from "./context.js";
import { validateContractError } from "./errors.js";
import { MODEL_PROVIDER_SET } from "./providers.js";
import {
  enumSet,
  freezeValues,
  issue,
  requireArray,
  requireBoolean,
  requireEnum,
  requireRecord,
  requireString,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";

export const PRODUCT_SESSION_STATUSES = freezeValues({
  ANONYMOUS: "anonymous",
  AUTHENTICATED: "authenticated",
  EXPIRED: "expired"
});

export const PRODUCT_SESSION_STATUS_SET = enumSet(PRODUCT_SESSION_STATUSES);

export const OAUTH_PROVIDERS = freezeValues({
  GOOGLE: "google"
});

export const OAUTH_PROVIDER_SET = enumSet(OAUTH_PROVIDERS);

export const GOOGLE_OAUTH_CONNECTION_STATUSES = freezeValues({
  NOT_CONNECTED: "not_connected",
  CONNECTED: "connected",
  RECONNECT_REQUIRED: "reconnect_required"
});

export const GOOGLE_OAUTH_CONNECTION_STATUS_SET = enumSet(GOOGLE_OAUTH_CONNECTION_STATUSES);

export const PROVIDER_SECRET_READINESS_STATUSES = freezeValues({
  MISSING: "missing",
  PENDING_VALIDATION: "pending_validation",
  VALID: "valid",
  INVALID: "invalid",
  EXPIRED: "expired",
  VALIDATION_FAILED: "validation_failed"
});

export const PROVIDER_SECRET_READINESS_STATUS_SET = enumSet(PROVIDER_SECRET_READINESS_STATUSES);

export const RESOURCE_SESSION_READINESS_STATUSES = freezeValues({
  NOT_STARTED: "not_started",
  READY: "ready",
  NOT_READY: "not_ready"
});

export const RESOURCE_SESSION_READINESS_STATUS_SET = enumSet(RESOURCE_SESSION_READINESS_STATUSES);

export const SETUP_ERROR_KINDS = freezeValues({
  PRODUCT_SESSION_REQUIRED: "product_session_required",
  PRODUCT_SESSION_EXPIRED: "product_session_expired",
  GOOGLE_OAUTH_RECONNECT_REQUIRED: "google_oauth_reconnect_required",
  PROVIDER_SECRET_REQUIRED: "provider_secret_required",
  PROVIDER_SECRET_INVALID: "provider_secret_invalid",
  PROVIDER_SECRET_EXPIRED: "provider_secret_expired",
  RESOURCE_SESSION_NOT_READY: "resource_session_not_ready",
  DEPENDENCY_UNAVAILABLE: "dependency_unavailable"
});

export const SETUP_ERROR_KIND_SET = enumSet(SETUP_ERROR_KINDS);

const PRODUCT_SESSION_ALLOWED_FIELDS = new Set([
  "status",
  "tenantId",
  "userId",
  "authSubject",
  "sessionId",
  "expiresAt",
  "error"
]);
const GOOGLE_OAUTH_ALLOWED_FIELDS = new Set([
  "provider",
  "status",
  "googleAccountId",
  "scopes",
  "connectedAt",
  "expiresAt",
  "error"
]);
const PROVIDER_SECRET_ALLOWED_FIELDS = new Set([
  "provider",
  "status",
  "secretId",
  "fingerprint",
  "lastValidatedAt",
  "expiresAt",
  "error"
]);
const RESOURCE_SESSION_ALLOWED_FIELDS = new Set([
  "status",
  "sessionId",
  "resourceRef",
  "resourceRevision",
  "createdAt",
  "error"
]);
const SETUP_ERROR_ALLOWED_FIELDS = new Set(["kind", "error"]);
const FIRST_RUN_SETUP_ALLOWED_FIELDS = new Set([
  "productSession",
  "googleOAuth",
  "providerSecrets",
  "resourceSession",
  "errors",
  "updatedAt"
]);

export function createProductSessionStatusRef({
  status,
  tenantId,
  userId,
  authSubject,
  sessionId,
  expiresAt,
  error
}) {
  return {
    status,
    ...(tenantId === undefined ? {} : { tenantId }),
    ...(userId === undefined ? {} : { userId }),
    ...(authSubject === undefined ? {} : { authSubject }),
    ...(sessionId === undefined ? {} : { sessionId }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(error === undefined ? {} : { error })
  };
}

export function createGoogleOAuthConnectionStatusRef({
  provider,
  status,
  googleAccountId,
  scopes,
  connectedAt,
  expiresAt,
  error
}) {
  return {
    provider,
    status,
    ...(googleAccountId === undefined ? {} : { googleAccountId }),
    ...(scopes === undefined ? {} : { scopes }),
    ...(connectedAt === undefined ? {} : { connectedAt }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(error === undefined ? {} : { error })
  };
}

export function createProviderSecretReadinessRef({
  provider,
  status,
  secretId,
  fingerprint,
  lastValidatedAt,
  expiresAt,
  error
}) {
  return {
    provider,
    status,
    ...(secretId === undefined ? {} : { secretId }),
    ...(fingerprint === undefined ? {} : { fingerprint }),
    ...(lastValidatedAt === undefined ? {} : { lastValidatedAt }),
    ...(expiresAt === undefined ? {} : { expiresAt }),
    ...(error === undefined ? {} : { error })
  };
}

export function createResourceSessionReadinessRef({
  status,
  sessionId,
  resourceRef,
  resourceRevision,
  createdAt,
  error
}) {
  return {
    status,
    ...(sessionId === undefined ? {} : { sessionId }),
    ...(resourceRef === undefined ? {} : { resourceRef }),
    ...(resourceRevision === undefined ? {} : { resourceRevision }),
    ...(createdAt === undefined ? {} : { createdAt }),
    ...(error === undefined ? {} : { error })
  };
}

export function createSetupErrorRef({ kind, error }) {
  return {
    kind,
    error
  };
}

export function createFirstRunSetupStatus({
  productSession,
  googleOAuth,
  providerSecrets,
  resourceSession,
  errors = [],
  updatedAt
}) {
  return {
    productSession,
    googleOAuth,
    providerSecrets,
    ...(resourceSession === undefined ? {} : { resourceSession }),
    errors,
    updatedAt
  };
}

export function validateProductSessionStatusRef(ref, field = "productSession") {
  const issues = [...requireRecord(ref, field)];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateAllowedFields(ref, field, PRODUCT_SESSION_ALLOWED_FIELDS),
    ...requireEnum(ref.status, `${field}.status`, PRODUCT_SESSION_STATUS_SET),
    ...requireString(ref.tenantId, `${field}.tenantId`, { optional: true }),
    ...requireString(ref.userId, `${field}.userId`, { optional: true }),
    ...requireString(ref.authSubject, `${field}.authSubject`, { optional: true }),
    ...requireString(ref.sessionId, `${field}.sessionId`, { optional: true }),
    ...requireString(ref.expiresAt, `${field}.expiresAt`, { isoTimestamp: true, optional: true })
  );

  if (ref.status === PRODUCT_SESSION_STATUSES.AUTHENTICATED) {
    issues.push(
      ...requireString(ref.tenantId, `${field}.tenantId`),
      ...requireString(ref.userId, `${field}.userId`),
      ...requireString(ref.authSubject, `${field}.authSubject`),
      ...requireString(ref.sessionId, `${field}.sessionId`)
    );
  }

  if (ref.error !== undefined) {
    issues.push(...mapIssues(validateContractError(ref.error), `${field}.error`));
  }

  return validationResult(issues);
}

export function validateGoogleOAuthConnectionStatusRef(ref, field = "googleOAuth") {
  const issues = [...requireRecord(ref, field)];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateAllowedFields(ref, field, GOOGLE_OAUTH_ALLOWED_FIELDS),
    ...requireEnum(ref.provider, `${field}.provider`, OAUTH_PROVIDER_SET),
    ...requireEnum(ref.status, `${field}.status`, GOOGLE_OAUTH_CONNECTION_STATUS_SET),
    ...requireString(ref.googleAccountId, `${field}.googleAccountId`, { optional: true }),
    ...requireArray(ref.scopes, `${field}.scopes`, { optional: true }),
    ...requireString(ref.connectedAt, `${field}.connectedAt`, {
      isoTimestamp: true,
      optional: true
    }),
    ...requireString(ref.expiresAt, `${field}.expiresAt`, { isoTimestamp: true, optional: true })
  );

  if (Array.isArray(ref.scopes)) {
    for (const [index, scope] of ref.scopes.entries()) {
      issues.push(...requireString(scope, `${field}.scopes.${index}`));
    }
  }

  if (ref.status === GOOGLE_OAUTH_CONNECTION_STATUSES.CONNECTED) {
    issues.push(
      ...requireString(ref.googleAccountId, `${field}.googleAccountId`),
      ...requireArray(ref.scopes, `${field}.scopes`)
    );
  }

  if (ref.error !== undefined) {
    issues.push(...mapIssues(validateContractError(ref.error), `${field}.error`));
  }

  return validationResult(issues);
}

export function validateProviderSecretReadinessRef(ref, field = "providerSecret") {
  const issues = [...requireRecord(ref, field)];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateAllowedFields(ref, field, PROVIDER_SECRET_ALLOWED_FIELDS),
    ...requireEnum(ref.provider, `${field}.provider`, MODEL_PROVIDER_SET),
    ...requireEnum(ref.status, `${field}.status`, PROVIDER_SECRET_READINESS_STATUS_SET),
    ...requireString(ref.secretId, `${field}.secretId`, { optional: true }),
    ...requireString(ref.fingerprint, `${field}.fingerprint`, { optional: true }),
    ...requireString(ref.lastValidatedAt, `${field}.lastValidatedAt`, {
      isoTimestamp: true,
      optional: true
    }),
    ...requireString(ref.expiresAt, `${field}.expiresAt`, { isoTimestamp: true, optional: true })
  );

  if (ref.status === PROVIDER_SECRET_READINESS_STATUSES.VALID) {
    issues.push(
      ...requireString(ref.secretId, `${field}.secretId`),
      ...requireString(ref.fingerprint, `${field}.fingerprint`),
      ...requireString(ref.expiresAt, `${field}.expiresAt`, { isoTimestamp: true })
    );
  }

  if (ref.error !== undefined) {
    issues.push(...mapIssues(validateContractError(ref.error), `${field}.error`));
  }

  return validationResult(issues);
}

export function validateResourceSessionReadinessRef(ref, field = "resourceSession") {
  const issues = [...requireRecord(ref, field)];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateAllowedFields(ref, field, RESOURCE_SESSION_ALLOWED_FIELDS),
    ...requireEnum(ref.status, `${field}.status`, RESOURCE_SESSION_READINESS_STATUS_SET),
    ...requireString(ref.sessionId, `${field}.sessionId`, { optional: true }),
    ...requireString(ref.resourceRevision, `${field}.resourceRevision`, { optional: true }),
    ...requireString(ref.createdAt, `${field}.createdAt`, { isoTimestamp: true, optional: true })
  );

  if (ref.status === RESOURCE_SESSION_READINESS_STATUSES.READY) {
    issues.push(
      ...requireString(ref.sessionId, `${field}.sessionId`),
      ...requireString(ref.resourceRevision, `${field}.resourceRevision`)
    );
  }

  if (ref.resourceRef !== undefined) {
    issues.push(...mapIssues(validateResourceRef(ref.resourceRef), `${field}.resourceRef`));
  } else if (ref.status === RESOURCE_SESSION_READINESS_STATUSES.READY) {
    issues.push(
      issue(`${field}.resourceRef`, VALIDATION_ISSUE_CODES.REQUIRED, `${field}.resourceRef is required`)
    );
  }

  if (ref.error !== undefined) {
    issues.push(...mapIssues(validateContractError(ref.error), `${field}.error`));
  }

  return validationResult(issues);
}

export function validateSetupErrorRef(ref, field = "setupError") {
  const issues = [...requireRecord(ref, field)];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateAllowedFields(ref, field, SETUP_ERROR_ALLOWED_FIELDS),
    ...requireEnum(ref.kind, `${field}.kind`, SETUP_ERROR_KIND_SET)
  );

  if (ref.error !== undefined) {
    issues.push(...mapIssues(validateContractError(ref.error), `${field}.error`));
  } else {
    issues.push(issue(`${field}.error`, VALIDATION_ISSUE_CODES.REQUIRED, `${field}.error is required`));
  }

  return validationResult(issues);
}

export function validateFirstRunSetupStatus(status, field = "firstRunSetupStatus") {
  const issues = [...requireRecord(status, field)];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...validateAllowedFields(status, field, FIRST_RUN_SETUP_ALLOWED_FIELDS),
    ...mapIssues(validateProductSessionStatusRef(status.productSession), `${field}.productSession`),
    ...mapIssues(validateGoogleOAuthConnectionStatusRef(status.googleOAuth), `${field}.googleOAuth`),
    ...requireArray(status.providerSecrets, `${field}.providerSecrets`),
    ...requireArray(status.errors, `${field}.errors`),
    ...requireString(status.updatedAt, `${field}.updatedAt`, { isoTimestamp: true })
  );

  if (Array.isArray(status.providerSecrets)) {
    for (const [index, providerSecret] of status.providerSecrets.entries()) {
      issues.push(
        ...mapIssues(
          validateProviderSecretReadinessRef(providerSecret),
          `${field}.providerSecrets.${index}`
        )
      );
    }
  }

  if (status.resourceSession !== undefined) {
    issues.push(
      ...mapIssues(validateResourceSessionReadinessRef(status.resourceSession), `${field}.resourceSession`)
    );
  }

  if (Array.isArray(status.errors)) {
    for (const [index, setupError] of status.errors.entries()) {
      issues.push(...mapIssues(validateSetupErrorRef(setupError), `${field}.errors.${index}`));
    }
  }

  return validationResult(issues);
}

function validateAllowedFields(value, field, allowedFields) {
  const issues = [];
  for (const key of Object.keys(value)) {
    if (!allowedFields.has(key)) {
      issues.push(
        issue(
          `${field}.${key}`,
          VALIDATION_ISSUE_CODES.UNSUPPORTED,
          `${field}.${key} is not allowed`
        )
      );
    }
  }
  return issues;
}

function mapIssues(result, prefix) {
  return result.issues.map((item) => ({
    ...item,
    field: item.field === "error" || item.field === "resourceRef"
      ? prefix
      : `${prefix}.${item.field}`
  }));
}
