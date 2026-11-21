// Azure AD (Entra ID) client-credentials token, shared by the Microsoft connectors.

import { request, expectOk } from "./http.ts";
import type { ConnectorConfig } from "./types";

const LOGIN_URL = "https://login.microsoftonline.com";

/** scope is e.g. "https://graph.microsoft.com/.default". __loginUrl is a test hook. */
export async function getAzureToken(config: ConnectorConfig, scope: string): Promise<string> {
  // SF_MS_LOGIN_URL: sovereign clouds (e.g. https://login.microsoftonline.us) and test servers
  const base = config.__loginUrl || process.env.SF_MS_LOGIN_URL || LOGIN_URL;
  const res = expectOk(
    await request(`${base}/${encodeURIComponent(config.tenantId)}/oauth2/v2.0/token`, {
      form: {
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope,
        grant_type: "client_credentials",
      },
    }),
    "Microsoft sign-in",
    true
  );
  const token = res.json()?.access_token;
  if (!token) throw new Error("Microsoft sign-in returned no access token");
  return token;
}

export const AZURE_APP_FIELDS = [
  { key: "tenantId", label: "Tenant ID", type: "text" as const, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
  { key: "clientId", label: "Client ID (Application ID)", type: "text" as const, placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", required: true },
  { key: "clientSecret", label: "Client secret", type: "password" as const, placeholder: "App registration client secret", required: true },
];
