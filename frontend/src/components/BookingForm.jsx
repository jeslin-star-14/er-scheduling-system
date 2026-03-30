import React, { useState } from "react";
import { addPatient } from "../api";

const CONDITIONS = [
  {
    value: "critical",
    label: "🔴 Critical — Emergency",
    desc: "Life-threatening, needs immediate attention",
    color: "#e53935",
    bg: "rgba(229,57,53,0.08)",
    border: "rgba(229,57,53,0.4)",
  },
  {
    value: "urgent",
    label: "🟡 Urgent — Serious",
    desc: "Severe pain or rapidly worsening condition",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.4)",
  },
  {
    value: "normal",
    label: "🟢 Normal — Routine",
    desc: "Non-emergency, general consultation",
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "rgba(16,185,129,0.4)",
  },
];

const field = {
  label: { fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 6, display: "block" },
  input: {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "13px 14px", color: "#e2e8f0", fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif", marginBottom: 18,
  },
  textarea: {
    width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10, padding: "13px 14px", color: "#e2e8f0", fontSize: 14,
    outline: "none", fontFamily: "'DM Sans', sans-serif", resize: "vertical", minHeight: 80, marginBottom: 18,
  },
};

export default function BookingForm({ onBooked }) {
  const [form, setForm] = useState({ name: "", age: "", symptoms: "", phone: "", condition: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.condition) { setError("Please select a condition level."); return; }
    setError("");
    setLoading(true);
    try {
      const patient = await addPatient(form);
      setSuccess(patient);
      setForm({ name: "", age: "", symptoms: "", phone: "", condition: "" });
      onBooked && onBooked(patient);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to book appointment.");
    } finally {
      setLoading(false);
    }
  };

  if (success) return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#10b981", marginBottom: 8 }}>Appointment Confirmed!</div>
      <div style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>
        Queue position: <strong style={{ color: "#f1f5f9" }}>#{success.queuePosition}</strong>
        &nbsp;·&nbsp; Estimated wait: <strong style={{ color: "#f59e0b" }}>~{success.estimatedWait} min</strong>
      </div>
      <div style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "16px 24px", display: "inline-block", textAlign: "left", marginBottom: 24 }}>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>Patient: <strong style={{ color: "#f1f5f9" }}>{success.name}</strong></div>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>Condition: <strong style={{ color: CONDITIONS.find(c=>c.value===success.condition)?.color }}>{CONDITIONS.find(c=>c.value===success.condition)?.label}</strong></div>
      </div>
      <div>
        <button onClick={() => setSuccess(null)} style={{ background: "linear-gradient(135deg,#e53935,#b71c1c)", border: "none", borderRadius: 10, padding: "12px 28px", color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14, fontFamily: "'DM Sans',sans-serif" }}>
          Book Another
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={submit}>
      <style>{`input:focus,textarea:focus,select:focus{border-color:rgba(229,57,53,0.5)!important;box-shadow:0 0 0 3px rgba(229,57,53,0.1);}`}</style>

      {error && (
        <div style={{ background: "rgba(229,57,53,0.1)", border: "1px solid rgba(229,57,53,0.3)", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 18 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
        <div>
          <label style={field.label}>Full Name *</label>
          <input style={field.input} value={form.name} onChange={set("name")} placeholder="Patient's full name" required />
        </div>
        <div>
          <label style={field.label}>Age *</label>
          <input style={field.input} type="number" min="0" max="150" value={form.age} onChange={set("age")} placeholder="Age in years" required />
        </div>
      </div>

      <label style={field.label}>Phone Number</label>
      <input style={field.input} type="tel" value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX (optional)" />

      <label style={field.label}>Symptoms / Reason for Visit *</label>
      <textarea style={field.textarea} value={form.symptoms} onChange={set("symptoms")} placeholder="Describe the symptoms or reason for visit…" required />

      {/* Condition Level */}
      <label style={{ ...field.label, marginBottom: 12 }}>Condition Level * <span style={{ color: "#475569", fontSize: 11, textTransform: "none", letterSpacing: 0 }}>— determines queue priority</span></label>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {CONDITIONS.map((c) => {
          const selected = form.condition === c.value;
          return (
            <label key={c.value} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "14px 16px",
              border: `1px solid ${selected ? c.border : "rgba(255,255,255,0.08)"}`,
              borderRadius: 12, cursor: "pointer",
              background: selected ? c.bg : "rgba(255,255,255,0.02)",
              transition: "all 0.15s",
            }}>
              <input type="radio" name="condition" value={c.value} checked={selected} onChange={set("condition")} style={{ display: "none" }} />
              <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? c.color : "#334155"}`, background: selected ? c.color : "transparent", transition: "all 0.15s", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: selected ? c.color : "#94a3b8" }}>{c.label}</div>
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>{c.desc}</div>
              </div>
            </label>
          );
        })}
      </div>

      <button type="submit" disabled={loading} style={{
        width: "100%", background: "linear-gradient(135deg,#e53935,#b71c1c)", border: "none",
        borderRadius: 10, padding: "15px", color: "#fff", fontSize: 15, fontWeight: 700,
        cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1,
        fontFamily: "'DM Sans',sans-serif", letterSpacing: "0.04em",
      }}>
        {loading ? "Booking…" : "📋 Confirm Appointment"}
      </button>
    </form>
  );
}