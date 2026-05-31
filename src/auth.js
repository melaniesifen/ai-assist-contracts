import { ERROR_CATEGORIES, STANDARD_ERROR_CODES, createContractError } from "./errors.js";

export const PRODUCT_CREDENTIAL_ERROR_REFS = Object.freeze({
  UNAUTHORIZED: Object.freeze({
    code: STANDARD_ERROR_CODES.AUTHENTICATION_REQUIRED,
    category: ERROR_CATEGORIES.AUTHENTICATION,
    httpStatus: 401,
    retryable: false
  }),
  EXPIRED: Object.freeze({
    code: STANDARD_ERROR_CODES.AUTHENTICATION_EXPIRED,
    category: ERROR_CATEGORIES.AUTHENTICATION,
    httpStatus: 401,
    retryable: false
  }),
  MALFORMED: Object.freeze({
    code: STANDARD_ERROR_CODES.MALFORMED_PRODUCT_CREDENTIAL,
    category: ERROR_CATEGORIES.AUTHENTICATION,
    httpStatus: 400,
    retryable: false
  })
});

export function createProductCredentialError({ kind, message, target = "authorization" }) {
  const ref = PRODUCT_CREDENTIAL_ERROR_REFS[kind];
  if (ref === undefined) {
    return createContractError({
      code: STANDARD_ERROR_CODES.CONTRACT_VALIDATION_FAILED,
      category: ERROR_CATEGORIES.VALIDATION,
      message: `Unknown product credential error kind: ${kind}`,
      retryable: false,
      target: "kind"
    });
  }

  return createContractError({
    code: ref.code,
    category: ref.category,
    message,
    retryable: ref.retryable,
    httpStatus: ref.httpStatus,
    target
  });
}
