$version: "2"

namespace ai.assist.actions

use ai.assist.connectors#Connector
use ai.assist.common#NonNegativeInteger
use ai.assist.common#Timestamp
use ai.assist.context#ResourceRef

enum ProposedActionType {
    REPLACE_TEXT
    INSERT_TEXT
}

enum ProposedActionStatus {
    PROPOSED
    APPROVED
    APPLIED
    REJECTED
    EXPIRED
    CONFLICTED
    FAILED
}

structure ActionTargetRange {
    @required
    start: NonNegativeInteger

    @required
    end: NonNegativeInteger
}

structure ActionTargetAnchor {
    @required
    connector: Connector

    @required
    anchorId: String

    resourceRevision: String
}

union ProposedActionTarget {
    targetAnchor: ActionTargetAnchor
    targetRange: ActionTargetRange
}

@documentation("Metadata-only proposed action reference. Sensitive action payloads remain encrypted outside this shape.")
structure ProposedActionRef {
    @required
    actionId: String

    @required
    tenantId: String

    @required
    userId: String

    @required
    sessionId: String

    @required
    provider: Connector

    @required
    resourceId: String

    @required
    resourceRevision: String

    targetAnchor: ActionTargetAnchor
    targetRange: ActionTargetRange

    @required
    originalTextHash: String

    @required
    actionType: ProposedActionType

    @required
    status: ProposedActionStatus

    idempotencyKey: String

    @required
    createdAt: Timestamp

    @required
    updatedAt: Timestamp

    @required
    expiresAt: Timestamp
}

@documentation("User-visible review metadata for PR-style proposed edit cards. Text members carry active review content and must not be logged.")
structure ProposedActionReviewRef {
    @required
    actionId: String

    @required
    actionType: ProposedActionType

    @required
    status: ProposedActionStatus

    @required
    resourceRef: ResourceRef

    @required
    target: ProposedActionTarget

    @required
    originalTextHash: String

    currentText: String

    @required
    proposedText: String

    surroundingText: String

    @required
    rationale: String

    conflictReasonCode: String

    @required
    expiresAt: Timestamp
}
