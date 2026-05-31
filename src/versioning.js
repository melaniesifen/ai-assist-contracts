import { ERROR_CATEGORIES, STANDARD_ERROR_CODES, createContractError } from "./errors.js";
import {
  issue,
  requireInteger,
  requireRecord,
  VALIDATION_ISSUE_CODES,
  validationResult
} from "./validation.js";

export const CONTRACT_VERSION = Object.freeze({
  MAJOR: 0,
  MINOR: 1,
  PATCH: 0,
  VERSION: "0.1.0"
});

export const SUPPORTED_CONTRACT_VERSION_RANGE = Object.freeze({
  minMajor: CONTRACT_VERSION.MAJOR,
  maxMajor: CONTRACT_VERSION.MAJOR
});

export function createContractVersionRef({
  major = CONTRACT_VERSION.MAJOR,
  minor = CONTRACT_VERSION.MINOR,
  patch = CONTRACT_VERSION.PATCH
} = {}) {
  return {
    major,
    minor,
    patch
  };
}

export function validateContractVersionRef(versionRef, field = "contractVersion") {
  const issues = [
    ...requireRecord(versionRef, field)
  ];
  if (issues.length > 0) {
    return validationResult(issues);
  }

  issues.push(
    ...requireInteger(versionRef.major, `${field}.major`, { min: 0 }),
    ...requireInteger(versionRef.minor, `${field}.minor`, { min: 0 }),
    ...requireInteger(versionRef.patch, `${field}.patch`, { min: 0 })
  );

  return validationResult(issues);
}

export function isSupportedContractVersion(versionRef) {
  if (!validateContractVersionRef(versionRef).valid) {
    return false;
  }

  return (
    versionRef.major >= SUPPORTED_CONTRACT_VERSION_RANGE.minMajor &&
    versionRef.major <= SUPPORTED_CONTRACT_VERSION_RANGE.maxMajor
  );
}

export function validateSupportedContractVersion(versionRef, field = "contractVersion") {
  const structural = validateContractVersionRef(versionRef, field);
  if (!structural.valid) {
    return structural;
  }

  if (!isSupportedContractVersion(versionRef)) {
    return validationResult([
      issue(
        field,
        VALIDATION_ISSUE_CODES.UNSUPPORTED,
        `${field} major version is not supported`
      )
    ]);
  }

  return validationResult([]);
}

export function createUnsupportedContractVersionError({ target = "contractVersion" } = {}) {
  return createContractError({
    code: STANDARD_ERROR_CODES.UNSUPPORTED_CONTRACT_VERSION,
    category: ERROR_CATEGORIES.VALIDATION,
    message: "Contract version is not supported.",
    retryable: false,
    httpStatus: 400,
    target
  });
}
