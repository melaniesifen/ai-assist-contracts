export class ContractValidationError extends Error {
  constructor(contractName, issues) {
    super(`${contractName} validation failed`);
    this.name = "ContractValidationError";
    this.contractName = contractName;
    this.issues = issues;
  }
}

export const VALIDATION_ISSUE_CODES = Object.freeze({
  REQUIRED: "required",
  TYPE: "type",
  ENUM: "enum",
  FORMAT: "format",
  RANGE: "range",
  UNSUPPORTED: "unsupported"
});

export function freezeValues(values) {
  return Object.freeze({ ...values });
}

export function valuesOf(values) {
  return Object.freeze(Object.values(values));
}

export function enumSet(values) {
  return new Set(Object.values(values));
}

export function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isIsoTimestamp(value) {
  if (!isNonEmptyString(value)) {
    return false;
  }

  const parsedMs = Date.parse(value);
  return Number.isFinite(parsedMs) && new Date(parsedMs).toISOString() === value;
}

export function issue(field, code, message) {
  return { field, code, message };
}

export function validationResult(issues) {
  return {
    valid: issues.length === 0,
    issues
  };
}

export function assertValid(contractName, result) {
  if (!result.valid) {
    throw new ContractValidationError(contractName, result.issues);
  }
}

export function requireRecord(value, contractName = "value") {
  if (!isRecord(value)) {
    return [
      issue(contractName, VALIDATION_ISSUE_CODES.TYPE, `${contractName} must be an object`)
    ];
  }
  return [];
}

export function requireString(value, field, options = {}) {
  const {
    nonEmpty = true,
    isoTimestamp = false,
    optional = false
  } = options;

  if (value === undefined || value === null) {
    return optional
      ? []
      : [issue(field, VALIDATION_ISSUE_CODES.REQUIRED, `${field} is required`)];
  }

  if (typeof value !== "string") {
    return [issue(field, VALIDATION_ISSUE_CODES.TYPE, `${field} must be a string`)];
  }

  if (nonEmpty && value.trim().length === 0) {
    return [issue(field, VALIDATION_ISSUE_CODES.FORMAT, `${field} must not be blank`)];
  }

  if (isoTimestamp && !isIsoTimestamp(value)) {
    return [issue(field, VALIDATION_ISSUE_CODES.FORMAT, `${field} must be an ISO timestamp`)];
  }

  return [];
}

export function requireEnum(value, field, allowedValues, options = {}) {
  const { optional = false } = options;

  if (value === undefined || value === null) {
    return optional
      ? []
      : [issue(field, VALIDATION_ISSUE_CODES.REQUIRED, `${field} is required`)];
  }

  if (!allowedValues.has(value)) {
    return [
      issue(
        field,
        VALIDATION_ISSUE_CODES.ENUM,
        `${field} must be one of: ${Array.from(allowedValues).join(", ")}`
      )
    ];
  }

  return [];
}

export function requireInteger(value, field, options = {}) {
  const { min, optional = false } = options;

  if (value === undefined || value === null) {
    return optional
      ? []
      : [issue(field, VALIDATION_ISSUE_CODES.REQUIRED, `${field} is required`)];
  }

  if (!Number.isInteger(value)) {
    return [issue(field, VALIDATION_ISSUE_CODES.TYPE, `${field} must be an integer`)];
  }

  if (min !== undefined && value < min) {
    return [issue(field, VALIDATION_ISSUE_CODES.RANGE, `${field} must be >= ${min}`)];
  }

  return [];
}

export function requireBoolean(value, field, options = {}) {
  const { optional = false } = options;

  if (value === undefined || value === null) {
    return optional
      ? []
      : [issue(field, VALIDATION_ISSUE_CODES.REQUIRED, `${field} is required`)];
  }

  if (typeof value !== "boolean") {
    return [issue(field, VALIDATION_ISSUE_CODES.TYPE, `${field} must be a boolean`)];
  }

  return [];
}

export function requireArray(value, field, options = {}) {
  const { optional = false } = options;

  if (value === undefined || value === null) {
    return optional
      ? []
      : [issue(field, VALIDATION_ISSUE_CODES.REQUIRED, `${field} is required`)];
  }

  if (!Array.isArray(value)) {
    return [issue(field, VALIDATION_ISSUE_CODES.TYPE, `${field} must be an array`)];
  }

  return [];
}
