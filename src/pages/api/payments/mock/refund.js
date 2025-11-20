// src/pages/api/payments/mock/refund.js
/**
 * Dev-only mock payment refund endpoint.
 * POST /api/payments/mock/refund
 * Body: { paymentId, amount }
 * Response: { success: true, refundId }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { paymentId } = req.body || {};
    if (!paymentId) return res.status(400).json({ error: "paymentId required" });
    const refundId = `rf_${Date.now()}`;
    return res.status(200).json({ success: true, refundId, paymentId });
  } catch (err) {
    console.error("POST /api/payments/mock/refund error:", err);
    return res.status(500).json({ error: err.message || "Payment mock refund failed" });
  }
}
