$version: "2"

namespace ai.assist.context

use ai.assist.connectors#Connector
use ai.assist.common#Timestamp

@documentation("Context modes. MVP services support SELECTION and ACTIVE_RESOURCE.")
enum ContextMode {
    SELECTION
    ACTIVE_RESOURCE
    VISIBLE_REGION
    WORKSPACE
    SCREEN
}

@documentation("Context source type values shared by connector and orchestration boundaries.")
enum ContextSourceType {
    @enumValue("client_selection_text")
    CLIENT_SELECTION_TEXT

    @enumValue("connector_selection")
    CONNECTOR_SELECTION

    @enumValue("connector_resource_excerpt")
    CONNECTOR_RESOURCE_EXCERPT

    @enumValue("connector_visible_region")
    CONNECTOR_VISIBLE_REGION

    @enumValue("connector_workspace_excerpt")
    CONNECTOR_WORKSPACE_EXCERPT

    @enumValue("screen_capture")
    SCREEN_CAPTURE
}

@documentation("Trust level used to separate client-supplied context from connector-verified mutation authority.")
enum ContextTrustLevel {
    @enumValue("client_supplied")
    CLIENT_SUPPLIED

    @enumValue("connector_verified")
    CONNECTOR_VERIFIED

    @enumValue("system_verified")
    SYSTEM_VERIFIED
}

enum ConsentGrantStatus {
    @enumValue("active")
    ACTIVE

    @enumValue("revoked")
    REVOKED

    @enumValue("expired")
    EXPIRED
}

list ScopeList {
    member: String
}

@documentation("Connector resource reference without raw content.")
structure ResourceRef {
    @required
    connector: Connector

    @required
    resourceId: String

    @required
    resourceType: String

    displayName: String
    externalUrl: String
}

@documentation("Metadata-only consent grant reference used before context capture. Exactly one boundary should be present: resourceRef or workspaceBoundary.")
structure ContextConsentGrantRef {
    @required
    grantId: String

    @required
    tenantId: String

    @required
    userId: String

    @required
    provider: Connector

    @required
    contextMode: ContextMode

    resourceRef: ResourceRef
    workspaceBoundary: Document

    @required
    scopes: ScopeList

    @required
    status: ConsentGrantStatus

    @required
    grantedAt: Timestamp

    revokedAt: Timestamp

    @required
    expiresAt: Timestamp
}

@documentation("Context provenance. Write-back requires connectorVerified=true with trusted connector metadata.")
structure Provenance {
    @required
    sourceType: ContextSourceType

    @required
    trustLevel: ContextTrustLevel

    @required
    connector: Connector

    @required
    resourceId: String

    resourceVersion: String
    selectionAnchor: Document

    @required
    capturedAt: Timestamp

    @required
    clientSupplied: Boolean

    @required
    connectorVerified: Boolean
}

@documentation("Normalized context shape. The content field carries user content and must not be logged.")
structure NormalizedContext {
    @required
    contextId: String

    @required
    tenantId: String

    @required
    userId: String

    @required
    sessionId: String

    @required
    provider: Connector

    @required
    resourceRef: ResourceRef

    @required
    contextMode: ContextMode

    @required
    sourceType: ContextSourceType

    @required
    trustLevel: ContextTrustLevel

    @required
    content: String

    @required
    contentHash: String

    @required
    anchors: Document

    resourceRevision: String
    metadata: Document

    @required
    provenance: Provenance

    @required
    capturedAt: Timestamp

    @required
    expiresAt: Timestamp
}
