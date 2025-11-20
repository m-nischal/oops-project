// src/pages/api/payments/mock/charge.js
/**
 * Dev-only mock payment charge endpoint.
 * POST /api/payments/mock/charge
 * Body: { amount, method, metadata }
 * Response: { success: true, paymentId }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { amount } = req.body || {};
    if (!amount) return res.status(400).json({ error: "amount required" });
    const paymentId = `pm_${Date.now()}`;
    // Keep minimal response – replace with real provider integration in prod.
    return res.status(200).json({ success: true, paymentId, amount });
  } catch (err) {
    console.error("POST /api/payments/mock/charge error:", err);
    return res.status(500).json({ error: err.message || "Payment mock failed" });
  }
}
