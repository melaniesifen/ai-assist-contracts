import {
  CONTEXT_MODES,
  ERROR_CATEGORIES,
  HTTP_COMMAND_RESPONSE_STATUSES,
  HTTP_COMMAND_TYPES,
  MODEL_PROVIDERS,
  PROVIDER_ERROR_CATEGORIES,
  PROVIDER_STREAM_EVENT_TYPES,
  SESSION_EVENT_TYPES,
  createContractError,
  createContractVersionRef,
  createHttpCommandRequest,
  createHttpCommandResponse,
  createIdentityScope,
  createProviderError,
  createProviderStreamEvent,
  createSessionEvent
} from "../src/index.js";

export const ASSISTANT_STREAM_FIXTURE_NOW = "2026-06-07T18:00:00.000Z";
export const ASSISTANT_STREAM_CONTRACT_VERSION = createContractVersionRef();

export const assistantStreamIdentityScope = createIdentityScope({
  tenantId: "tenant_assistant_stream_demo",
  userId: "user_assistant_stream_demo",
  authSubject: "auth_subject_assistant_stream_demo",
  requestId: "req_assistant_stream_demo",
  correlationId: "corr_assistant_stream_demo"
});

function fixture({ name, taskArea, flow, validator, value }) {
  return Object.freeze({
    name,
    taskArea,
    flow,
    contractVersion: ASSISTANT_STREAM_CONTRACT_VERSION,
    validator,
    value
  });
}

export const assistantCommandCreateFixture = fixture({
  name: "assistant-command-create-active-resource-openai",
  taskArea: "EVT-001 EVT-002 PROVIDER-001",
  flow: "assistant command creation",
  validator: "validateHttpCommandRequest",
  value: createHttpCommandRequest({
    contractVersion: ASSISTANT_STREAM_CONTRACT_VERSION,
    commandId: "cmd_assistant_stream_create",
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    identityScope: assistantStreamIdentityScope,
    payload: {
      sessionId: "session_assistant_stream_demo",
      resourceId: "resource_assistant_stream_demo",
      contextMode: CONTEXT_MODES.ACTIVE_RESOURCE,
      provider: MODEL_PROVIDERS.OPENAI,
      intentCode: "ASSISTANT_HELP"
    }
  })
});

export const assistantCommandAcceptedFixture = fixture({
  name: "assistant-command-response-accepted",
  taskArea: "EVT-001",
  flow: "assistant command accepted response",
  validator: "validateHttpCommandResponse",
  value: createHttpCommandResponse({
    contractVersion: ASSISTANT_STREAM_CONTRACT_VERSION,
    requestId: assistantStreamIdentityScope.requestId,
    correlationId: assistantStreamIdentityScope.correlationId,
    commandId: assistantCommandCreateFixture.value.commandId,
    commandType: HTTP_COMMAND_TYPES.CREATE_ASSISTANT_COMMAND,
    status: HTTP_COMMAND_RESPONSE_STATUSES.ACCEPTED,
    result: {
      sessionId: "session_assistant_stream_demo",
      streamRef: "stream_assistant_stream_demo"
    }
  })
});

export const providerStreamFixtures = Object.freeze([
  fixture({
    name: "provider-stream-assistant-delta-openai",
    taskArea: "PROVIDER-001",
    flow: "provider-neutral assistant delta",
    validator: "validateProviderStreamEvent",
    value: createProviderStreamEvent({
      type: PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_DELTA,
      provider: MODEL_PROVIDERS.OPENAI,
      model: "model_assistant_stream_fixture",
      delta: "fixture-delta"
    })
  }),
  fixture({
    name: "provider-stream-assistant-final-openai",
    taskArea: "PROVIDER-001",
    flow: "provider-neutral assistant final",
    validator: "validateProviderStreamEvent",
    value: createProviderStreamEvent({
      type: PROVIDER_STREAM_EVENT_TYPES.ASSISTANT_FINAL,
      provider: MODEL_PROVIDERS.OPENAI,
      model: "model_assistant_stream_fixture",
      finishReason: "stop",
      usage: {
        inputTokens: 4,
        outputTokens: 8,
        totalTokens: 12
      }
    })
  }),
  fixture({
    name: "provider-stream-safe-error-rate-limited",
    taskArea: "PROVIDER-001 OPS-004",
    flow: "provider-neutral safe stream error",
    validator: "validateProviderStreamEvent",
    value: createProviderStreamEvent({
      type: PROVIDER_STREAM_EVENT_TYPES.ERROR,
      provider: MODEL_PROVIDERS.OPENAI,
      model: "model_assistant_stream_fixture",
      error: createProviderError({
        category: PROVIDER_ERROR_CATEGORIES.RATE_LIMITED,
        code: "PROVIDER_RATE_LIMITED",
        message: "Provider asked the service to retry later.",
        retryAfterSeconds: 30,
        dependencyStatus: "rate_limited"
      })
    })
  })
]);

