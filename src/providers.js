import {
  validateActionTargetAnchor,
  validateActionTargetRange,
  PROPOSED_ACTION_TYPE_SET,
  PROPOSED_ACTION_TYPES
} from "./actions.js";
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

export const MODEL_PROVIDERS = freezeValues({
  OPENAI: "openai",
  ANTHROPIC: "anthropic",
  BEDROCK: "bedrock"
});

export const MODEL_PROVIDER_SET = enumSet(MODEL_PROVIDERS);

export const PROVIDER_RESPONSE_STATUSES = freezeValues({
  SUCCESS: "success",
  RETRYABLE_ERROR: "retryable_error",
  TERMINAL_ERROR: "terminal_error"
});

export const PROVIDER_RESPONSE_STATUS_SET = enumSet(PROVIDER_RESPONSE_STATUSES);

export const PROVIDER_ERROR_CATEGORIES = freezeValues({
  AUTHENTICATION: "authentication",
  AUTHORIZATION: "authorization",
  INVALID_REQUEST: "invalid_request",
  RATE_LIMITED: "rate_limited",
  QUOTA: "quota",
  TIMEOUT: "timeout",
  UNAVAILABLE: "unavailable",
  MODEL_UNAVAILABLE: "model_unavailable",
  CONTENT_FILTERED: "content_filtered",
  INTERNAL: "internal"
});

export const PROVIDER_ERROR_CATEGORY_SET = enumSet(PROVIDER_ERROR_CATEGORIES);

export const PROVIDER_STREAM_EVENT_TYPES = freezeValues({
  ASSISTANT_DELTA: "assistant.delta",
  ASSISTANT_FINAL: "assistant.final",
  ERROR: "error"
});

export const PROVIDER_STREAM_EVENT_TYPE_SET = enumSet(PROVIDER_STREAM_EVENT_TYPES);

export function createProviderResponse({
  provider,
  status,
  model,
  messageId,
  finishReason,
  usage,
  error
}) {
  return {
    provider,
    status,
    ...(model === undefined ? {} : { model }),
    ...(messageId === undefined ? {} : { messageId }),
    ...(finishReason === undefined ? {} : { finishReason }),
    ...(usage === undefined ? {} : { usage }),
    ...(error === undefined ? {} : { error })
  };
}

function validateProviderUsage(usage, field = "usage") {
  const issues = [
    ...requireRecord(usage, field)
  ];
  if (issues.length > 0) {
    return issues;
  }

  issues.push(
    ...requireInteger(usage.inputTokens, `${field}.inputTokens`, { optional: true, min: 0 }),
    ...requireInteger(usage.outputTokens, `${field}.outputTokens`, { optional: true, min: 0 }),
    ...requireInteger(usage.totalTokens, `${field}.totalTokens`, { optional: true, min: 0 })
  );

  return issues;
}

export function validateProviderResponse(response) {
  const issues = [
    ...requireRecord(response, "providerResponse")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(response.provider, "provider", MODEL_PROVIDER_SET),
    ...requireEnum(response.status, "status", PROVIDER_RESPONSE_STATUS_SET),
    ...requireString(response.model, "model", { optional: true }),
    ...requireString(response.messageId, "messageId", { optional: true }),
    ...requireString(response.finishReason, "finishReason", { optional: true })
  );

  if (response.usage !== undefined) {
    issues.push(...validateProviderUsage(response.usage));
  }

  issues.push(...validateProviderResponseStatusError(response));

  if (response.error !== undefined) {
    issues.push(...validateProviderError(response.error).issues);
  }

  return validationResult(issues);
}

