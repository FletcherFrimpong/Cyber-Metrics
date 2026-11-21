// Every connector the platform offers. Add a new one here.

import type { ConnectorDefinition } from "./types";
import { defenderConnector } from "./defender.ts";
import { sentinelConnector } from "./sentinel.ts";
import { splunkConnector } from "./splunk.ts";
import { qradarConnector } from "./qradar.ts";
import { elasticConnector } from "./elastic.ts";
import { crowdStrikeConnector } from "./crowdstrike.ts";
import { sentinelOneConnector } from "./sentinelone.ts";
import { cortexConnector } from "./cortex.ts";

export const CONNECTORS: ConnectorDefinition[] = [
  // Log sources: aggregate many tools, cover every category
  defenderConnector,
  sentinelConnector,
  splunkConnector,
  qradarConnector,
  elasticConnector,
  // Direct tool connections
  crowdStrikeConnector,
  sentinelOneConnector,
  cortexConnector,
];

export function getConnector(id: unknown): ConnectorDefinition | undefined {
  return CONNECTORS.find((c) => c.id === id);
}
