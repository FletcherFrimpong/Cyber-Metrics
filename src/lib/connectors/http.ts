// Minimal HTTPS JSON client for connectors (server-side only).
// Uses node:https rather than fetch so a connector can opt out of certificate
// verification for on-premise consoles with self-signed certificates.

import https from "node:https";
import http from "node:http";

export interface HttpResponse {
  status: number;
  text: string;
  json<T = any>(): T;
}

export interface HttpOptions {
  method?: "GET" | "POST";
  headers?: Record<string, string>;
  /** Sent as application/x-www-form-urlencoded */
  form?: Record<string, string>;
  /** Sent as application/json */
  json?: unknown;
  timeoutMs?: number;
  insecureTls?: boolean;
}

export class HttpError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/** Normalise a user-entered host or URL to an https origin with no trailing slash. */
export function normaliseBaseUrl(input: string, defaultPort?: number): string {
  const raw = (input || "").trim();
  if (!raw) throw new HttpError("URL is required");
  const url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  // Plain http is accepted only for a local test server.
  if (url.protocol !== "https:" && !local) throw new HttpError("URL must use https");
  if (!url.port && defaultPort && !local) url.port = String(defaultPort);
  return url.origin + url.pathname.replace(/\/+$/, "");
}

export function request(url: string, options: HttpOptions = {}): Promise<HttpResponse> {
  const target = new URL(url);
  const headers: Record<string, string> = { Accept: "application/json", ...options.headers };
  let body: string | undefined;
  if (options.form) {
    body = new URLSearchParams(options.form).toString();
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  } else if (options.json !== undefined) {
    body = JSON.stringify(options.json);
    headers["Content-Type"] = "application/json";
  }
  if (body !== undefined) headers["Content-Length"] = String(Buffer.byteLength(body));

  const lib = target.protocol === "http:" ? http : https;
  return new Promise((resolve, reject) => {
    const req = lib.request(
      target,
      {
        method: options.method || (body !== undefined ? "POST" : "GET"),
        headers,
        timeout: options.timeoutMs ?? 30000,
        // Node gives each address family only 250 ms to connect by default, which
        // fails with a spurious ETIMEDOUT on slow links or a busy server process.
        autoSelectFamilyAttemptTimeout: 10000,
        ...(target.protocol === "https:" ? { rejectUnauthorized: !options.insecureTls } : {}),
      } as https.RequestOptions,
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const text = Buffer.concat(chunks).toString("utf-8");
          resolve({
            status: res.statusCode || 0,
            text,
            json: () => {
              try {
                return JSON.parse(text);
              } catch {
                throw new HttpError(`Expected JSON from ${target.host} but got: ${text.slice(0, 200)}`, res.statusCode);
              }
            },
          });
        });
      }
    );
    req.on("timeout", () => req.destroy(new HttpError(`Timed out connecting to ${target.host}`)));
    req.on("error", (err: any) => {
      const code = err?.code ? ` (${err.code})` : "";
      reject(err instanceof HttpError ? err : new HttpError(`Could not reach ${target.host}${code}: ${err.message}`));
    });
    if (body !== undefined) req.write(body);
    req.end();
  });
}

/** The vendor's own error text, pulled out of the common JSON error shapes. */
function vendorMessage(text: string): string {
  try {
    const body = JSON.parse(text);
    const first = body?.errors?.[0] ?? body?.messages?.[0] ?? body?.error ?? body;
    const msg =
      typeof first === "string" ? first :
      first?.message || first?.text || first?.detail || first?.title || body?.error_description || body?.message;
    if (msg) return String(msg).slice(0, 200);
  } catch {
    // not JSON
  }
  return text.replace(/\s+/g, " ").trim().slice(0, 200);
}

/**
 * Throw a readable error unless the response is 2xx.
 * `authStep` marks a sign-in call, where any 4xx means the credentials are wrong.
 */
export function expectOk(res: HttpResponse, what: string, authStep = false): HttpResponse {
  if (res.status >= 200 && res.status < 300) return res;
  const hint =
    res.status === 401 || (authStep && res.status >= 400 && res.status < 500) ? "credentials were rejected" :
    res.status === 403 ? "the credentials lack the required permission" :
    res.status === 404 ? "endpoint not found; check the URL" :
    res.status === 429 ? "rate limited; try again shortly" :
    "request failed";
  const detail = vendorMessage(res.text);
  throw new HttpError(`${what}: HTTP ${res.status}, ${hint}${detail ? `. ${detail}` : ""}`, res.status);
}
