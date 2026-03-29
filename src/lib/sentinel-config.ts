// Sentinel Configuration
// Reads Azure AD credentials and workspace settings from environment variables.
// These are server-side only — no NEXT_PUBLIC_ prefix.

export interface SentinelConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  // Optional: for ARM SDK path (workspace-scoped queries)
  workspaceId?: string;
  resourceGroup?: string;
  workspaceName?: string;
  subscriptionId?: string;
  // Polling
  pollingIntervalMs: number;
  // Webhook
  webhookSecret?: string;
}

export function getSentinelConfig(): SentinelConfig | null {
  const tenantId = process.env.SENTINEL_TENANT_ID;
  const clientId = process.env.SENTINEL_CLIENT_ID;
  const clientSecret = process.env.SENTINEL_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    return null;
  }

  return {
    tenantId,
    clientId,
    clientSecret,
    workspaceId: process.env.SENTINEL_WORKSPACE_ID,
    resourceGroup: process.env.SENTINEL_RESOURCE_GROUP,
    workspaceName: process.env.SENTINEL_WORKSPACE_NAME,
    subscriptionId: process.env.SENTINEL_SUBSCRIPTION_ID,
    pollingIntervalMs: parseInt(process.env.SENTINEL_POLLING_INTERVAL || '900000', 10), // 15 min default
    webhookSecret: process.env.SENTINEL_WEBHOOK_SECRET,
  };
}

export function isSentinelConfigured(): boolean {
  return !!(
    process.env.SENTINEL_TENANT_ID &&
    process.env.SENTINEL_CLIENT_ID &&
    process.env.SENTINEL_CLIENT_SECRET
  );
}
