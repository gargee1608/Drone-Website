import nodemailer from "nodemailer";

export function createMailTransport() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass =
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    "";
  if (!user.trim() || !pass.trim()) {
    console.warn(
      "[mailer] Gmail SMTP not configured — set GMAIL_USER and GMAIL_APP_PASSWORD in server/.env."
    );
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" || (process.env.SMTP_SECURE !== "false" && port === 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user, pass },
  });
}
