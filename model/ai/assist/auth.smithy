$version: "2"

namespace ai.assist.auth

use ai.assist.common#ContractError

@documentation("Distinct product credential error kinds mapped by the JavaScript bootstrap helpers.")
enum ProductCredentialErrorKind {
    UNAUTHORIZED
    EXPIRED
    MALFORMED
}

@documentation("Metadata-only product credential error response.")
structure ProductCredentialError {
    @required
    kind: ProductCredentialErrorKind

    @required
    error: ContractError
}
