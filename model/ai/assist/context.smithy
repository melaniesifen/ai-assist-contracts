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
    client_selection_text

    @enumValue("connector_selection")
    connector_selection

    @enumValue("connector_resource_excerpt")
    connector_resource_excerpt

    @enumValue("connector_visible_region")
    connector_visible_region

    @enumValue("connector_workspace_excerpt")
    connector_workspace_excerpt

    @enumValue("screen_capture")
    screen_capture
}

@documentation("Trust level used to separate client-supplied context from connector-verified mutation authority.")
enum ContextTrustLevel {
    @enumValue("client_supplied")
    client_supplied

    @enumValue("connector_verified")
    connector_verified

    @enumValue("system_verified")
    system_verified
}

enum ConsentGrantStatus {
    @enumValue("active")
    active

    @enumValue("revoked")
    revoked

    @enumValue("expired")
    expired
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
