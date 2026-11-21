// Which integration an alert id came from, by its prefix.

import { CONNECTORS } from "./registry.ts";

const DEMO = "Demo data";

export function integrationOf(alertId: string): string {
  const id = alertId || "";
  for (const c of CONNECTORS) if (id.startsWith(c.idPrefix)) return c.name;
  return DEMO;
}
