// Every connector the platform offers. Add a new one here.

import type { ConnectorDefinition } from "./types";
import { splunkConnector } from "./splunk.ts";
import { crowdStrikeConnector } from "./crowdstrike.ts";
import { sentinelOneConnector } from "./sentinelone.ts";

export const CONNECTORS: ConnectorDefinition[] = [splunkConnector, crowdStrikeConnector, sentinelOneConnector];

export function getConnector(id: unknown): ConnectorDefinition | undefined {
  return CONNECTORS.find((c) => c.id === id);
}
