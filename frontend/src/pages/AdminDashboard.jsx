import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import QueueCard from "../components/QueueCard";
import BookingForm from "../components/BookingForm";
import { callPatient, completePatient, deletePatient, updatePatientNotes } from "../api";

const socket = io({ path: "/socket.io" });

export default function AdminDashboard({ user, onLogout }) {
  const [data, setData] = useState({ patients: [], completed: [] });
  const [tab, setTab] = useState("queue");
  const [connected, setConnected] = useState(false);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ open: false, patientId: null, patientName: "" });
  const [conclusion, setConclusion] = useState("");

  // Notes for in-progress patient (local state, synced with server)
  const [doctorNotes, setDoctorNotes] = useState("");
  const notesTimeoutRef = useRef(null);

  useEffect(() => {
    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("queueUpdate", setData);
    socket.on("patientNotesUpdated", ({ patientId, notes }) => {
      // Update local state if it's the current in-progress patient
      const inProgress = data.patients.find(p => p.status === "in-progress");
      if (inProgress && inProgress.id === patientId) {
        setDoctorNotes(notes);
      }
      // Also update the patient in the main data (for QueueCard display)
      setData(prev => ({
        ...prev,
        patients: prev.patients.map(p =>
          p.id === patientId ? { ...p, notes } : p
        ),
      }));
    });

    return () => {
      socket.off("queueUpdate");
      socket.off("connect");
      socket.off("disconnect");
      socket.off("patientNotesUpdated");
    };
  }, [data.patients]);

  // When in-progress patient changes, update local notes state
  useEffect(() => {
    const inProgress = data.patients.find(p => p.status === "in-progress");
    setDoctorNotes(inProgress?.notes || "");
  }, [data.patients]);

  const showToast = (msg, color = "#10b981") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCall = async (id) => {
    await callPatient(id).catch(() => {});
    showToast("Patient called to the doctor!", "#3b82f6");
  };

  const openConclusionModal = (patient) => {
    setModal({ open: true, patientId: patient.id, patientName: patient.name });
    setConclusion("");
  };

  const handleCompleteWithConclusion = async () => {
    const { patientId, patientName } = modal;
    if (!patientId) return;
    await completePatient(patientId, conclusion).catch(() => {});
    showToast(`${patientName} marked as completed. Next patient up!`);
    setModal({ open: false, patientId: null, patientName: "" });
    setConclusion("");
  };

  const handleDelete = async (id) => {
    if (!confirm("Remove this patient from the queue?")) return;
    await deletePatient(id).catch(() => {});
    showToast("Patient removed from queue.", "#f59e0b");
  };

  // Auto-save doctor notes on change (debounced)
  const handleNotesChange = (e) => {
    const notes = e.target.value;
    setDoctorNotes(notes);

    const inProgress = data.patients.find(p => p.status === "in-progress");
    if (!inProgress) return;

    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current);
    notesTimeoutRef.current = setTimeout(async () => {
      try {
        await updatePatientNotes(inProgress.id, notes);
      } catch (err) {
        console.error("Failed to save notes", err);
      }
    }, 500);
  };

  const queue = data.patients;
  const completed = data.completed;

  const stats = [
    { label: "Waiting", value: queue.filter((p) => p.status === "waiting").length, color: "#3b82f6" },
    { label: "With Doctor", value: queue.filter((p) => p.status === "in-progress").length, color: "#8b5cf6" },
    { label: "🔴 Critical", value: queue.filter((p) => p.condition === "critical").length, color: "#e53935" },
    { label: "🟡 Urgent", value: queue.filter((p) => p.condition === "urgent").length, color: "#f59e0b" },
    { label: "Completed Today", value: completed.length, color: "#10b981" },
  ];

  const nextPatient = queue.find((p) => p.status === "waiting");
  const inProgress = queue.find((p) => p.status === "in-progress");

  const tabStyle = (active) => ({
    padding: "10px 20px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "'DM Sans',sans-serif",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.2s",
    background: active ? "#fee2e2" : "transparent",
    color: active ? "#b91c1c" : "#64748b",
    borderBottom: active ? "2px solid #e53935" : "2px solid transparent",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", paddingBottom: 60 }}>
      <style>{`*{box-sizing:border-box} button:hover:not(:disabled){opacity:0.85}`}</style>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: "fixed",
            top: 20,
            right: 20,
            zIndex: 9999,
            background: toast.color,
            color: "#fff",
            borderRadius: 10,
            padding: "12px 20px",
            fontWeight: 600,
            fontSize: 14,
            fontFamily: "'DM Sans',sans-serif",
            boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
            animation: "slideIn 0.3s ease",
          }}
        >
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes slideIn{from{transform:translateX(40px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      {/* Conclusion Modal (unchanged) */}
      {modal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
          }}
        >
          <div
            style={{
              background: "#ffffff",
              borderRadius: 16,
              padding: "24px",
              width: "90%",
              maxWidth: 500,
              border: "1px solid #e2e8f0",
              boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
            }}
          >
            <h3 style={{ color: "#0f172a", marginBottom: 8 }}>
              Complete Appointment – {modal.patientName}
            </h3>
            <p style={{ color: "#64748b", fontSize: 13, marginBottom: 16 }}>
              Add final conclusion (optional)
            </p>
            <textarea
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Final diagnosis, prescription, or notes..."
              style={{
                width: "100%",
                background: "#ffffff",
                border: "1px solid #cbd5e1",
                borderRadius: 10,
                padding: "12px",
                color: "#0f172a",
                fontSize: 14,
                resize: "vertical",
                minHeight: 100,
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 20,
              }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                onClick={() => setModal({ open: false, patientId: null, patientName: "" })}
                style={{
                  background: "transparent",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 20px",
                  color: "#64748b",
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWithConclusion}
                style={{
                  background: "linear-gradient(135deg,#10b981,#047857)",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 20px",
                  color: "#fff",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                ✅ Confirm Completion
              </button>
            </div>
          </div>
        </div>
      )}

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
            maxWidth: 1100,
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
              <div style={{ fontSize: 11, color: "#64748b" }}>
                {user.role === "admin" ? "Admin Dashboard" : "Doctor Dashboard"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, color: connected ? "#10b981" : "#94a3b8" }}>
              {connected ? "● Live" : "○ Connecting…"}
            </span>
            <span style={{ fontSize: 13, color: "#475569" }}>{user.name}</span>
            <button
              onClick={onLogout}
              style={{
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "6px 14px",
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

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px 0" }}>
        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5,1fr)",
            gap: 10,
            marginBottom: 24,
          }}
        >
          {stats.map((s) => (
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
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: s.color,
                  fontFamily: "'DM Serif Display',serif",
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          {/* Left — Main queue panel */}
          <div>
            {/* Tab bar */}
            <div
              style={{
                display: "flex",
                background: "#ffffff",
                borderRadius: 10,
                padding: 4,
                marginBottom: 20,
                gap: 4,
                border: "1px solid #e2e8f0",
              }}
            >
              <button style={tabStyle(tab === "queue")} onClick={() => setTab("queue")}>
                👥 Queue ({queue.length})
              </button>
              {user.role === "admin" && (
                <button style={tabStyle(tab === "add")} onClick={() => setTab("add")}>
                  ➕ Add Patient
                </button>
              )}
              <button style={tabStyle(tab === "completed")} onClick={() => setTab("completed")}>
                ✅ Completed ({completed.length})
              </button>
            </div>

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "24px",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              }}
            >
              {tab === "queue" && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontFamily: "'DM Serif Display',serif",
                        fontSize: 20,
                        color: "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      Active Queue
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      🔴 Critical first → 🟡 Urgent → 🟢 Normal (FCFS)
                    </div>
                  </div>
                  {queue.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                      <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
                      <div style={{ fontSize: 16 }}>Queue is clear!</div>
                    </div>
                  ) : (
                    queue.map((p) => (
                      <QueueCard
                        key={p.id}
                        patient={p}
                        isAdmin
                        onCall={handleCall}
                        onComplete={() => openConclusionModal(p)}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </>
              )}

              {tab === "add" && user.role === "admin" && (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        fontFamily: "'DM Serif Display',serif",
                        fontSize: 20,
                        color: "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      Add New Patient
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Walk-in registration by admin or doctor
                    </div>
                  </div>
                  <BookingForm onBooked={() => setTab("queue")} />
                </>
              )}

              {tab === "completed" && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        fontFamily: "'DM Serif Display',serif",
                        fontSize: 20,
                        color: "#0f172a",
                        marginBottom: 4,
                      }}
                    >
                      Completed Patients
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>Last 50 records</div>
                  </div>
                  {completed.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0", color: "#94a3b8" }}>
                      <div style={{ fontSize: 13 }}>No completed patients yet</div>
                    </div>
                  ) : (
                    completed.map((p) => (
                      <div key={p.id} style={{ marginBottom: 16 }}>
                        <QueueCard patient={p} isAdmin={false} />
                        {p.conclusion && (
                          <div
                            style={{
                              marginTop: 8,
                              marginLeft: 56,
                              padding: "8px 12px",
                              background: "#f0fdf4",
                              borderLeft: "3px solid #10b981",
                              borderRadius: 6,
                              fontSize: 13,
                              color: "#065f46",
                            }}
                          >
                            <span style={{ fontWeight: 600, marginRight: 8 }}>📋 Final Conclusion:</span>
                            {p.conclusion}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right — Status panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Currently with doctor */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                With Doctor Now
              </div>
              {inProgress ? (
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
                    {inProgress.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                    Age {inProgress.age}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569", marginTop: 6 }}>
                    {inProgress.symptoms}
                  </div>

                  {/* Doctor's Notes (editable) */}
                  <div style={{ marginTop: 16 }}>
                    <label
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 600,
                        marginBottom: 6,
                        display: "block",
                      }}
                    >
                      📝 Doctor's Notes (live)
                    </label>
                    <textarea
                      value={doctorNotes}
                      onChange={handleNotesChange}
                      placeholder="Write observations, prescriptions, etc. (auto-saves)"
                      style={{
                        width: "100%",
                        background: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: 8,
                        padding: "10px",
                        color: "#0f172a",
                        fontSize: 13,
                        resize: "vertical",
                        minHeight: 80,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    />
                  </div>

                  <button
                    onClick={() => openConclusionModal(inProgress)}
                    style={{
                      marginTop: 14,
                      width: "100%",
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                      borderRadius: 8,
                      padding: "10px",
                      color: "#047857",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    ✅ Mark as Completed
                  </button>
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>No patient with doctor</div>
              )}
            </div>

            {/* Next in queue */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Next Patient
              </div>
              {nextPatient ? (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
                      {nextPatient.name}
                    </div>
                    {{
                      critical: (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#fee2e2",
                            color: "#b91c1c",
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontWeight: 700,
                          }}
                        >
                          🔴 Critical
                        </span>
                      ),
                      urgent: (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#fef3c7",
                            color: "#b45309",
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontWeight: 700,
                          }}
                        >
                          🟡 Urgent
                        </span>
                      ),
                      normal: (
                        <span
                          style={{
                            fontSize: 11,
                            background: "#d1fae5",
                            color: "#047857",
                            padding: "2px 8px",
                            borderRadius: 20,
                            fontWeight: 700,
                          }}
                        >
                          🟢 Normal
                        </span>
                      ),
                    }[nextPatient.condition]}
                  </div>
                  <div style={{ fontSize: 12, color: "#475569" }}>{nextPatient.symptoms}</div>
                  <button
                    onClick={() => handleCall(nextPatient.id)}
                    style={{
                      marginTop: 14,
                      width: "100%",
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      borderRadius: 8,
                      padding: "10px",
                      color: "#1d4ed8",
                      fontWeight: 700,
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "'DM Sans',sans-serif",
                    }}
                  >
                    📢 Call Patient
                  </button>
                </div>
              ) : (
                <div style={{ color: "#94a3b8", fontSize: 13 }}>Queue is empty</div>
              )}
            </div>

            {/* Priority legend */}
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 16,
                padding: "20px",
                boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.05)",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  marginBottom: 14,
                }}
              >
                Scheduling Logic
              </div>
              {[
                ["🔴 Critical", "Immediate — highest priority", "#e53935"],
                ["🟡 Urgent", "Medium — second priority", "#f59e0b"],
                ["🟢 Normal", "FCFS — booking order", "#10b981"],
              ].map(([l, d, c]) => (
                <div key={l} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 3, background: c, borderRadius: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c }}>{l}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{d}</div>
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