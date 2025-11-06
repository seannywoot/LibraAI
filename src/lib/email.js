function isEmailJSConfigured() {
  const svc = process.env.EMAILJS_SERVICE_ID;
  const tpl = process.env.EMAILJS_TEMPLATE_ID;
  const priv = process.env.EMAILJS_PRIVATE_KEY;
  return Boolean(svc && tpl && priv);
}

function parseNameEmail(input) {
  // Very small parser for "Name <email@domain>" or just email
  const str = (input || "").toString().trim();
  const match = str.match(/^\s*([^<]+?)\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim(), email: match[2].trim() };
  return { name: "", email: str };
}

async function sendViaEmailJS({
  to,
  subject,
  html,
  text,
  templateParams,
  templateId,
  useCustomHTML = false,
}) {
  const service_id = process.env.EMAILJS_SERVICE_ID;
  const template_id = templateId || process.env.EMAILJS_TEMPLATE_ID;
  const publicKeyRaw =
    process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;
  const privateKeyRaw = process.env.EMAILJS_PRIVATE_KEY;

  // Normalize keys: EmailJS expects raw values (no 'public_' or 'pr_' prefixes)
  const publicKey = (publicKeyRaw || "").trim().replace(/^public_/i, "");
  const privateKey = (privateKeyRaw || "").trim().replace(/^pr_/i, "");
  const from = process.env.EMAIL_FROM || "LibraAI <no-reply@example.com>";
  const { name: from_name, email: reply_to } = parseNameEmail(from);

  const endpoint = "https://api.emailjs.com/api/v1.0/email/send";
  const headers = { "Content-Type": "application/json" };

  // For digest emails and custom HTML, prioritize the HTML content over template
  const baseParams = {
    to_email: to,
    subject: subject,
    message: text || "",
    message_html: html || "",
    reply_to,
    from_name: from_name || undefined,
  };

  // If useCustomHTML is true, ensure the HTML is used directly
  const finalTemplateParams = useCustomHTML
    ? {
        ...baseParams,
        email: to,
        to_email: to,
        // Override any template variables with our custom content
        html_content: html,
        text_content: text,
        email_subject: subject,
        ...(templateParams || {}),
      }
    : {
        ...baseParams,
        email: to,
        to_email: to,
        ...(templateParams || {}),
      };

  const body = {
    service_id,
    template_id,
    user_id: publicKey,
    accessToken: privateKey,
    template_params: finalTemplateParams,
  };

  console.log("[EmailJS] Sending email to:", to);
  console.log("[EmailJS] Using service:", service_id);
  console.log("[EmailJS] Using template:", template_id);
  console.log("[EmailJS] Custom HTML mode:", useCustomHTML);
  console.log("[EmailJS] Subject:", subject);
  console.log("[EmailJS] Public key configured:", !!publicKey);
  console.log("[EmailJS] Private key configured:", !!privateKey);

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const textBody = await res.text();
  console.log("[EmailJS] Response status:", res.status);
  console.log("[EmailJS] Response body:", textBody);

  if (!res.ok) {
    // Provide helpful error message for common 403 error
    if (res.status === 403 && textBody.includes("non-browser")) {
      throw new Error(
        `EmailJS API calls are disabled for server-side applications. ` +
          `Please enable server-side access in your EmailJS dashboard: ` +
          `Go to Account > Security > Enable "Allow non-browser requests". ` +
          `See QUICK_FIX_403.md for detailed instructions.`
      );
    }
    throw new Error(`EmailJS send failed (${res.status}): ${textBody}`);
  }

  console.log(`✓ Email sent via EmailJS to ${to}`);
  return { provider: "emailjs", ok: true, status: res.status, body: textBody };
}

export async function sendMail({
  to,
  subject,
  html,
  text,
  templateParams,
  templateId,
  useCustomHTML = false,
}) {
  if (!isEmailJSConfigured()) {
    throw new Error(
      "EmailJS is not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PRIVATE_KEY environment variables."
    );
  }

  return sendViaEmailJS({
    to,
    subject,
    html,
    text,
    templateParams,
    templateId,
    useCustomHTML,
  });
}

/**
 * Send digest email with custom HTML (bypasses EmailJS template)
 * Use this for admin digests and other emails with custom HTML content
 */
export async function sendDigestEmail({ to, subject, html, text }) {
  if (!isEmailJSConfigured()) {
    throw new Error(
      "EmailJS is not configured. Please set EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, and EMAILJS_PRIVATE_KEY environment variables."
    );
  }

  const service_id = process.env.EMAILJS_SERVICE_ID;
  const publicKeyRaw =
    process.env.EMAILJS_PUBLIC_KEY || process.env.EMAILJS_USER_ID;
  const privateKeyRaw = process.env.EMAILJS_PRIVATE_KEY;

  const publicKey = (publicKeyRaw || "").trim().replace(/^public_/i, "");
  const privateKey = (privateKeyRaw || "").trim().replace(/^pr_/i, "");
  const from = process.env.EMAIL_FROM || "LibraAI <no-reply@example.com>";
  const { name: from_name, email: reply_to } = parseNameEmail(from);

  // Use a minimal template approach - send HTML directly
  const endpoint = "https://api.emailjs.com/api/v1.0/email/send";
  const headers = { "Content-Type": "application/json" };

  const body = {
    service_id,
    template_id: process.env.EMAILJS_TEMPLATE_ID, // Still need a template ID
    user_id: publicKey,
    accessToken: privateKey,
    template_params: {
      to_email: to,
      from_name: from_name || "LibraAI",
      reply_to: reply_to,
      subject: subject,
      // Send both HTML and text versions
      message_html: html,
      message: text,
      // Additional params that might be used by template
      html_content: html,
      text_content: text,
      email_subject: subject,
    },
  };

  console.log("[EmailJS] Sending digest email to:", to);
  console.log("[EmailJS] Subject:", subject);
  console.log("[EmailJS] Using service:", service_id);

  const res = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const textBody = await res.text();
  console.log("[EmailJS] Response status:", res.status);

  if (!res.ok) {
    if (res.status === 403 && textBody.includes("non-browser")) {
      throw new Error(
        `EmailJS API calls are disabled for server-side applications. ` +
          `Please enable server-side access in your EmailJS dashboard.`
      );
    }
    throw new Error(`EmailJS send failed (${res.status}): ${textBody}`);
  }

  console.log(`✓ Digest email sent via EmailJS to ${to}`);
  return { provider: "emailjs", ok: true, status: res.status };
}

export async function sendPasswordResetEmail(
  to,
  resetUrl,
  { appName = "LibraAI", expiresMinutes = 15 } = {}
) {
  const subject = `${appName} password reset`;
  const text =
    `You requested a password reset for your ${appName} account.\n\n` +
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
