const nodemailer = require("nodemailer");

function smtpCredentials() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const pass =
    process.env.SMTP_PASS ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.GMAIL_PASS ||
    "";
  return { user: user.trim(), pass: pass.trim() };
}

function createTransport() {
  const { user, pass } = smtpCredentials();
  if (!user || !pass) {
    console.warn(
      "[email] Gmail SMTP not configured — set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env (Google App Password)."
    );
    return null;
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure =
    process.env.SMTP_SECURE === "true" ||
    (process.env.SMTP_SECURE !== "false" && port === 465);

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: { user, pass },
  });
}

function isSmtpConfigured() {
  const { user, pass } = smtpCredentials();
  return Boolean(user && pass);
}

function defaultFromAddress() {
  return (
    process.env.MAIL_FROM ||
    process.env.GMAIL_USER ||
    process.env.SMTP_USER ||
    "no-reply@test.com"
  );
}

const transport = createTransport();

module.exports =
  transport ||
  {
    sendMail: async () => {
      const err = new Error(
        "SMTP_NOT_CONFIGURED: set GMAIL_USER and GMAIL_APP_PASSWORD in backend/.env"
      );
      err.code = "SMTP_NOT_CONFIGURED";
      throw err;
    },
  };

module.exports.isSmtpConfigured = isSmtpConfigured;
module.exports.defaultFromAddress = defaultFromAddress;
module.exports.smtpCredentials = smtpCredentials;
