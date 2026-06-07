import { PROPOSED_ACTION_STATUS_SET, PROPOSED_ACTION_TYPE_SET } from "./actions.js";
import { validateResourceRef } from "./context.js";
import { ERROR_CATEGORY_SET } from "./errors.js";
import {
  enumSet,
  freezeValues,
  isRecord,
  issue,
  requireBoolean,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  validationResult
} from "./validation.js";

export const SESSION_EVENT_TYPES = freezeValues({
  ASSISTANT_DELTA: "assistant.delta",
  ASSISTANT_FINAL: "assistant.final",
  PROGRESS: "progress",
  ERROR: "error",
  ACTION_PROPOSED: "action.proposed",
  ACTION_STATUS_CHANGED: "action.status_changed"
});

export const SESSION_EVENT_TYPE_SET = enumSet(SESSION_EVENT_TYPES);

export const PROGRESS_STATUSES = freezeValues({
  STARTED: "started",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  SKIPPED: "skipped"
});

export const PROGRESS_STATUS_SET = enumSet(PROGRESS_STATUSES);

export function createSessionEvent({
  eventId,
  tenantId,
  userId,
  sessionId,
  requestId,
  correlationId,
  type,
  sequence,
  createdAt,
  payload
}) {
  return {
    eventId,
    tenantId,
    userId,
    sessionId,
    requestId,
    correlationId,
    type,
    ...(sequence === undefined ? {} : { sequence }),
    createdAt,
    payload
  };
}

export function validateSessionEvent(event) {
  const issues = [
    ...requireRecord(event, "event")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(event.eventId, "eventId"),
    ...requireString(event.tenantId, "tenantId"),
    ...requireString(event.userId, "userId"),
    ...requireString(event.sessionId, "sessionId"),
    ...requireString(event.requestId, "requestId"),
    ...requireString(event.correlationId, "correlationId"),
    ...requireEnum(event.type, "type", SESSION_EVENT_TYPE_SET),
    ...requireInteger(event.sequence, "sequence", { optional: true, min: 0 }),
    ...requireString(event.createdAt, "createdAt", { isoTimestamp: true }),
    ...requireRecord(event.payload, "payload")
  );

  if (!SESSION_EVENT_TYPE_SET.has(event.type) || !isRecord(event.payload)) {
    return validationResult(issues);
  }

  issues.push(...validateSessionEventPayload(event.type, event.payload).issues);

  return validationResult(issues);
}

export function validateSessionEventPayload(type, payload) {
  switch (type) {
    case SESSION_EVENT_TYPES.ASSISTANT_DELTA:
      return validateAssistantDeltaPayload(payload);
    case SESSION_EVENT_TYPES.ASSISTANT_FINAL:
      return validateAssistantFinalPayload(payload);
    case SESSION_EVENT_TYPES.PROGRESS:
      return validateProgressPayload(payload);
    case SESSION_EVENT_TYPES.ERROR:
      return validateErrorPayload(payload);
    case SESSION_EVENT_TYPES.ACTION_PROPOSED:
      return validateActionProposedPayload(payload);
    case SESSION_EVENT_TYPES.ACTION_STATUS_CHANGED:
      return validateActionStatusChangedPayload(payload);
    default:
      return validationResult([
        issue("type", "enum", `unsupported session event type: ${type}`)
      ]);
  }
}

function validateAssistantDeltaPayload(payload) {
  return validationResult([
    ...requireString(payload.messageId, "payload.messageId"),
    ...requireString(payload.delta, "payload.delta", { nonEmpty: false }),
    ...requireInteger(payload.index, "payload.index", { min: 0 })
  ]);
}

function validateAssistantFinalPayload(payload) {
  const issues = [
    ...requireString(payload.messageId, "payload.messageId"),
    ...requireString(payload.finishReason, "payload.finishReason")
  ];

  if (payload.usage !== undefined) {
    issues.push(...requireRecord(payload.usage, "payload.usage"));
    if (isRecord(payload.usage)) {
      issues.push(
        ...requireInteger(payload.usage.inputTokens, "payload.usage.inputTokens", {
          optional: true,
          min: 0
        }),
        ...requireInteger(payload.usage.outputTokens, "payload.usage.outputTokens", {
          optional: true,
          min: 0
        }),
        ...requireInteger(payload.usage.totalTokens, "payload.usage.totalTokens", {
          optional: true,
          min: 0
        })
      );
    }
  }

  return validationResult(issues);
}

function validateProgressPayload(payload) {
  return validationResult([
    ...requireString(payload.stage, "payload.stage"),
    ...requireEnum(payload.status, "payload.status", PROGRESS_STATUS_SET),
    ...requireString(payload.messageCode, "payload.messageCode")
  ]);
}

function validateErrorPayload(payload) {
  return validationResult([
    ...requireString(payload.errorCode, "payload.errorCode"),
    ...requireEnum(payload.category, "payload.category", ERROR_CATEGORY_SET),
    ...requireBoolean(payload.retryable, "payload.retryable"),
    ...requireString(payload.message, "payload.message")
  ]);
}

function validateActionProposedPayload(payload) {
  return validationResult([
    ...requireString(payload.actionId, "payload.actionId"),
    ...requireEnum(payload.actionType, "payload.actionType", PROPOSED_ACTION_TYPE_SET),
    ...validateResourceRef(payload.resourceRef, "payload.resourceRef").issues,
    ...requireString(payload.summary, "payload.summary"),
    ...requireString(payload.expiresAt, "payload.expiresAt", { isoTimestamp: true })
  ]);
}

function validateActionStatusChangedPayload(payload) {
  return validationResult([
    ...requireString(payload.actionId, "payload.actionId"),
    ...requireEnum(payload.previousStatus, "payload.previousStatus", PROPOSED_ACTION_STATUS_SET),
    ...requireEnum(payload.status, "payload.status", PROPOSED_ACTION_STATUS_SET),
    ...requireString(payload.reasonCode, "payload.reasonCode")
  ]);
}
