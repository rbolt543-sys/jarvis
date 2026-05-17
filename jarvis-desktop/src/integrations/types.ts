// Integration interface — one adapter per external service.
// Phase 1 adapters: Stripe, Member Vault.
// Phase 2 adapters: BookLive, GigSalad.

import type { ToolDefinition } from "@/providers/types";

export interface Integration {
  id: string;
  connect(creds: Credentials): Promise<void>;
  listTools(): ToolDefinition[];
  handleWebhook?(payload: unknown): Promise<IntegrationEvent[]>;
  poll?(): Promise<IntegrationEvent[]>;
}

export interface Credentials {
  [key: string]: string;
}

export interface IntegrationEvent {
  source: string;
  kind: string;
  occurredAt: string;
  payload: unknown;
}
