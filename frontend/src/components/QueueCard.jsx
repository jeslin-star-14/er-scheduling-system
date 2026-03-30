import React from "react";

const CONDITION = {
  critical: { label: "🔴 Critical", color: "#e53935", bg: "rgba(229,57,53,0.12)", border: "rgba(229,57,53,0.3)" },
  urgent:   { label: "🟡 Urgent",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  normal:   { label: "🟢 Normal",   color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
};

const STATUS = {
  waiting:     { label: "Waiting",     color: "#94a3b8" },
  "in-progress": { label: "With Doctor", color: "#60a5fa" },
  completed:   { label: "Completed",   color: "#10b981" },
};

export default function QueueCard({ patient, isAdmin, onCall, onComplete, onDelete }) {
  const cond = CONDITION[patient.condition] || CONDITION.normal;
  const stat = STATUS[patient.status] || STATUS.waiting;

  const fmt = (iso) =>
    iso
      ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
      : "—";

  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid rgba(255,255,255,0.07)`,
      borderLeft: `3px solid ${cond.color}`,
      borderRadius: 12,
      padding: "16px 20px",
      marginBottom: 10,
      transition: "background 0.2s",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        {/* Queue number */}
        <div style={{
          minWidth: 40, height: 40, borderRadius: "50%",
          background: cond.bg, border: `1px solid ${cond.border}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, fontWeight: 700, color: cond.color,
        }}>
          {patient.queuePosition || "—"}
        </div>

        {/* Main info */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{patient.name}</span>
            <span style={{ fontSize: 12, color: "#64748b" }}>Age {patient.age}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: cond.bg, color: cond.color, border: `1px solid ${cond.border}`,
            }}>{cond.label}</span>
            <span style={{ fontSize: 11, color: stat.color, fontWeight: 600 }}>● {stat.label}</span>
          </div>
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6 }}>
            <strong style={{ color: "#64748b" }}>Symptoms:</strong> {patient.symptoms}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 12, color: "#475569" }}>
            <span>📅 Booked: {fmt(patient.bookingTime)}</span>
            {patient.phone && <span>📞 {patient.phone}</span>}
            {patient.status === "waiting" && (
              <span style={{ color: "#f59e0b" }}>⏱ ~{patient.estimatedWait} min wait</span>
            )}
          </div>
        </div>

        {/* Actions */}
        {isAdmin && patient.status !== "completed" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 110 }}>
            {patient.status === "waiting" && (
              <button onClick={() => onCall(patient.id)} style={btnStyle("#1e40af", "#3b82f6")}>
                📢 Call
              </button>
            )}
            {patient.status === "in-progress" && (
              <button onClick={() => onComplete(patient.id)} style={btnStyle("#065f46", "#10b981")}>
                ✅ Done
              </button>
            )}
            <button onClick={() => onDelete(patient.id)} style={btnStyle("#7f1d1d", "#ef4444")}>
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
    background: `${bg}99`,
    border: `1px solid ${border}55`,
    borderRadius: 8,
    padding: "6px 10px",
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    whiteSpace: "nowrap",
  };
}