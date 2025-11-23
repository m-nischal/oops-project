// src/lib/otpSenders.js
import nodemailer from "nodemailer";
// 1. Import the new template
import { otpEmailHtml, paymentOtpEmailHtml } from "./emailTemplates";

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) return null;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure:
      (process.env.SMTP_SECURE === "true") ||
      Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });

  return transporter;
}

/**
 * sendEmailOTP
 * @param {string} email - Recipient
 * @param {string} code - OTP
 * @param {string} type - 'auth' (default) or 'payment'
 */
export async function sendEmailOTP(email, code, type = 'auth') {
  const t = getTransporter();
  
  // 2. Select the correct template based on type
  let htmlContent;
  let subject;

  if (type === 'payment') {
    subject = "Confirm Your Payment - LiveMart";
    htmlContent = paymentOtpEmailHtml({ otp: code, expiryMinutes: 5 });
  } else {
    // Default: Login/Register (Keeps existing behavior)
    subject = "Your LiveMart Verification Code";
    htmlContent = otpEmailHtml({ otp: code });
  }

  if (!t) {
    console.log(`[Mock Email] To: ${email} | Type: ${type} | OTP: ${code}`);
    return true;
  }

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || "LiveMart <no-reply@livemart.com>",
      to: email,
      subject: subject,
      text: `Your code is ${code}.`, 
      html: htmlContent, // 3. Use the selected HTML
    });
    return true;
  } catch (err) {
    console.error("sendEmailOTP failed:", err?.message || err);
    return false;
  }
}