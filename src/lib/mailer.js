// lib/mailer.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for others
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: `"LiveMart" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
    to,
    subject,
    text,
    html,
  });
  return info;
}
