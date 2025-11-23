// lib/emailTemplates.js
export function otpEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color: #222; margin-bottom: 6px;">${appName} — Verification Code</h2>
      <p style="color: #555; margin-top: 0;">
        Use the code below to verify your email address. The code expires in ${expiryMinutes} minutes.
      </p>

      <div style="margin: 22px 0; text-align: center;">
        <div style="display:inline-block; padding: 14px 22px; border-radius:8px; background:#f0f4ff;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #1a56db;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Team
      </p>
    </div>
  </div>
  `;
}

// ... existing imports and functions (otpEmailHtml, paymentOtpEmailHtml, resetPasswordEmailHtml)

export function orderConfirmationEmailHtml({ appName = "LiveMart", order }) {
  const itemsHtml = order.items.map(item => `
    <div style="padding: 12px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
      <div style="flex: 1; padding-right: 10px;">
        <div style="font-weight: 600; color: #333;">${item.name}</div>
        <div style="font-size: 13px; color: #777;">Size: ${item.sizeLabel} | Qty: ${item.qty}</div>
      </div>
      <span style="font-weight: bold; white-space: nowrap; color: #333;">₹${Number(item.subtotal).toLocaleString('en-IN')}</span>
    </div>
  `).join("");

  // Format delivery date
  const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
  const deliveryDate = order.estimatedDelivery 
    ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', dateOptions) 
    : 'Pending';
    
  const orderIdDisplay = order._id ? String(order._id).slice(-6).toUpperCase() : 'N/A';

  return `
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
      
      <div style="text-align: center; border-bottom: 1px solid #f0f0f0; padding-bottom: 20px; margin-bottom: 20px;">
        <h2 style="color: #000; margin: 0 0 5px 0; font-size: 24px;">Order Confirmed!</h2>
        <p style="color: #666; margin: 0; font-size: 15px;">Thank you for shopping with ${appName}.</p>
      </div>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb; margin-bottom: 25px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding-bottom: 8px; color: #666; font-size: 13px;">Order ID</td>
            <td style="padding-bottom: 8px; color: #111; font-weight: bold; text-align: right;">#${orderIdDisplay}</td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px; color: #666; font-size: 13px;">Expected Delivery</td>
            <td style="padding-bottom: 8px; color: #16a34a; font-weight: bold; text-align: right;">${deliveryDate}</td>
          </tr>
          <tr>
            <td style="color: #666; font-size: 13px;">Payment Method</td>
            <td style="color: #111; font-weight: 500; text-align: right;">${order.payment?.method || 'Cash on Delivery'}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 15px; color: #444; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 700;">Order Items</h3>
      <div style="margin-bottom: 25px; border-top: 2px solid #f3f4f6;">
        ${itemsHtml}
        <div style="padding-top: 15px; margin-top: 5px; display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #f3f4f6;">
          <span style="font-size: 16px; color: #666;">Total Amount</span>
          <span style="font-size: 20px; font-weight: 800; color: #000;">₹${Number(order.total).toLocaleString('en-IN')}</span>
        </div>
      </div>

      <p style="color:#9ca3af; font-size:12px; margin-top:25px; text-align: center;">
        © ${new Date().getFullYear()} ${appName}. All rights reserved.
      </p>
    </div>
  </div>
  `;
}

export function paymentOtpEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 5 }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color: #222; margin-bottom: 6px;">${appName} — Payment Confirmation</h2>
      <p style="color: #555; margin-top: 0;">
        Please use the OTP below to complete your secure payment. Do not share this code with anyone.
      </p>

      <div style="margin: 22px 0; text-align: center;">
        <div style="display:inline-block; padding: 14px 22px; border-radius:8px; background:#fff7ed;">
          <span style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #c2410c;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        This code expires in ${expiryMinutes} minutes.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Security
      </p>
    </div>
  </div>
  `;
}

export function resetPasswordEmailHtml({ appName = "LiveMart", otp, expiryMinutes = 10 }) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; background: #f7f7f7;">
    <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 24px; border-radius: 8px;">
      <h2 style="color:#222; margin-bottom:6px;">${appName} — Password Reset</h2>
      <p style="color:#555; margin-top:0;">
        We received a request to reset the password for your account. Use the code below to continue.
      </p>

      <div style="margin:22px 0; text-align:center;">
        <div style="display:inline-block; padding:14px 22px; border-radius:8px; background:#fff0f0;">
          <span style="font-size:28px; font-weight:700; letter-spacing:6px; color:#d5182a;">
            ${otp}
          </span>
        </div>
      </div>

      <p style="color:#777; font-size:14px;">
        This code is valid for ${expiryMinutes} minutes. If you did not request a password reset, ignore this message.
      </p>

      <p style="color:#999; font-size:13px; margin-top:18px;">
        — ${appName} Team
      </p>
    </div>
  </div>
  `;
}
