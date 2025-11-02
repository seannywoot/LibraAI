import nodemailer from "nodemailer";

let transporterPromise;
let fromAddress;
let usingEthereal = false;

async function resolveTransporter() {
  if (transporterPromise) return transporterPromise;
  transporterPromise = (async () => {
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

    throw new Error("Missing SMTP configuration (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM)");
  })();
  return transporterPromise;
}

export async function sendMail({ to, subject, html, text }) {
  const tx = await resolveTransporter();
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
    <p>You requested a password reset for your ${appName} account.</p>
    <p><a href="${resetUrl}">Reset your password</a></p>
    <p style="color:#666;font-size:12px;">This link expires in ${expiresMinutes} minutes. If you did not request this, you can ignore this email.</p>
  `;

  return sendMail({ to, subject, html, text });
}
