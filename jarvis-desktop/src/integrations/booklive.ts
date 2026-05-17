import type { Integration } from "./types";

export const bookLiveIntegration: Integration = {
  id: "booklive",
  async connect(_creds) {
    // TODO Phase 2: confirm BookLive API access path (public API vs partner).
  },
  listTools() {
    return [];
  },
};
