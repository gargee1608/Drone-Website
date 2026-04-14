import nodemailer from "nodemailer";

export function createMailTransport() {
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;
  if (!user || !pass) {
    console.warn(
      "[mailer] MAILTRAP_USER / MAILTRAP_PASS missing — OTP emails will not send."
    );
    return null;
  }
  return nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: { user, pass },
  });
}
