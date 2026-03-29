// Department Resolver
// Resolves which department an alert belongs to by looking up users/devices
// in Azure AD via the Graph API.
//
// Resolution order:
//   1. userPrincipalName from alert evidence → GET /users/{upn} → department field
//   2. deviceName from alert evidence → GET /devices (filter displayName) → registered owner → department
//   3. Fallback: "Unattributed"
//
// Caches user→department mappings to avoid repeated lookups.
// Requires: User.Read.All and Device.Read.All permissions on the App Registration.

export interface DepartmentInfo {
  department: string;
  resolvedFrom: "user" | "device" | "fallback";
  userPrincipalName?: string;
  deviceName?: string;
}

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export class DepartmentResolver {
  private tokenFn: () => Promise<string>;

  // Cache: UPN → department (users rarely change departments)
  private userCache = new Map<string, string>();
  // Cache: deviceName → department
  private deviceCache = new Map<string, string>();
  // Cache TTL: 24 hours (departments don't change often)
  private cacheTTL = 24 * 60 * 60 * 1000;
  private cacheTimestamp = 0;

  constructor(tokenFn: () => Promise<string>) {
    this.tokenFn = tokenFn;
  }

  // ─── MAIN RESOLVE ──────────────────────────────────────────────────────────
  // Takes alert evidence and resolves the department.

  async resolve(evidence: AlertEvidence[]): Promise<DepartmentInfo> {
    this.checkCacheExpiry();

    // Try user-based resolution first
    for (const ev of evidence) {
      const upn = ev.userPrincipalName || ev.accountName;
      if (upn) {
        const dept = await this.resolveFromUser(upn);
        if (dept) {
          return { department: dept, resolvedFrom: "user", userPrincipalName: upn };
        }
      }
    }

    // Try device-based resolution
    for (const ev of evidence) {
      const deviceName = ev.deviceDnsName || ev.deviceName;
      if (deviceName) {
        const dept = await this.resolveFromDevice(deviceName);
        if (dept) {
          return { department: dept, resolvedFrom: "device", deviceName };
        }
      }
    }

    return { department: "Unattributed", resolvedFrom: "fallback" };
  }

  // ─── USER LOOKUP ───────────────────────────────────────────────────────────

  private async resolveFromUser(upn: string): Promise<string | null> {
    // Check cache
    if (this.userCache.has(upn)) {
      return this.userCache.get(upn)!;
    }

    try {
      const token = await this.tokenFn();
      const response = await fetch(
        `${GRAPH_BASE}/users/${encodeURIComponent(upn)}?$select=department,displayName`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          // User not found — cache as empty to avoid retrying
          this.userCache.set(upn, "");
          return null;
        }
        return null;
      }

      const user = await response.json();
      const department = user.department || "";
      this.userCache.set(upn, department);
      return department || null;
    } catch (err) {
      console.warn(`Department resolver: failed to look up user ${upn}:`, err);
      return null;
    }
  }

  // ─── DEVICE LOOKUP ─────────────────────────────────────────────────────────
  // Look up device → registered owner → owner's department

  private async resolveFromDevice(deviceName: string): Promise<string | null> {
    if (this.deviceCache.has(deviceName)) {
      const cached = this.deviceCache.get(deviceName)!;
      return cached || null;
    }

    try {
      const token = await this.tokenFn();

      // Find the device by display name
      const deviceRes = await fetch(
        `${GRAPH_BASE}/devices?$filter=displayName eq '${encodeURIComponent(deviceName)}'&$select=id,displayName`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!deviceRes.ok) {
        this.deviceCache.set(deviceName, "");
        return null;
      }

      const deviceData = await deviceRes.json();
      const device = deviceData.value?.[0];
      if (!device) {
        this.deviceCache.set(deviceName, "");
        return null;
      }

      // Get registered owners of the device
      const ownerRes = await fetch(
        `${GRAPH_BASE}/devices/${device.id}/registeredOwners?$select=id,userPrincipalName`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!ownerRes.ok) {
        this.deviceCache.set(deviceName, "");
        return null;
      }

      const ownerData = await ownerRes.json();
      const owner = ownerData.value?.[0];
      if (!owner?.userPrincipalName) {
        this.deviceCache.set(deviceName, "");
        return null;
      }

      // Now look up the owner's department
      const dept = await this.resolveFromUser(owner.userPrincipalName);
      this.deviceCache.set(deviceName, dept || "");
      return dept;
    } catch (err) {
      console.warn(`Department resolver: failed to look up device ${deviceName}:`, err);
      this.deviceCache.set(deviceName, "");
      return null;
    }
  }

  // ─── BATCH RESOLVE ─────────────────────────────────────────────────────────
  // Resolve departments for multiple alerts at once. Batches user lookups.

  async resolveBatch(alertsEvidence: AlertEvidence[][]): Promise<DepartmentInfo[]> {
    // Collect all unique UPNs and device names first
    const upns = new Set<string>();
    const devices = new Set<string>();

    for (const evidence of alertsEvidence) {
      for (const ev of evidence) {
        if (ev.userPrincipalName || ev.accountName) {
          upns.add(ev.userPrincipalName || ev.accountName || "");
        }
        if (ev.deviceDnsName || ev.deviceName) {
          devices.add(ev.deviceDnsName || ev.deviceName || "");
        }
      }
    }

    // Pre-warm user cache with batch lookup
    const uncachedUpns = [...upns].filter(u => u && !this.userCache.has(u));
    if (uncachedUpns.length > 0) {
      await this.batchLookupUsers(uncachedUpns);
    }

    // Now resolve each alert (mostly from cache)
    const results: DepartmentInfo[] = [];
    for (const evidence of alertsEvidence) {
      results.push(await this.resolve(evidence));
    }
    return results;
  }

  // Batch user lookup using $filter with 'or' (up to 15 at a time per Graph limit)
  private async batchLookupUsers(upns: string[]): Promise<void> {
    const batchSize = 15;
    for (let i = 0; i < upns.length; i += batchSize) {
      const batch = upns.slice(i, i + batchSize);
      try {
        const token = await this.tokenFn();
        const filter = batch
          .map(upn => `userPrincipalName eq '${encodeURIComponent(upn)}'`)
          .join(" or ");

        const response = await fetch(
          `${GRAPH_BASE}/users?$filter=${encodeURIComponent(filter)}&$select=userPrincipalName,department`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const foundUpns = new Set<string>();
          for (const user of data.value || []) {
            this.userCache.set(user.userPrincipalName, user.department || "");
            foundUpns.add(user.userPrincipalName);
          }
          // Mark unfound users as empty
          for (const upn of batch) {
            if (!foundUpns.has(upn)) {
              this.userCache.set(upn, "");
            }
          }
        }
      } catch (err) {
        console.warn("Department resolver: batch user lookup failed:", err);
      }
    }
  }

  // ─── CACHE MANAGEMENT ──────────────────────────────────────────────────────

  private checkCacheExpiry(): void {
    if (Date.now() - this.cacheTimestamp > this.cacheTTL) {
      this.userCache.clear();
      this.deviceCache.clear();
      this.cacheTimestamp = Date.now();
    }
  }

  getCacheStats() {
    return {
      users: this.userCache.size,
      devices: this.deviceCache.size,
      departments: [...new Set([...this.userCache.values(), ...this.deviceCache.values()])].filter(Boolean),
    };
  }
}

// Evidence structure from Graph Security API alerts
export interface AlertEvidence {
  displayName?: string;
  type?: string;
  userPrincipalName?: string;
  accountName?: string;
  deviceDnsName?: string;
  deviceName?: string;
  deviceDetail?: { operatingSystem?: string };
  ipAddress?: string;
  url?: string;
  fileName?: string;
}
