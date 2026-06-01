$version: "2"

namespace ai.assist.commands

use ai.assist.common#ContractError
use ai.assist.common#ContractVersionRef
use ai.assist.common#IdentityScope

enum HttpCommandType {
    @enumValue("auth.oauth.start")
    START_OAUTH

    @enumValue("auth.oauth.complete")
    COMPLETE_OAUTH

    @enumValue("secrets.provider_key.validate")
    VALIDATE_PROVIDER_KEY

    @enumValue("resources.session.create")
    CREATE_RESOURCE_SESSION

    @enumValue("context.preview")
    PREVIEW_CONTEXT

    @enumValue("assistant.command.create")
    CREATE_ASSISTANT_COMMAND

    @enumValue("actions.approve")
    APPROVE_ACTION

    @enumValue("actions.reject")
    REJECT_ACTION

    @enumValue("actions.apply")
    APPLY_ACTION
}

enum HttpCommandResponseStatus {
    @enumValue("accepted")
    ACCEPTED

    @enumValue("completed")
    COMPLETED

    @enumValue("rejected")
    REJECTED
}

structure HttpCommandRequest {
    @required
    contractVersion: ContractVersionRef

    @required
    commandId: String

    @required
    commandType: HttpCommandType

    @required
    identityScope: IdentityScope

    idempotencyKey: String

    @required
    payload: Document
}

structure HttpCommandResponse {
    @required
    contractVersion: ContractVersionRef

    @required
    requestId: String

    @required
    correlationId: String

    @required
    commandId: String

    @required
    commandType: HttpCommandType

    @required
    status: HttpCommandResponseStatus

    result: Document
    error: ContractError
}

structure ActionDecisionCommandPayload {
    @required
    sessionId: String

    @required
    actionId: String

    reasonCode: String
}

structure ApplyActionCommandPayload {
    @required
    sessionId: String

    @required
    actionId: String
}
