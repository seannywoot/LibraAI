import React from "react";

export default function PasswordResetEmail({ appName = "LibraAI", resetUrl, expiresMinutes = 15 }) {
  const btnStyle = {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    padding: "10px 14px",
    borderRadius: "6px",
    textDecoration: "none",
    display: "inline-block",
  };

  const muted = {
    color: "#666",
    fontSize: 12,
    lineHeight: 1.5,
  };

  const container = {
    fontFamily: "system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial",
    color: "#111827",
    maxWidth: 560,
    margin: "0 auto",
    padding: 16,
  };

  return (
    <div style={container}>
      <h2 style={{ margin: "0 0 8px" }}>{appName} password reset</h2>
      <p style={{ marginTop: 0 }}>You requested a password reset for your {appName} account.</p>
      <p>
        <a href={resetUrl} style={btnStyle}>
          Reset your password
        </a>
      </p>
      <p style={muted}>
        This link expires in {expiresMinutes} minutes. If you did not request this, you can ignore this email.
      </p>
    </div>
  );
}