export const assistantSessionEventFixtures = Object.freeze([
  fixture({
    name: "event-session-progress-context-loading",
    taskArea: "EVT-002",
    flow: "context progress event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_assistant_stream_context_loading",
      tenantId: assistantStreamIdentityScope.tenantId,
      userId: assistantStreamIdentityScope.userId,
      sessionId: "session_assistant_stream_demo",
      requestId: assistantStreamIdentityScope.requestId,
      correlationId: assistantStreamIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.PROGRESS,
      sequence: 1,
      createdAt: ASSISTANT_STREAM_FIXTURE_NOW,
      payload: {
        stage: "context.loading",
        status: "started",
        messageCode: "CONTEXT_LOADING"
      }
    })
  }),
  fixture({
    name: "event-session-progress-provider-generating",
    taskArea: "EVT-002 PROVIDER-001",
    flow: "provider progress event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_assistant_stream_provider_generating",
      tenantId: assistantStreamIdentityScope.tenantId,
      userId: assistantStreamIdentityScope.userId,
      sessionId: "session_assistant_stream_demo",
      requestId: assistantStreamIdentityScope.requestId,
      correlationId: assistantStreamIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.PROGRESS,
      sequence: 2,
      createdAt: ASSISTANT_STREAM_FIXTURE_NOW,
      payload: {
        stage: "provider.generating",
        status: "in_progress",
        messageCode: "PROVIDER_GENERATING"
      }
    })
  }),
  fixture({
    name: "event-session-assistant-delta",
    taskArea: "EVT-002 PROVIDER-001",
    flow: "assistant delta session event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_assistant_stream_delta",
      tenantId: assistantStreamIdentityScope.tenantId,
      userId: assistantStreamIdentityScope.userId,
      sessionId: "session_assistant_stream_demo",
      requestId: assistantStreamIdentityScope.requestId,
      correlationId: assistantStreamIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ASSISTANT_DELTA,
      sequence: 3,
      createdAt: ASSISTANT_STREAM_FIXTURE_NOW,
      payload: {
        messageId: "msg_assistant_stream_demo",
        delta: "fixture-delta",
        index: 0
      }
    })
  }),
  fixture({
    name: "event-session-assistant-final",
    taskArea: "EVT-002 PROVIDER-001",
    flow: "assistant final session event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_assistant_stream_final",
      tenantId: assistantStreamIdentityScope.tenantId,
      userId: assistantStreamIdentityScope.userId,
      sessionId: "session_assistant_stream_demo",
      requestId: assistantStreamIdentityScope.requestId,
      correlationId: assistantStreamIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ASSISTANT_FINAL,
      sequence: 4,
      createdAt: ASSISTANT_STREAM_FIXTURE_NOW,
      payload: {
        messageId: "msg_assistant_stream_demo",
        finishReason: "stop",
        usage: {
          inputTokens: 4,
          outputTokens: 8,
          totalTokens: 12
        }
      }
    })
  }),
  fixture({
    name: "event-session-safe-error-provider-rate-limited",
    taskArea: "EVT-002 OPS-004",
    flow: "safe typed error session event",
    validator: "validateSessionEvent",
    value: createSessionEvent({
      eventId: "evt_assistant_stream_error",
      tenantId: assistantStreamIdentityScope.tenantId,
      userId: assistantStreamIdentityScope.userId,
      sessionId: "session_assistant_stream_demo",
      requestId: assistantStreamIdentityScope.requestId,
      correlationId: assistantStreamIdentityScope.correlationId,
      type: SESSION_EVENT_TYPES.ERROR,
      sequence: 5,
      createdAt: ASSISTANT_STREAM_FIXTURE_NOW,
      payload: {
        errorCode: "PROVIDER_RATE_LIMITED",
        category: ERROR_CATEGORIES.DEPENDENCY,
        retryable: true,
        message: "Provider asked the service to retry later."
      }
    })
  })
]);

export const assistantDependencyErrorFixture = fixture({
  name: "assistant-command-error-provider-rate-limited",
  taskArea: "OPS-004 PROVIDER-001",
  flow: "safe provider dependency error",
  validator: "validateContractError",
  value: createContractError({
    code: "PROVIDER_RATE_LIMITED",
    category: ERROR_CATEGORIES.DEPENDENCY,
    message: "Provider asked the service to retry later.",
    retryable: true,
    httpStatus: 429,
    target: "provider"
  })
});

export const ASSISTANT_STREAM_FIXTURES = Object.freeze([
  assistantCommandCreateFixture,
  assistantCommandAcceptedFixture,
  ...providerStreamFixtures,
  ...assistantSessionEventFixtures,
  assistantDependencyErrorFixture
]);
