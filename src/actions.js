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
import { CONNECTOR_SET } from "./connector-vocabulary.js";
import { validateResourceRef } from "./context.js";

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

export const PROPOSED_ACTION_STATUS_TRANSITIONS = Object.freeze({
  [PROPOSED_ACTION_STATUSES.PROPOSED]: Object.freeze([
    PROPOSED_ACTION_STATUSES.APPROVED,
    PROPOSED_ACTION_STATUSES.REJECTED,
    PROPOSED_ACTION_STATUSES.EXPIRED
  ]),
  [PROPOSED_ACTION_STATUSES.APPROVED]: Object.freeze([
    PROPOSED_ACTION_STATUSES.APPLIED,
    PROPOSED_ACTION_STATUSES.CONFLICTED,
    PROPOSED_ACTION_STATUSES.FAILED,
    PROPOSED_ACTION_STATUSES.EXPIRED
  ]),
  [PROPOSED_ACTION_STATUSES.APPLIED]: Object.freeze([]),
  [PROPOSED_ACTION_STATUSES.REJECTED]: Object.freeze([]),
  [PROPOSED_ACTION_STATUSES.EXPIRED]: Object.freeze([]),
  [PROPOSED_ACTION_STATUSES.CONFLICTED]: Object.freeze([]),
  [PROPOSED_ACTION_STATUSES.FAILED]: Object.freeze([])
});

export function isTerminalProposedActionStatus(status) {
  return TERMINAL_PROPOSED_ACTION_STATUS_SET.has(status);
}

export function canTransitionProposedActionStatus(fromStatus, toStatus) {
  if (!PROPOSED_ACTION_STATUS_SET.has(fromStatus) || !PROPOSED_ACTION_STATUS_SET.has(toStatus)) {
    return false;
  }

  return PROPOSED_ACTION_STATUS_TRANSITIONS[fromStatus].includes(toStatus);
}

export function validateProposedActionStatusTransition({
  fromStatus,
  toStatus,
  expiresAt,
  now
}) {
  const issues = [
    ...requireEnum(fromStatus, "fromStatus", PROPOSED_ACTION_STATUS_SET),
    ...requireEnum(toStatus, "toStatus", PROPOSED_ACTION_STATUS_SET),
    ...requireString(expiresAt, "expiresAt", { isoTimestamp: true, optional: true }),
    ...requireString(now, "now", { isoTimestamp: true, optional: true })
  ];

  if (
    PROPOSED_ACTION_STATUS_SET.has(fromStatus) &&
    PROPOSED_ACTION_STATUS_SET.has(toStatus) &&
    !canTransitionProposedActionStatus(fromStatus, toStatus)
  ) {
    issues.push(
      issue(
        "toStatus",
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        `cannot transition proposed action from ${fromStatus} to ${toStatus}`
      )
    );
  }

  if (
    toStatus !== PROPOSED_ACTION_STATUSES.EXPIRED &&
    expiresAt !== undefined &&
    now !== undefined &&
    Date.parse(now) >= Date.parse(expiresAt)
  ) {
    issues.push(
      issue(
        "expiresAt",
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        "expired actions can only transition to EXPIRED"
      )
    );
  }

  return validationResult(issues);
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

export function createProposedActionTarget({ targetAnchor, targetRange }) {
  return {
    ...(targetAnchor === undefined ? {} : { targetAnchor }),
    ...(targetRange === undefined ? {} : { targetRange })
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
    ...requireEnum(targetAnchor.connector, `${field}.connector`, CONNECTOR_SET),
    ...requireString(targetAnchor.anchorId, `${field}.anchorId`),
    ...requireString(targetAnchor.resourceRevision, `${field}.resourceRevision`, {
      optional: true
    })
  );

  return validationResult(issues);
}

export function validateProposedActionTarget(target, field = "target") {
  const issues = [
    ...requireRecord(target, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  const hasAnchor = target.targetAnchor !== undefined;
  const hasRange = target.targetRange !== undefined;

  if (!hasAnchor && !hasRange) {
    issues.push(
      issue(
        field,
        VALIDATION_ISSUE_CODES.REQUIRED,
        `${field}.targetAnchor or ${field}.targetRange is required`
      )
    );
  }

  if (hasAnchor && hasRange) {
    issues.push(
      issue(
        field,
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        `${field} must include only one target variant`
      )
    );
  }

  if (hasAnchor) {
    issues.push(...validateActionTargetAnchor(target.targetAnchor, `${field}.targetAnchor`).issues);
  }

  if (hasRange) {
    issues.push(...validateActionTargetRange(target.targetRange, `${field}.targetRange`).issues);
  }

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
    ...requireEnum(action.provider, "provider", CONNECTOR_SET),
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

export function createProposedActionReviewRef({
  actionId,
  actionType,
  status,
  resourceRef,
  target,
  targetAnchor,
  targetRange,
  originalTextHash,
  currentText,
  proposedText,
  surroundingText,
  rationale,
  conflictReasonCode,
  expiresAt
}) {
  return {
    actionId,
    actionType,
    status,
    resourceRef,
    target: target ?? createProposedActionTarget({ targetAnchor, targetRange }),
    originalTextHash,
    ...(currentText === undefined ? {} : { currentText }),
    proposedText,
    ...(surroundingText === undefined ? {} : { surroundingText }),
    rationale,
    ...(conflictReasonCode === undefined ? {} : { conflictReasonCode }),
    expiresAt
  };
}

export function validateProposedActionReviewRef(reviewRef) {
  const issues = [
    ...requireRecord(reviewRef, "actionReview")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(reviewRef.actionId, "actionReview.actionId"),
    ...requireEnum(reviewRef.actionType, "actionReview.actionType", PROPOSED_ACTION_TYPE_SET),
    ...requireEnum(reviewRef.status, "actionReview.status", PROPOSED_ACTION_STATUS_SET),
    ...validateResourceRef(reviewRef.resourceRef, "actionReview.resourceRef").issues,
    ...validateProposedActionTarget(reviewRef.target, "actionReview.target").issues,
    ...requireString(reviewRef.originalTextHash, "actionReview.originalTextHash"),
    ...requireString(reviewRef.currentText, "actionReview.currentText", {
      optional: true,
      nonEmpty: false
    }),
    ...requireString(reviewRef.proposedText, "actionReview.proposedText", {
      nonEmpty: false
    }),
    ...requireString(reviewRef.surroundingText, "actionReview.surroundingText", {
      optional: true,
      nonEmpty: false
    }),
    ...requireString(reviewRef.rationale, "actionReview.rationale"),
    ...requireString(reviewRef.conflictReasonCode, "actionReview.conflictReasonCode", {
      optional: true
    }),
    ...requireString(reviewRef.expiresAt, "actionReview.expiresAt", { isoTimestamp: true })
  );

  return validationResult(issues);
}
