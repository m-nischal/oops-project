// src/pages/delivery/[id].js
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function DeliveryDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [delivery, setDelivery] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [note, setNote] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { credentials: "include" });
        if (!me.ok) return router.replace("/delivery/login");
        const meData = await me.json();
        if (!meData.ok || (meData.user.role||"").toUpperCase() !== "DELIVERY") return router.replace("/");
        await fetchDelivery();
      } catch (e) {
        console.error(e);
        router.replace("/delivery/login");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchDelivery() {
    setLoading(true); setError("");
    try {
      const res = await fetch(`/api/delivery/${id}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Failed to load");
      setDelivery(data.delivery || data);
    } catch (e) {
      setError(e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  async function postAction(path, body) {
    setActionLoading(true); setError("");
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "Action failed");
      setDelivery(data.delivery || data);
    } catch (e) {
      setError(e.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;
  if (!delivery) return <div style={{ padding: 24 }}>No delivery selected.</div>;

  const canAccept = delivery.status === "ASSIGNED";
  const canPick = delivery.status === "ACCEPTED";
  const canOutFor = ["PICKED_UP", "IN_TRANSIT", "ACCEPTED"].includes(delivery.status);
  const canDeliver = delivery.status === "OUT_FOR_DELIVERY";

  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => router.back()} style={{ marginBottom: 12 }}>← Back</button>
      <h2>Delivery {delivery.externalOrderId || delivery._id}</h2>
      <div><strong>Drop:</strong> {delivery.dropoff?.name}</div>
      <div><strong>Address:</strong> {delivery.dropoff?.address}</div>
      <div><strong>Phone:</strong> {delivery.dropoff?.phone}</div>
      <div><strong>Status:</strong> {delivery.status}</div>

      <div style={{ marginTop: 12 }}>
        <textarea placeholder="note (optional)" value={note} onChange={e=>setNote(e.target.value)} style={{ width: "100%", minHeight: 80 }} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        {canAccept && <>
          <button disabled={actionLoading} onClick={() => postAction(`/api/delivery/${id}/accept`, { action: "accept", note })}>Accept</button>
          <button disabled={actionLoading} onClick={() => postAction(`/api/delivery/${id}/accept`, { action: "decline", note })}>Decline</button>
        </>}

        {canPick && (
          <button disabled={actionLoading} onClick={() => postAction(`/api/delivery/${id}/status`, { status: "PICKED_UP", note })}>Mark Picked Up</button>
        )}

        {canOutFor && (
          <button disabled={actionLoading} onClick={() => postAction(`/api/delivery/${id}/status`, { status: "OUT_FOR_DELIVERY", note })}>Mark Out For Delivery</button>
        )}

        {canDeliver && <>
          <input placeholder="Recipient OTP" value={otp} onChange={(e)=>setOtp(e.target.value)} style={{ marginRight: 8 }} />
          <button disabled={actionLoading} onClick={() => postAction(`/api/delivery/${id}/status`, { status: "DELIVERED", otp, note })}>Mark Delivered</button>
        </>}
      </div>

      <div style={{ marginTop: 16 }}>
        <h3>History</h3>
        <ul>
          {(delivery.history||[]).slice().reverse().map((h,i) => (
            <li key={i}><strong>{h.status}</strong> — {new Date(h.at || h.createdAt || delivery.timestamps?.createdAt).toLocaleString()} {h.note ? ` — ${h.note}` : ""}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}