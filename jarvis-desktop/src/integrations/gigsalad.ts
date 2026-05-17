import type { Integration } from "./types";

export const gigSaladIntegration: Integration = {
  id: "gigsalad",
  async connect(_creds) {
    // TODO Phase 2: GigSalad has no public API — decide ingestion path
    // (email-forward parser vs browser automation). See PRD §11.
  },
  listTools() {
    return [];
  },
};
