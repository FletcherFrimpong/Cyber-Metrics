import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

// Lazy singleton transporter (same globalThis pattern as settings-store)
const g = globalThis as any;

function getTransporter(): Transporter {
  if (!g.__sfMailTransporter) {
    g.__sfMailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return g.__sfMailTransporter;
}

export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER);
}

export async function sendInviteEmail(params: {
  to: string;
  displayName: string;
  role: string;
  inviteUrl: string;
}): Promise<void> {
  if (!isEmailConfigured()) return;

  const { to, displayName, role, inviteUrl } = params;
  const roleLabel = role === "admin" ? "Administrator" : "Viewer";
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "You've been invited to SignalFoundry",
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:500px;margin:40px auto;padding:0 20px;">
    <!-- Header -->
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;width:48px;height:48px;line-height:48px;border-radius:50%;background-color:rgba(249,115,22,0.1);border:1px solid rgba(249,115,22,0.2);font-size:24px;text-align:center;">
        &#128737;&#65039;
      </div>
      <h1 style="color:#f97316;font-size:20px;font-weight:700;letter-spacing:2px;margin:12px 0 4px;">SIGNAL FOUNDRY</h1>
      <p style="color:#737373;font-size:12px;margin:0;">Cyber Risk Quantification Platform</p>
    </div>

    <!-- Card -->
    <div style="background-color:#171717;border:1px solid #404040;border-radius:8px;padding:32px;">
      <h2 style="color:#ffffff;font-size:18px;margin:0 0 8px;">You've been invited!</h2>
      <p style="color:#a3a3a3;font-size:14px;margin:0 0 24px;">
        Hi ${displayName}, you've been invited to join SignalFoundry as <strong style="color:#ffffff;">${roleLabel}</strong>.
      </p>

      <p style="color:#a3a3a3;font-size:14px;margin:0 0 24px;">
        Click the button below to set up your username and password and activate your account.
      </p>

      <!-- Accept invite button -->
      <a href="${inviteUrl}" style="display:block;text-align:center;background-color:#ea580c;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:500;">
        Accept Invite &amp; Set Up Account
      </a>

      <p style="color:#737373;font-size:12px;margin:16px 0 0;text-align:center;">
        This link expires in 72 hours. If it has expired, ask your administrator to resend the invite.
      </p>
    </div>

    <!-- Footer -->
    <p style="color:#525252;font-size:11px;text-align:center;margin-top:24px;">
      This is an automated invitation from SignalFoundry. If you didn't expect this, you can ignore it.
    </p>
  </div>
</body>
</html>`,
  });
}
