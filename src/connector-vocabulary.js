import {
  enumSet,
  freezeValues
} from "./validation.js";

export const CONNECTORS = freezeValues({
  GOOGLE_DOCS: "google_docs"
});

export const CONNECTOR_SET = enumSet(CONNECTORS);
