// src/components/SizeChartModal.js
import { useEffect } from "react";

export default function SizeChartModal({ open, onClose, imageUrl, title = "Size chart" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.5)", padding: 20
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#fff",
          padding: 12,
          borderRadius: 8,
          maxWidth: "95%",
          maxHeight: "90%",
          boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
          overflow: "auto"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <strong>{title}</strong>
          <button onClick={onClose} aria-label="Close size chart" style={{
            border: "none", background: "transparent", fontSize: 20, cursor: "pointer"
          }}>✕</button>
        </div>

        {imageUrl ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={imageUrl} alt={title} style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain" }} />
          </div>
        ) : (
          <div style={{ padding: 20, color: "#666" }}>Size chart not available.</div>
        )}
      </div>
    </div>
  );
}
