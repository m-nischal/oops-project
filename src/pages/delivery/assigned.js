// src/pages/delivery/assigned.js
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function AssignedPage() {
  const router = useRouter();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // check session + role
        const meRes = await fetch("/api/auth/me", { credentials: "include" });
        if (!meRes.ok) return router.replace("/delivery/login");
        const meData = await meRes.json();
        if (!meData.ok || !meData.user) return router.replace("/delivery/login");
        if ((meData.user.role || "").toUpperCase() !== "DELIVERY") return router.replace("/");

        // fetch deliveries assigned to this agent
        const res = await fetch("/api/delivery", { credentials: "include" });
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data?.error || "Failed to load deliveries");
        setDeliveries(data.deliveries || []);
      } catch (err) {
        console.error("Assigned page error:", err);
        setError(err.message || "Failed to load deliveries");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <div style={{ padding: 24 }}>Loading...</div>;
  if (error) return <div style={{ padding: 24, color: "red" }}>{error}</div>;

  return (
    <div style={{ padding: 24 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Assigned deliveries</h2>
        <div>
          <button
            onClick={() => {
              setLoading(true);
              setError("");
              // simple refresh
              fetch("/api/delivery", { credentials: "include" })
                .then((r) => r.json())
                .then((d) => {
                  if (d?.ok) setDeliveries(d.deliveries || []);
                  else setError(d?.error || "Failed to refresh");
                })
                .catch((e) => setError(e.message || "Failed to refresh"))
                .finally(() => setLoading(false));
            }}
            style={{ padding: "6px 10px" }}
          >
            Refresh
          </button>
        </div>
      </header>

      {deliveries.length === 0 ? (
        <div style={{ marginTop: 20 }}>No deliveries assigned.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {deliveries.map((d) => (
            <div
              key={d._id}
              style={{
                border: "1px solid #eee",
                padding: 12,
                borderRadius: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{d.externalOrderId || d._id}</div>
                <div style={{ fontSize: 13, color: "#444" }}>
                  {d.dropoff?.name || "—"} — {d.dropoff?.address || "No address"}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Status: {d.status}</div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {/* modern Next Link usage: no <a> child */}
                <Link href={`/delivery/${d._id}`}>
                  <button style={{ padding: "6px 10px", background: "#2563eb", color: "#fff", borderRadius: 4, border: "none" }}>
                    View
                  </button>
                </Link>
                {/* optional quick actions could go here */}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}