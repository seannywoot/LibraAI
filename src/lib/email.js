import nodemailer from "nodemailer";

let transporterPromise;
let fromAddress;
let usingEthereal = false;
let usingEmailJS = false;

function isEmailJSConfigured() {
  const svc = process.env.EMAILJS_SERVICE_ID;
  const tpl = process.env.EMAILJS_TEMPLATE_ID;
  const priv = process.env.EMAILJS_PRIVATE_KEY;
  // Prefer server-side with a private key for secure use
  return Boolean(svc && tpl && priv);
}

function parseNameEmail(input) {
  // Very small parser for "Name <email@domain>" or just email
  const str = (input || "").toString().trim();
  const match = str.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "", email: str };
}

async function sendViaEmailJS({ to, subject, html, text, templateParams }) {
  usingEmailJS = true;
  const service_id = process.env.EMAILJS_SERVICE_ID;
  const template_id = process.env.EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID; // support either env name
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;
  const { name: from_name, email: reply_to } = parseNameEmail(from);

  const endpoint = "https://api.emailjs.com/api/v1.0/email/send";
  const headers = { "Content-Type": "application/json" };
  if (privateKey) headers["Authorization"] = `Bearer ${privateKey}`;

  const baseParams = {
    to_email: to,
    subject: subject,
    message: text || "",
    message_html: html || "",
    reply_to,
    from_name: from_name || undefined,
  };

  const body = {
    service_id,
    template_id,
    // user_id is optional when using private key authorization, but including public key doesn't hurt
    ...(publicKey ? { user_id: publicKey } : {}),
    template_params: { ...baseParams, ...(templateParams || {}) },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const textBody = await res.text();
  if (!res.ok) {
    throw new Error(`EmailJS send failed (${res.status}): ${textBody}`);
  }
  return { provider: "emailjs", ok: true, status: res.status, body: textBody };
}

async function resolveTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
    // If EmailJS is configured, we won't need an SMTP transporter
    if (isEmailJSConfigured()) {
      usingEmailJS = true;
      // Set from address for consistency in downstream functions
      fromAddress = process.env.EMAIL_FROM || process.env.SMTP_FROM || "LibraAI <no-reply@example.com>";
      return null; // No nodemailer transport when using EmailJS
    }

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM || process.env.SMTP_FROM;

    if (host && user && pass && from) {
      fromAddress = from;
      return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }

    if (process.env.NODE_ENV !== "production") {
      // Dev fallback: auto-provision an Ethereal test account for previewing emails
      const account = await nodemailer.createTestAccount();
      usingEthereal = true;
      fromAddress = from || "LibraAI <no-reply@example.com>";
      return nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
    }

    throw new Error(
      "Missing SMTP configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM). Please set these variables to match your SMTP provider (e.g., Resend SMTP, SendGrid, Postmark, Amazon SES)."
    );
  })();
  return transporterPromise;
}

export async function sendMail({ to, subject, html, text, templateParams }) {
  // Prefer EmailJS if configured
  if (isEmailJSConfigured()) {
    return sendViaEmailJS({ to, subject, html, text, templateParams });
  }

  const tx = await resolveTransporter();
  if (!tx) {
    // Shouldn't happen, but guard just in case
    throw new Error("No email transport available");
  }
  const info = await tx.sendMail({ from: fromAddress, to, subject, html, text });
  if (usingEthereal) {
    const url = nodemailer.getTestMessageUrl(info);
    if (url) {
      console.log("Password reset email preview URL:", url);
    }
  }
  return info;
}

export async function sendPasswordResetEmail(to, resetUrl, { appName = "LibraAI", expiresMinutes = 15 } = {}) {
  const subject = `${appName} password reset`;
  const text = `You requested a password reset for your ${appName} account.\n\n` +
    `Click the link below to set a new password. The link expires in ${expiresMinutes} minutes.\n\n` +
    `${resetUrl}\n\n` +
    `If you did not request this, you can safely ignore this email.`;

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#111827;max-width:560px;margin:0 auto;padding:16px;">
      <h2 style="margin:0 0 8px;">${appName} password reset</h2>
      <p style="margin-top:0;">You requested a password reset for your ${appName} account.</p>
      <p>
        <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:10px 14px;border-radius:6px;text-decoration:none;display:inline-block;">Reset your password</a>
      </p>
      <p style="color:#666;font-size:12px;line-height:1.5;">
        This link expires in ${expiresMinutes} minutes. If you did not request this, you can ignore this email.
      </p>
    </div>
  `;

  // Provide template parameters for EmailJS templates, while still sending html/text for SMTP fallback
  const templateParams = {
    reset_url: resetUrl,
    app_name: appName,
    expires_minutes: expiresMinutes,
  };
  return sendMail({ to, subject, html, text, templateParams });
}
