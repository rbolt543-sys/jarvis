import type { Integration, IntegrationEvent } from "./types";
import type { ToolDefinition } from "@/providers/types";

export const memberVaultIntegration: Integration = {
  id: "membervault",
  async connect(_creds) {
    // TODO Phase 1: store API key in Keychain, hit a noop endpoint to validate.
  },
  listTools(): ToolDefinition[] {
    return [
      // TODO Phase 1: get_gob_student_count, get_recent_enrollments, get_completion_rate
    ];
  },
  async handleWebhook(_payload): Promise<IntegrationEvent[]> {
    // TODO Phase 1: new_purchase, refund
    return [];
  },
  async poll(): Promise<IntegrationEvent[]> {
    // TODO Phase 1: daily student-progress sync (API endpoints not all webhook-backed)
    return [];
  },
};
