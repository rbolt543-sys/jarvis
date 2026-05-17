import type { Integration, IntegrationEvent } from "./types";
import type { ToolDefinition } from "@/providers/types";

export const stripeIntegration: Integration = {
  id: "stripe",
  async connect(_creds) {
    // TODO Phase 1: read restricted key from Keychain, validate via /v1/account.
  },
  listTools(): ToolDefinition[] {
    return [
      // TODO Phase 1: get_today_revenue, get_week_summary, list_recent_charges
      // TODO Phase 2: issue_refund (requires voice confirmation)
    ];
  },
  async handleWebhook(_payload): Promise<IntegrationEvent[]> {
    // TODO Phase 1: charge.succeeded, charge.refunded, charge.dispute.created
    return [];
  },
};
