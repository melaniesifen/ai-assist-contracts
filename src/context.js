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
import { CONNECTOR_SET } from "./connector-vocabulary.js";

export const CONTEXT_MODES = freezeValues({
  SELECTION: "SELECTION",
  ACTIVE_RESOURCE: "ACTIVE_RESOURCE",
  VISIBLE_REGION: "VISIBLE_REGION",
  WORKSPACE: "WORKSPACE",
  SCREEN: "SCREEN"
});

export const MVP_CONTEXT_MODES = Object.freeze([
  CONTEXT_MODES.SELECTION,
  CONTEXT_MODES.ACTIVE_RESOURCE
]);

export const CONTEXT_MODE_SET = enumSet(CONTEXT_MODES);
export const MVP_CONTEXT_MODE_SET = new Set(MVP_CONTEXT_MODES);

export const CONTEXT_SOURCE_TYPES = freezeValues({
  CLIENT_SELECTION_TEXT: "client_selection_text",
  CONNECTOR_SELECTION: "connector_selection",
  CONNECTOR_RESOURCE_EXCERPT: "connector_resource_excerpt",
  CONNECTOR_VISIBLE_REGION: "connector_visible_region",
  CONNECTOR_WORKSPACE_EXCERPT: "connector_workspace_excerpt",
  SCREEN_CAPTURE: "screen_capture"
});

export const CONTEXT_SOURCE_TYPE_SET = enumSet(CONTEXT_SOURCE_TYPES);

export const CONTEXT_TRUST_LEVELS = freezeValues({
  CLIENT_SUPPLIED: "client_supplied",
  CONNECTOR_VERIFIED: "connector_verified",
  SYSTEM_VERIFIED: "system_verified"
});

export const CONTEXT_TRUST_LEVEL_SET = enumSet(CONTEXT_TRUST_LEVELS);

export const CONSENT_GRANT_STATUSES = freezeValues({
  ACTIVE: "active",
  REVOKED: "revoked",
  EXPIRED: "expired"
});

export const CONSENT_GRANT_STATUS_SET = enumSet(CONSENT_GRANT_STATUSES);

export function isMvpContextMode(contextMode) {
  return MVP_CONTEXT_MODE_SET.has(contextMode);
}

export function createResourceRef({
  connector,
  resourceId,
  resourceType,
  displayName,
  externalUrl
}) {
  return {
    connector,
    resourceId,
    resourceType,
    ...(displayName === undefined ? {} : { displayName }),
    ...(externalUrl === undefined ? {} : { externalUrl })
  };
}

export function createContextConsentGrantRef({
  grantId,
  tenantId,
  userId,
  provider,
  contextMode,
  resourceRef,
  workspaceBoundary,
  scopes,
  status,
  grantedAt,
  revokedAt,
  expiresAt
}) {
  return {
    grantId,
    tenantId,
    userId,
    provider,
    contextMode,
    ...(resourceRef === undefined ? {} : { resourceRef }),
    ...(workspaceBoundary === undefined ? {} : { workspaceBoundary }),
    scopes,
    status,
    grantedAt,
    ...(revokedAt === undefined ? {} : { revokedAt }),
    expiresAt
  };
}

