import React, { useState, useEffect } from "react";

const CONDITION = {
  critical: { label: "🔴 Critical", color: "#e53935", bg: "#fee2e2", border: "#fecaca" },
  urgent:   { label: "🟡 Urgent",   color: "#f59e0b", bg: "#fef3c7", border: "#fde68a" },
  normal:   { label: "🟢 Normal",   color: "#10b981", bg: "#d1fae5", border: "#a7f3d0" },
};

const STATUS = {
  waiting:     { label: "Waiting",     color: "#64748b" },
  "in-progress": { label: "With Doctor", color: "#3b82f6" },
  completed:   { label: "Completed",   color: "#10b981" },
};

export default function QueueCard({ patient, isAdmin, onCall, onComplete, onDelete }) {
  const cond = CONDITION[patient.condition] || CONDITION.normal;
  const stat = STATUS[patient.status] || STATUS.waiting;

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      : "—";

  const [elapsed, setElapsed] = useState("");
  useEffect(() => {
    if (!patient.bookingTime || patient.status === "completed") return;
    const update = () => {
      const diff = Date.now() - new Date(patient.bookingTime).getTime();
      const mins = Math.floor(diff / 60000);
      setElapsed(mins > 0 ? `${mins} min` : "< 1 min");
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, [patient.bookingTime, patient.status]);

  return (
    <div
      style={{
        background: "#ffffff",
        border: `1px solid #e2e8f0`,
        borderLeft: `3px solid ${cond.color}`,
        borderRadius: 12,
        padding: "16px 20px",
        marginBottom: 10,
        transition: "background 0.2s",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div
          style={{
            minWidth: 40,
            height: 40,
            borderRadius: "50%",
            background: cond.bg,
            border: `1px solid ${cond.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: cond.color,
          }}
        >
          {patient.queuePosition || "—"}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{patient.name}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>Age {patient.age}</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 20,
                background: cond.bg,
                color: cond.color,
                border: `1px solid ${cond.border}`,
              }}
            >
              {cond.label}
            </span>
            <span style={{ fontSize: 11, color: stat.color, fontWeight: 600 }}>
              ● {stat.label}
            </span>
          </div>
          <div style={{ fontSize: 13, color: "#475569", marginTop: 6 }}>
            <strong style={{ color: "#64748b" }}>Symptoms:</strong> {patient.symptoms}
          </div>

          {/* Doctor's live notes (if in-progress and notes exist) */}
          {patient.status === "in-progress" && patient.notes && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "#f0fdf4",
                borderLeft: "3px solid #10b981",
                borderRadius: 6,
                fontSize: 13,
                color: "#065f46",
              }}
            >
              <span style={{ fontWeight: 600, marginRight: 8 }}>📝 Doctor's Notes:</span>
              {patient.notes}
            </div>
          )}

          {/* Doctor's conclusion (if completed) */}
          {patient.status === "completed" && patient.conclusion && (
            <div
              style={{
                marginTop: 10,
                padding: "8px 12px",
                background: "#f0fdf4",
                borderLeft: "3px solid #10b981",
                borderRadius: 6,
                fontSize: 13,
                color: "#065f46",
              }}
            >
              <span style={{ fontWeight: 600, marginRight: 8 }}>📋 Doctor's Note:</span>
              {patient.conclusion}
            </div>
          )}

          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#64748b", flexWrap: "wrap" }}>
            <span>📅 Booked: {fmt(patient.bookingTime)}</span>
            {patient.phone && <span>📞 {patient.phone}</span>}
            {patient.status !== "completed" && elapsed && (
              <span style={{ color: "#f59e0b" }}>⏱ Waiting for {elapsed}</span>
            )}
            {patient.status === "waiting" && patient.estimatedWait && (
              <span style={{ color: "#f59e0b" }}>⏳ Est. {patient.estimatedWait} min</span>
            )}
          </div>
        </div>

        {isAdmin && patient.status !== "completed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
            {patient.status === "waiting" && (
              <button onClick={() => onCall(patient.id)} style={btnStyle("#1e40af", "#3b82f6")}>
                📢 Call
              </button>
            )}
            {patient.status === "in-progress" && (
              <button onClick={() => onComplete(patient)} style={btnStyle("#065f46", "#10b981")}>
                ✅ Done
              </button>
            )}
            <button onClick={() => onDelete(patient.id)} style={btnStyle("#991b1b", "#ef4444")}>
              🗑 Remove
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function btnStyle(bg, border) {
  return {
    background: `${bg}10`,
    border: `1px solid ${border}40`,
    borderRadius: 8,
    padding: "6px 10px",
    color: bg,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  };
}