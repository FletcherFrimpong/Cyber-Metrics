import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { createInvite } from "@/lib/auth/user-store";
import { isEmailConfigured, sendInviteEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, displayName, role } = body;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!role || !["admin", "viewer"].includes(role)) {
    return NextResponse.json({ error: "Valid role is required" }, { status: 400 });
  }

  try {
    const { user, inviteToken } = await createInvite({
      email,
      displayName: displayName || "",
      role,
    });

    // Send invite email
    let emailSent = false;
    let emailError: string | undefined;
    const origin = process.env.APP_URL || new URL(request.url).origin;
    const inviteUrl = `${origin}/invite?token=${inviteToken}`;

    if (isEmailConfigured()) {
      try {
        await sendInviteEmail({
          to: email,
          displayName: displayName || email.split("@")[0],
          role,
          inviteUrl,
        });
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
      // Include invite URL so admin can copy it if email fails
      inviteUrl: !emailSent ? inviteUrl : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 409 });
  }
}