function validateProviderResponseStatusError(response) {
  if (!PROVIDER_RESPONSE_STATUS_SET.has(response.status)) {
    return [];
  }

  if (response.status === PROVIDER_RESPONSE_STATUSES.SUCCESS && response.error !== undefined) {
    return [
      issue(
        "error",
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        "error is not allowed when status is success"
      )
    ];
  }

  if (response.status !== PROVIDER_RESPONSE_STATUSES.SUCCESS && response.error === undefined) {
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

export function createProviderStreamEvent({
  type,
  provider,
  model,
  delta,
  finishReason,
  usage,
  error
}) {
  return {
    type,
    provider,
    ...(model === undefined ? {} : { model }),
    ...(delta === undefined ? {} : { delta }),
    ...(finishReason === undefined ? {} : { finishReason }),
    ...(usage === undefined ? {} : { usage }),
    ...(error === undefined ? {} : { error })
  };
}

export function validateProviderStreamEvent(event) {
  const issues = [
    ...requireRecord(event, "providerStreamEvent")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(event.type, "type", PROVIDER_STREAM_EVENT_TYPE_SET),
    ...requireEnum(event.provider, "provider", MODEL_PROVIDER_SET),
    ...requireString(event.model, "model", { optional: true })
  );

  if (!PROVIDER_STREAM_EVENT_TYPE_SET.has(event.type)) {
    return validationResult(issues);
  }

  issues.push(...validateProviderStreamEventFields(event));

  if (event.type === PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_DELTA) {
    issues.push(...requireString(event.delta, "delta", { nonEmpty: false }));
  }

  if (event.type === PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_FINAL) {
    issues.push(...requireString(event.finishReason, "finishReason"));
    if (event.usage !== undefined) {
      issues.push(...validateProviderUsage(event.usage));
    }
  }

  if (event.type === PROVIDER_STREAM_EVENT_TYPES.ERROR) {
    issues.push(...validateProviderError(event.error).issues);
  }

  return validationResult(issues);
}

function validateProviderStreamEventFields(event) {
  const baseFields = new Set(["type", "provider", "model"]);
  const fieldsByType = {
    [PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_DELTA]: new Set([...baseFields, "delta"]),
    [PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_FINAL]: new Set([...baseFields, "finishReason", "usage"]),
    [PROVIDER_STREAM_EVENT_TYPES.ERROR]: new Set([...baseFields, "error"])
  };
  const allowedFields = fieldsByType[event.type];
  const issues = [];

  for (const key of Object.keys(event)) {
    if (!allowedFields.has(key)) {
      issues.push(
        issue(
          key,
          VALIDATION_ISSUE_CODES.UNSUPPORTED,
          `${key} is not allowed on ${event.type} provider stream events`
        )
      );
    }
  }

  return issues;
}

export function createProviderError({
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

export function validateProviderError(error) {
  const issues = [
    ...requireRecord(error, "providerError")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(error.category, "providerError.category", PROVIDER_ERROR_CATEGORY_SET),
    ...requireString(error.code, "providerError.code"),
    ...requireString(error.message, "providerError.message"),
    ...requireInteger(error.retryAfterSeconds, "providerError.retryAfterSeconds", {
      optional: true,
      min: 0
    }),
    ...requireString(error.dependencyStatus, "providerError.dependencyStatus", { optional: true })
  );

  return validationResult(issues);
}

export function createProviderTextProposalTargetHint({
  originalTextHash,
  targetAnchor,
  targetRange
}) {
  return {
    ...(originalTextHash === undefined ? {} : { originalTextHash }),
    ...(targetAnchor === undefined ? {} : { targetAnchor }),
    ...(targetRange === undefined ? {} : { targetRange })
  };
}

export function validateProviderTextProposalTargetHint(targetHint, field = "targetHint") {
  const issues = [
    ...requireRecord(targetHint, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  const allowedFields = new Set(["originalTextHash", "targetAnchor", "targetRange"]);
  for (const key of Object.keys(targetHint)) {
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

  issues.push(
    ...requireString(targetHint.originalTextHash, `${field}.originalTextHash`, { optional: true })
  );

  if (targetHint.targetAnchor !== undefined) {
    issues.push(...validateActionTargetAnchor(targetHint.targetAnchor, `${field}.targetAnchor`).issues);
  }

  if (targetHint.targetRange !== undefined) {
    issues.push(...validateActionTargetRange(targetHint.targetRange, `${field}.targetRange`).issues);
  }

  return validationResult(issues);
}

export function createProviderTextProposal({
  proposalId,
  actionType = PROPOSED_ACTION_TYPES.REPLACE_TEXT,
  currentText,
  proposedText,
  surroundingText,
  rationale,
  targetHint
}) {
  return {
    proposalId,
    actionType,
    ...(currentText === undefined ? {} : { currentText }),
    proposedText,
    ...(surroundingText === undefined ? {} : { surroundingText }),
    rationale,
    ...(targetHint === undefined ? {} : { targetHint })
  };
}

export function validateProviderTextProposal(proposal, field = "providerTextProposal") {
  const issues = [
    ...requireRecord(proposal, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(proposal.proposalId, `${field}.proposalId`),
    ...requireEnum(proposal.actionType, `${field}.actionType`, PROPOSED_ACTION_TYPE_SET),
    ...requireString(proposal.currentText, `${field}.currentText`, {
      optional: true,
      nonEmpty: false
    }),
    ...requireString(proposal.proposedText, `${field}.proposedText`, {
      nonEmpty: false
    }),
    ...requireString(proposal.surroundingText, `${field}.surroundingText`, {
      optional: true,
      nonEmpty: false
    }),
    ...requireString(proposal.rationale, `${field}.rationale`)
  );

  if (proposal.targetHint !== undefined) {
    issues.push(...validateProviderTextProposalTargetHint(
      proposal.targetHint,
      `${field}.targetHint`
    ).issues);
  }

  return validationResult(issues);
}

export function createProviderTextProposalBatch({
  provider,
  model,
  messageId,
  proposals,
  usage
}) {
  return {
    provider,
    ...(model === undefined ? {} : { model }),
    ...(messageId === undefined ? {} : { messageId }),
    proposals,
    ...(usage === undefined ? {} : { usage })
  };
}

export function validateProviderTextProposalBatch(batch, field = "providerTextProposalBatch") {
  const issues = [
    ...requireRecord(batch, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(batch.provider, `${field}.provider`, MODEL_PROVIDER_SET),
    ...requireString(batch.model, `${field}.model`, { optional: true }),
    ...requireString(batch.messageId, `${field}.messageId`, { optional: true }),
    ...requireArray(batch.proposals, `${field}.proposals`)
  );

  if (Array.isArray(batch.proposals)) {
    for (const [index, proposal] of batch.proposals.entries()) {
      issues.push(...validateProviderTextProposal(proposal, `${field}.proposals.${index}`).issues);
    }
  }

  if (batch.usage !== undefined) {
    issues.push(...validateProviderUsage(batch.usage, `${field}.usage`));
  }

  return validationResult(issues);
}
