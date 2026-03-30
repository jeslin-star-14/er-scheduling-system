import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import QueueCard from "../components/QueueCard";
import BookingForm from "../components/BookingForm";
import { callPatient, completePatient, deletePatient } from "../api";

const socket = io({ path: "/socket.io" });

export default function AdminDashboard({ user, onLogout }) {
  const [data, setData] = useState({ patients: [], completed: [] });
  const [tab, setTab] = useState("queue"); // queue | add | completed
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("queueUpdate", setData);
    return () => { socket.off("queueUpdate"); socket.off("connect"); socket.off("disconnect"); };
  }, []);

  const showToast = (msg, color = "#10b981") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCall = async (id) => {
    await callPatient(id).catch(() => {});
    showToast("Patient called to the doctor!", "#60a5fa");
  };

  const handleComplete = async (id) => {
    const p = data.patients.find((x) => x.id === id);
    await completePatient(id).catch(() => {});
    showToast(`${p?.name || "Patient"} marked as completed. Next patient up!`);
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this patient from the queue?")) return;
    await deletePatient(id).catch(() => {});
    showToast("Patient removed from queue.", "#f59e0b");
  };

  const queue = data.patients;
  const completed = data.completed;

  const stats = [
    { label: "Waiting", value: queue.filter((p) => p.status === "waiting").length, color: "#60a5fa" },
    { label: "With Doctor", value: queue.filter((p) => p.status === "in-progress").length, color: "#a78bfa" },
    { label: "🔴 Critical", value: queue.filter((p) => p.condition === "critical").length, color: "#e53935" },
    { label: "🟡 Urgent", value: queue.filter((p) => p.condition === "urgent").length, color: "#f59e0b" },
    { label: "Completed Today", value: completed.length, color: "#10b981" },
  ];

  const nextPatient = queue.find((p) => p.status === "waiting");
  const inProgress = queue.find((p) => p.status === "in-progress");

  const tabStyle = (active) => ({
    padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, transition: "all 0.2s",
    background: active ? "rgba(229,57,53,0.15)" : "transparent",
    color: active ? "#fca5a5" : "#64748b",
    borderBottom: active ? "2px solid #e53935" : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", paddingBottom: 60 }}>
      <style>{`*{box-sizing:border-box} button:hover:not(:disabled){opacity:0.85}`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.color, color: "#fff", borderRadius: 10, padding: "12px 20px",
          fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans',sans-serif",
          boxShadow: "0 8px 24px rgba(0,0,0,0.3)", animation: "slideIn 0.3s ease",
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Header */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22 }}>🏥</span>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>City ER Medical Center</div>
              <div style={{ fontSize: 11, color: "#475569" }}>
                {user.role === "admin" ? "Admin Dashboard" : "Doctor Dashboard"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: connected ? "#10b981" : "#64748b" }}>
              {connected ? "● Live" : "○ Connecting…"}
            </span>
            <span style={{ fontSize: 13, color: "#94a3b8" }}>{user.name}</span>
            <button onClick={onLogout} style={{ background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.2)", borderRadius: 8, padding: "6px 14px", color: "#fca5a5", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 0" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 10, marginBottom: 24 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: "'DM Serif Display',serif" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* Left — Main queue panel */}
          <div>
            {/* Tab bar */}
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 4, marginBottom: 20, gap: 4 }}>
              <button style={tabStyle(tab === "queue")} onClick={() => setTab("queue")}>👥 Queue ({queue.length})</button>
              <button style={tabStyle(tab === "add")} onClick={() => setTab("add")}>➕ Add Patient</button>
              <button style={tabStyle(tab === "completed")} onClick={() => setTab("completed")}>✅ Completed ({completed.length})</button>
            </div>

            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "24px" }}>
              {tab === "queue" && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Active Queue</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>🔴 Critical first → 🟡 Urgent → 🟢 Normal (FCFS)</div>
                  </div>
                  {queue.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#334155" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                      <div style={{ fontSize: 16 }}>Queue is clear!</div>
                    </div>
                  ) : (
                    queue.map((p) => (
                      <QueueCard key={p.id} patient={p} isAdmin
                        onCall={handleCall}
                        onComplete={handleComplete}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </>
              )}

              {tab === "add" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Add New Patient</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>Walk-in registration by admin or doctor</div>
                  </div>
                  <BookingForm onBooked={() => setTab("queue")} />
                </>
              )}

              {tab === "completed" && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: "#f1f5f9", marginBottom: 4 }}>Completed Patients</div>
                    <div style={{ fontSize: 12, color: "#475569" }}>Last 50 records</div>
                  </div>
                  {completed.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#334155" }}>
                      <div style={{ fontSize: 13 }}>No completed patients yet</div>
                    </div>
                  ) : (
                    completed.map((p) => <QueueCard key={p.id} patient={p} isAdmin={false} />)
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right — Status panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Currently with doctor */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 14 }}>With Doctor Now</div>
              {inProgress ? (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#f1f5f9" }}>{inProgress.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Age {inProgress.age}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{inProgress.symptoms}</div>
                  <button
                    onClick={() => handleComplete(inProgress.id)}
                    style={{ marginTop: 14, width: "100%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 8, padding: "10px", color: "#6ee7b7", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}
                  >
                    ✅ Mark as Completed
                  </button>
                </div>
              ) : (
                <div style={{ color: "#334155", fontSize: 13 }}>No patient with doctor</div>
              )}
            </div>

            {/* Next in queue */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 14 }}>Next Patient</div>
              {nextPatient ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{nextPatient.name}</div>
                    {{
                      critical: <span style={{ fontSize: 11, background: "rgba(229,57,53,0.15)", color: "#fca5a5", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🔴 Critical</span>,
                      urgent:   <span style={{ fontSize: 11, background: "rgba(245,158,11,0.15)", color: "#fcd34d", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🟡 Urgent</span>,
                      normal:   <span style={{ fontSize: 11, background: "rgba(16,185,129,0.15)", color: "#6ee7b7", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🟢 Normal</span>,
                    }[nextPatient.condition]}
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>{nextPatient.symptoms}</div>
                  <button
                    onClick={() => handleCall(nextPatient.id)}
                    style={{ marginTop: 14, width: "100%", background: "rgba(30,64,175,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, padding: "10px", color: "#93c5fd", fontWeight: 700, cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}
                  >
                    📢 Call Patient
                  </button>
                </div>
              ) : (
                <div style={{ color: "#334155", fontSize: 13 }}>Queue is empty</div>
              )}
            </div>

            {/* Priority legend */}
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "20px" }}>
              <div style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 14 }}>Scheduling Logic</div>
              {[
                ["🔴 Critical", "Immediate — highest priority", "#e53935"],
                ["🟡 Urgent", "Medium — second priority", "#f59e0b"],
                ["🟢 Normal", "FCFS — booking order", "#10b981"],
              ].map(([l, d, c]) => (
                <div key={l} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 3, background: c, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{l}</div>
                    <div style={{ fontSize: 11, color: "#475569" }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}