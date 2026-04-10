import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import BookingForm from "../components/BookingForm";
import QueueCard from "../components/QueueCard";

const socket = io({ path: "/socket.io" });

export default function PatientBooking({ user, onLogout }) {
  const [queue, setQueue] = useState([]);
  const [tab, setTab] = useState("book");
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("queueUpdate", ({ patients }) => setQueue(patients));
    return () => {
      socket.off("queueUpdate");
      socket.off("connect");
      socket.off("disconnect");
    };
  }, []);

  const stats = {
    total: queue.length,
    critical: queue.filter((p) => p.condition === "critical").length,
    urgent: queue.filter((p) => p.condition === "urgent").length,
    normal: queue.filter((p) => p.condition === "normal").length,
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: "12px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.2s",
    background: active ? "#fee2e2" : "transparent",
    color: active ? "#b91c1c" : "#64748b",
    borderBottom: active ? "2px solid #e53935" : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "0 0 60px" }}>
      <style>{`
        * { box-sizing:border-box; }
        button:hover:not(:disabled){opacity:0.85}
      `}</style>

      {/* Header */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0 24px",
        }}
      >
        <div
          style={{
            maxWidth: 780,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏥</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                City ER Medical Center
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>Patient Portal</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: connected ? "#10b981" : "#94a3b8" }}>
              {connected ? "● Live" : "○ Connecting"}
            </span>
            <span style={{ fontSize: 13, color: "#475569" }}>Welcome, {user.name}</span>
            <button
              onClick={onLogout}
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "6px 12px",
                color: "#b91c1c",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 780, margin: "0 auto", padding: "32px 24px 0" }}>
        {/* Stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4,1fr)",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {[
            { label: "In Queue", value: stats.total, color: "#3b82f6" },
            { label: "🔴 Critical", value: stats.critical, color: "#e53935" },
            { label: "🟡 Urgent", value: stats.urgent, color: "#f59e0b" },
            { label: "🟢 Normal", value: stats.normal, color: "#10b981" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "center",
                boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            background: "#ffffff",
            borderRadius: 10,
            padding: 4,
            marginBottom: 24,
            border: "1px solid #e2e8f0",
          }}
        >
          <button style={tabStyle(tab === "book")} onClick={() => setTab("book")}>
            📋 Book Appointment
          </button>
          <button style={tabStyle(tab === "queue")} onClick={() => setTab("queue")}>
            👥 Live Queue ({queue.length})
          </button>
        </div>

        {/* Content */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 16,
            padding: "28px 28px",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
          }}
        >
          {tab === "book" ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: 22,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  New Appointment
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Fill in the details below. Critical patients are prioritized automatically.
                </div>
              </div>
              <BookingForm onBooked={() => setTab("queue")} />
            </>
          ) : (
            <>
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontFamily: "'DM Serif Display',serif",
                    fontSize: 22,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  Live Queue
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  🔴 Critical → 🟡 Urgent → 🟢 Normal (FCFS within same level)
                </div>
              </div>
              {queue.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>
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