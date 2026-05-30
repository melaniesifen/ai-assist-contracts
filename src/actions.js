import {
  enumSet,
  freezeValues,
  issue,
  requireInteger,
  requireEnum,
  requireRecord,
  requireString,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";

export const PROPOSED_ACTION_DEFAULT_TTL_HOURS = 24;
export const PROPOSED_ACTION_DEFAULT_TTL_SECONDS = PROPOSED_ACTION_DEFAULT_TTL_HOURS * 60 * 60;

export const PROPOSED_ACTION_TYPES = freezeValues({
  REPLACE_TEXT: "REPLACE_TEXT",
  INSERT_TEXT: "INSERT_TEXT"
});

export const PROPOSED_ACTION_TYPE_SET = enumSet(PROPOSED_ACTION_TYPES);

export const PROPOSED_ACTION_STATUSES = freezeValues({
  PROPOSED: "PROPOSED",
  APPROVED: "APPROVED",
  APPLIED: "APPLIED",
  REJECTED: "REJECTED",
  EXPIRED: "EXPIRED",
  CONFLICTED: "CONFLICTED",
  FAILED: "FAILED"
});

export const PROPOSED_ACTION_STATUS_SET = enumSet(PROPOSED_ACTION_STATUSES);

export const TERMINAL_PROPOSED_ACTION_STATUSES = Object.freeze([
  PROPOSED_ACTION_STATUSES.APPLIED,
  PROPOSED_ACTION_STATUSES.REJECTED,
  PROPOSED_ACTION_STATUSES.EXPIRED,
  PROPOSED_ACTION_STATUSES.CONFLICTED,
  PROPOSED_ACTION_STATUSES.FAILED
]);

export const TERMINAL_PROPOSED_ACTION_STATUS_SET = new Set(TERMINAL_PROPOSED_ACTION_STATUSES);

export function isTerminalProposedActionStatus(status) {
  return TERMINAL_PROPOSED_ACTION_STATUS_SET.has(status);
}

export function createActionTargetRange({ start, end }) {
  return { start, end };
}

export function createActionTargetAnchor({ connector, anchorId, resourceRevision }) {
  return {
    connector,
    anchorId,
    ...(resourceRevision === undefined ? {} : { resourceRevision })
  };
}

export function validateActionTargetRange(targetRange, field = "targetRange") {
  const issues = [
    ...requireRecord(targetRange, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireInteger(targetRange.start, `${field}.start`, { min: 0 }),
    ...requireInteger(targetRange.end, `${field}.end`, { min: 0 })
  );

  if (
    Number.isInteger(targetRange.start) &&
    Number.isInteger(targetRange.end) &&
    targetRange.end < targetRange.start
  ) {
    issues.push(
      issue(
        `${field}.end`,
        VALIDATION_ISSUE_CODES.RANGE,
        `${field}.end must be >= ${field}.start`
      )
    );
  }

  return validationResult(issues);
}

export function validateActionTargetAnchor(targetAnchor, field = "targetAnchor") {
  const issues = [
    ...requireRecord(targetAnchor, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(targetAnchor.connector, `${field}.connector`),
    ...requireString(targetAnchor.anchorId, `${field}.anchorId`),
    ...requireString(targetAnchor.resourceRevision, `${field}.resourceRevision`, {
      optional: true
    })
  );

  return validationResult(issues);
}

export function createProposedActionRef({
  actionId,
  tenantId,
  userId,
  sessionId,
  provider,
  resourceId,
  resourceRevision,
  targetAnchor,
  targetRange,
  originalTextHash,
  actionType,
  status,
  idempotencyKey,
  createdAt,
  updatedAt,
  expiresAt
}) {
  return {
    actionId,
    tenantId,
    userId,
    sessionId,
    provider,
    resourceId,
    resourceRevision,
    ...(targetAnchor === undefined ? {} : { targetAnchor }),
    ...(targetRange === undefined ? {} : { targetRange }),
    originalTextHash,
    actionType,
    status,
    ...(idempotencyKey === undefined ? {} : { idempotencyKey }),
    createdAt,
    updatedAt,
    expiresAt
  };
}

export function validateProposedActionRef(action) {
  const issues = [
    ...requireRecord(action, "action")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(action.actionId, "actionId"),
    ...requireString(action.tenantId, "tenantId"),
    ...requireString(action.userId, "userId"),
    ...requireString(action.sessionId, "sessionId"),
    ...requireString(action.provider, "provider"),
    ...requireString(action.resourceId, "resourceId"),
    ...requireString(action.resourceRevision, "resourceRevision"),
    ...requireString(action.originalTextHash, "originalTextHash"),
    ...requireEnum(action.actionType, "actionType", PROPOSED_ACTION_TYPE_SET),
    ...requireEnum(action.status, "status", PROPOSED_ACTION_STATUS_SET),
    ...requireString(action.idempotencyKey, "idempotencyKey", { optional: true }),
    ...requireString(action.createdAt, "createdAt", { isoTimestamp: true }),
    ...requireString(action.updatedAt, "updatedAt", { isoTimestamp: true }),
    ...requireString(action.expiresAt, "expiresAt", { isoTimestamp: true })
  );

  if (action.targetAnchor === undefined && action.targetRange === undefined) {
    issues.push(
      issue(
        "targetAnchor",
        VALIDATION_ISSUE_CODES.REQUIRED,
        "targetAnchor or targetRange is required"
      )
    );
  }

  if (action.targetAnchor !== undefined) {
    issues.push(...validateActionTargetAnchor(action.targetAnchor).issues);
  }

  if (action.targetRange !== undefined) {
    issues.push(...validateActionTargetRange(action.targetRange).issues);
  }

  return validationResult(issues);
}
