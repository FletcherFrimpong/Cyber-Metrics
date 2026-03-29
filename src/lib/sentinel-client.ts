// Sentinel API Client
// Fetches resolved incidents from Microsoft Sentinel via the Graph Security API.
// Uses standard OAuth2 client_credentials flow — no Azure SDK dependency.

import type { SentinelConfig } from "./sentinel-config";
import type { SentinelIncident, GraphSecurityAlert } from "./sentinel-category-mapper";
import { DepartmentResolver } from "./department-resolver";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export class SentinelClient {
  private config: SentinelConfig;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;
  private departmentResolver: DepartmentResolver;

  constructor(config: SentinelConfig) {
    this.config = config;
    this.departmentResolver = new DepartmentResolver(() => this.getToken());
  }

  // OAuth2 client_credentials flow — no SDK needed
  private async getToken(): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 60000) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Azure AD token request failed (${response.status}): ${body}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;
    return this.accessToken!;
  }

  // Make an authenticated GET request to Graph API with pagination
  private async graphGet<T>(url: string): Promise<T[]> {
    const token = await this.getToken();
    const results: T[] = [];
    let nextUrl: string | null = url;

    while (nextUrl) {
      const response = await fetch(nextUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Graph API ${response.status}: ${body}`);
      }

      const data = await response.json();
      if (data.value) results.push(...data.value);
      nextUrl = data["@odata.nextLink"] || null;
    }

    return results;
  }

  // ─── FETCH RESOLVED INCIDENTS ──────────────────────────────────────────────

  async getResolvedIncidents(since?: string, limit?: number): Promise<SentinelIncident[]> {
    let filter = "status eq 'resolved'";
    if (since) {
      filter += ` and lastModifiedDateTime ge ${since}`;
    }

    let url = `${GRAPH_BASE}/security/incidents?$filter=${encodeURIComponent(filter)}&$orderby=lastModifiedDateTime desc`;
    if (limit) url += `&$top=${limit}`;

    return this.graphGet<SentinelIncident>(url);
  }

  // ─── FETCH ALERTS FOR AN INCIDENT ──────────────────────────────────────────

  async getIncidentAlerts(incidentId: string): Promise<GraphSecurityAlert[]> {
    const url = `${GRAPH_BASE}/security/incidents/${incidentId}/alerts`;
    return this.graphGet<GraphSecurityAlert>(url);
  }

  // ─── FETCH RESOLVED INCIDENTS WITH THEIR ALERTS ────────────────────────────

  async getResolvedIncidentsWithAlerts(since?: string, limit?: number): Promise<SentinelIncident[]> {
    const incidents = await this.getResolvedIncidents(since, limit);

    // Fetch alerts in parallel (batches of 10)
    const batchSize = 10;
    for (let i = 0; i < incidents.length; i += batchSize) {
      const batch = incidents.slice(i, i + batchSize);
      const alertResults = await Promise.all(
        batch.map(inc =>
          this.getIncidentAlerts(inc.id).catch(err => {
            console.warn(`Failed to fetch alerts for incident ${inc.id}:`, err);
            return [] as GraphSecurityAlert[];
          })
        )
      );
      batch.forEach((inc, idx) => {
        inc.alerts = alertResults[idx];
      });
    }

    return incidents;
  }

  // ─── DEPARTMENT RESOLUTION ──────────────────────────────────────────────────
  // Resolves department for each alert's evidence via Azure AD user/device lookup.

  async resolveAlertDepartment(alert: GraphSecurityAlert): Promise<string> {
    const evidence = (alert.evidence || []).map(ev => ({
      userPrincipalName: (ev as any).userPrincipalName,
      accountName: (ev as any).accountName,
      deviceDnsName: (ev as any).deviceDnsName,
      deviceName: (ev as any).displayName,
      displayName: ev.displayName,
    }));
    const result = await this.departmentResolver.resolve(evidence);
    return result.department;
  }

  async resolveIncidentDepartments(incident: SentinelIncident): Promise<Map<string, string>> {
    // Returns alertId → department map
    const result = new Map<string, string>();
    if (!incident.alerts) return result;

    for (const alert of incident.alerts) {
      const dept = await this.resolveAlertDepartment(alert);
      result.set(alert.id, dept);
    }
    return result;
  }

  getDepartmentStats() {
    return this.departmentResolver.getCacheStats();
  }

  // ─── HEALTH CHECK ──────────────────────────────────────────────────────────

  async healthCheck(): Promise<{ ok: boolean; error?: string }> {
    try {
      const token = await this.getToken();
      const response = await fetch(`${GRAPH_BASE}/security/incidents?$top=1`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.text();
        return { ok: false, error: `Graph API returned ${response.status}: ${body}` };
      }

      return { ok: true };
    } catch (err: any) {
      return { ok: false, error: err.message };
    }
  }
}
