import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import BookingForm from "../components/BookingForm";
import QueueCard from "../components/QueueCard";

const socket = io({ path: "/socket.io" });

export default function PatientBooking({ user, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [tab, setTab] = useState("book"); // book | queue
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("queueUpdate", ({ patients }) => setQueue(patients));
    return () => { socket.off("queueUpdate"); socket.off("connect"); socket.off("disconnect"); };
  }, []);

  const stats = {
    total: queue.length,
    critical: queue.filter((p) => p.condition === "critical").length,
    urgent: queue.filter((p) => p.condition === "urgent").length,
    normal: queue.filter((p) => p.condition === "normal").length,
  };

  const tabStyle = (active) => ({
    flex: 1, padding: "12px", border: "none", borderRadius: 8, cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 600, transition: "all 0.2s",
    background: active ? "rgba(229,57,53,0.15)" : "transparent",
    color: active ? "#fca5a5" : "#64748b",
    borderBottom: active ? "2px solid #e53935" : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--slate, #0f172a)", padding: "0 0 60px" }}>
      <style>{`
        :root { --slate:#0f172a; }
        * { box-sizing:border-box; }
        button:hover:not(:disabled){opacity:0.85}
      `}</style>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏥</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>City ER Medical Center</div>
              <div style={{ fontSize: 11, color: "#475569" }}>Patient Portal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: connected ? "#10b981" : "#64748b" }}>
              {connected ? "● Live" : "○ Connecting"}
            </span>
            <span style={{ fontSize: 13, color: "#64748b" }}>Welcome, {user.name}</span>
            <button onClick={onLogout} style={{ background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.2)", borderRadius: 8, padding: "6px 12px", color: "#fca5a5", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px 0" }}>

        {/* Stats strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 28 }}>
          {[
            { label: "In Queue", value: stats.total, color: "#60a5fa" },
            { label: "🔴 Critical", value: stats.critical, color: "#e53935" },
            { label: "🟡 Urgent", value: stats.urgent, color: "#f59e0b" },
            { label: "🟢 Normal", value: stats.normal, color: "#10b981" },
          ].map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, marginBottom: 24 }}>
          <button style={tabStyle(tab === "book")} onClick={() => setTab("book")}>📋 Book Appointment</button>
          <button style={tabStyle(tab === "queue")} onClick={() => setTab("queue")}>👥 Live Queue ({queue.length})</button>
        </div>

        {/* Content */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 28px" }}>
          {tab === "book" ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 6 }}>New Appointment</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>Fill in the details below. Critical patients are prioritized automatically.</div>
              </div>
              <BookingForm onBooked={() => setTab("queue")} />
            </>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: "#f1f5f9", marginBottom: 6 }}>Live Queue</div>
                <div style={{ fontSize: 13, color: "#64748b" }}>🔴 Critical → 🟡 Urgent → 🟢 Normal (FCFS within same level)</div>
              </div>
              {queue.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#334155" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🏥</div>
                  <div>No patients in queue right now</div>
                </div>
              ) : (
                queue.map((p) => <QueueCard key={p.id} patient={p} isAdmin={false} />)
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}