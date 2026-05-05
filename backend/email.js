const nodemailer = require("nodemailer");

// Mailtrap SMTP connection
const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "3bc727942be308",
    pass: "754e43872dda17",
  },
});

module.exports = transporter;
