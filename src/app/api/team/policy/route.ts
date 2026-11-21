import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { getTeamPolicy, updateTeamPolicy } from "@/lib/settings-store";
import { audit } from "@/lib/audit-log";

// GET: who may join the workspace and who may invite. Any signed-in user may read it.
export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;
  return NextResponse.json({ policy: getTeamPolicy() });
}

// POST { signup?, allowedDomains?, membersCanInvite? }: administrators and owners only.
export async function POST(request: NextRequest) {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  if (body.signup === "domain" && !(Array.isArray(body.allowedDomains) && body.allowedDomains.length)) {
    const existing = getTeamPolicy().allowedDomains;
    if (existing.length === 0) {
      return NextResponse.json({ error: "Add at least one email domain to restrict sign-up by domain" }, { status: 400 });
    }
  }

  const before = getTeamPolicy();
  const policy = updateTeamPolicy(body);
  if (policy.signup === "domain" && policy.allowedDomains.length === 0) {
    updateTeamPolicy(before);
    return NextResponse.json({ error: "None of those look like email domains (for example yourcompany.com)" }, { status: 400 });
  }
  audit({
    actor: auth.username,
    actorRole: auth.role,
    action: "team.policy_update",
    target: "access policy",
    detail: `Sign-up: ${policy.signup}${policy.signup === "domain" ? ` (${policy.allowedDomains.join(", ")})` : ""}; members can invite: ${policy.membersCanInvite ? "yes" : "no"}`,
  });
  return NextResponse.json({ success: true, policy });
}