export function validateContextConsentGrantRef(grant, field = "contextConsentGrant") {
  const issues = [
    ...requireRecord(grant, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(grant.grantId, `${field}.grantId`),
    ...requireString(grant.tenantId, `${field}.tenantId`),
    ...requireString(grant.userId, `${field}.userId`),
    ...requireEnum(grant.provider, `${field}.provider`, CONNECTOR_SET),
    ...requireEnum(grant.contextMode, `${field}.contextMode`, CONTEXT_MODE_SET),
    ...requireArray(grant.scopes, `${field}.scopes`),
    ...requireEnum(grant.status, `${field}.status`, CONSENT_GRANT_STATUS_SET),
    ...requireString(grant.grantedAt, `${field}.grantedAt`, { isoTimestamp: true }),
    ...requireString(grant.revokedAt, `${field}.revokedAt`, {
      isoTimestamp: true,
      optional: true
    }),
    ...requireString(grant.expiresAt, `${field}.expiresAt`, { isoTimestamp: true })
  );

  if (Array.isArray(grant.scopes)) {
    for (const [index, scope] of grant.scopes.entries()) {
      issues.push(...requireString(scope, `${field}.scopes.${index}`));
    }
  }

  const hasResourceRef = grant.resourceRef !== undefined;
  const hasWorkspaceBoundary = grant.workspaceBoundary !== undefined;

  if (!hasResourceRef && !hasWorkspaceBoundary) {
    issues.push(
      issue(
        field,
        VALIDATION_ISSUE_CODES.REQUIRED,
        `${field}.resourceRef or ${field}.workspaceBoundary is required`
      )
    );
  }

  if (hasResourceRef && hasWorkspaceBoundary) {
    issues.push(
      issue(
        field,
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        `${field} must include only one consent boundary`
      )
    );
  }

  if (hasResourceRef) {
    issues.push(...validateResourceRef(grant.resourceRef, `${field}.resourceRef`).issues);
  }

  if (hasWorkspaceBoundary) {
    issues.push(...requireRecord(grant.workspaceBoundary, `${field}.workspaceBoundary`));
  }

  return validationResult(issues);
}

export function validateResourceRef(resourceRef, field = "resourceRef") {
  const issues = [
    ...requireRecord(resourceRef, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(resourceRef.connector, `${field}.connector`, CONNECTOR_SET),
    ...requireString(resourceRef.resourceId, `${field}.resourceId`),
    ...requireString(resourceRef.resourceType, `${field}.resourceType`),
    ...requireString(resourceRef.displayName, `${field}.displayName`, { optional: true }),
    ...requireString(resourceRef.externalUrl, `${field}.externalUrl`, { optional: true })
  );

  return validationResult(issues);
}

export function createProvenance({
  sourceType,
  trustLevel,
  connector,
  resourceId,
  resourceVersion,
  selectionAnchor,
  capturedAt,
  clientSupplied,
  connectorVerified
}) {
  return {
    sourceType,
    trustLevel,
    connector,
    resourceId,
    ...(resourceVersion === undefined ? {} : { resourceVersion }),
    ...(selectionAnchor === undefined ? {} : { selectionAnchor }),
    capturedAt,
    clientSupplied,
    connectorVerified
  };
}

export function validateProvenance(provenance, field = "provenance") {
  const issues = [
    ...requireRecord(provenance, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireEnum(provenance.sourceType, `${field}.sourceType`, CONTEXT_SOURCE_TYPE_SET),
    ...requireEnum(provenance.trustLevel, `${field}.trustLevel`, CONTEXT_TRUST_LEVEL_SET),
    ...requireEnum(provenance.connector, `${field}.connector`, CONNECTOR_SET),
    ...requireString(provenance.resourceId, `${field}.resourceId`),
    ...requireString(provenance.resourceVersion, `${field}.resourceVersion`, { optional: true }),
    ...requireString(provenance.capturedAt, `${field}.capturedAt`, { isoTimestamp: true }),
    ...requireBoolean(provenance.clientSupplied, `${field}.clientSupplied`),
    ...requireBoolean(provenance.connectorVerified, `${field}.connectorVerified`)
  );

  return validationResult(issues);
}

export function createNormalizedContext({
  contextId,
  tenantId,
  userId,
  sessionId,
  provider,
  resourceRef,
  contextMode,
  sourceType,
  trustLevel,
  content,
  contentHash,
  anchors = [],
  resourceRevision,
  metadata = {},
  provenance,
  capturedAt,
  expiresAt
}) {
  return {
    contextId,
    tenantId,
    userId,
    sessionId,
    provider,
    resourceRef,
    contextMode,
    sourceType,
    trustLevel,
    content,
    contentHash,
    anchors,
    ...(resourceRevision === undefined ? {} : { resourceRevision }),
    metadata,
    provenance,
    capturedAt,
    expiresAt
  };
}

export function validateNormalizedContext(context) {
  const issues = [
    ...requireRecord(context, "context")
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireString(context.contextId, "contextId"),
    ...requireString(context.tenantId, "tenantId"),
    ...requireString(context.userId, "userId"),
    ...requireString(context.sessionId, "sessionId"),
    ...requireEnum(context.provider, "provider", CONNECTOR_SET),
    ...validateResourceRef(context.resourceRef).issues,
    ...requireEnum(context.contextMode, "contextMode", CONTEXT_MODE_SET),
    ...requireEnum(context.sourceType, "sourceType", CONTEXT_SOURCE_TYPE_SET),
    ...requireEnum(context.trustLevel, "trustLevel", CONTEXT_TRUST_LEVEL_SET),
    ...requireString(context.content, "content"),
    ...requireString(context.contentHash, "contentHash"),
    ...requireArray(context.anchors, "anchors"),
    ...requireString(context.resourceRevision, "resourceRevision", { optional: true }),
    ...validateProvenance(context.provenance).issues,
    ...requireString(context.capturedAt, "capturedAt", { isoTimestamp: true }),
    ...requireString(context.expiresAt, "expiresAt", { isoTimestamp: true })
  );

  return validationResult(issues);
}
