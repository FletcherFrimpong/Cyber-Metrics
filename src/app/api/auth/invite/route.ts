import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { createInvite } from "@/lib/auth/user-store";
import { assignableRoles, isRole, ROLE_LABELS } from "@/lib/auth/rbac";
import { getTeamPolicy } from "@/lib/settings-store";
import { isEmailConfigured, sendInviteEmail } from "@/lib/email";
import { audit } from "@/lib/audit-log";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST { email, displayName?, role }: invite a teammate.
// Who may invite, and which roles they may grant, depends on their own role:
// see assignableRoles() in src/lib/auth/rbac.ts.
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const displayName = String(body?.displayName || "").trim();
  const role = body?.role;

  const allowed = assignableRoles(auth.role, getTeamPolicy().membersCanInvite);
  if (allowed.length === 0) {
    return NextResponse.json({ error: "Your role cannot invite teammates. Ask an administrator." }, { status: 403 });
  }
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "A valid email address is required" }, { status: 400 });
  }
  if (!isRole(role)) {
    return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
  }
  if (!allowed.includes(role)) {
    return NextResponse.json(
      { error: `Your role cannot grant the ${ROLE_LABELS[role]} role. You can invite: ${allowed.map((r) => ROLE_LABELS[r]).join(", ")}.` },
      { status: 403 }
    );
  }

  try {
    const { user, inviteToken } = await createInvite({ email, displayName, role, invitedBy: auth.userId });
    audit({ actor: auth.username, actorRole: auth.role, action: "user.invite", target: email, detail: `Invited as ${ROLE_LABELS[role]}` });

    let emailSent = false;
    let emailError: string | undefined;
    const origin = process.env.APP_URL || new URL(request.url).origin;
    const inviteUrl = `${origin}/invite?token=${inviteToken}`;
    if (isEmailConfigured()) {
      try {
        await sendInviteEmail({ to: email, displayName: displayName || email.split("@")[0], role, inviteUrl });
        emailSent = true;
      } catch (err: any) {
        emailError = err.message;
        console.error("Failed to send invite email:", err.message);
      }
    }

    return NextResponse.json({
      success: true,
      user,
      emailSent,
      emailError,
      // Shown to the inviter so they can pass the link on when email is not set up
      inviteUrl: !emailSent ? inviteUrl : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
