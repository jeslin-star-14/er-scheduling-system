import React, { useState, useEffect } from "react";
import { login, getHospital } from "../api";

const s = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'DM Sans', sans-serif",
  },
  left: {
    flex: 1,
    background: "linear-gradient(145deg, #0f172a 0%, #1a1f35 50%, #0f1923 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "60px 48px",
    position: "relative",
    overflow: "hidden",
  },
  pulse: {
    position: "absolute",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(229,57,53,0.12) 0%, transparent 70%)",
    animation: "pulse 4s ease-in-out infinite",
  },
  cross: {
    fontSize: 72,
    marginBottom: 24,
    position: "relative",
    zIndex: 1,
    filter: "drop-shadow(0 0 20px rgba(229,57,53,0.5))",
  },
  hospitalName: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 36,
    fontWeight: 400,
    color: "#fff",
    textAlign: "center",
    lineHeight: 1.2,
    position: "relative",
    zIndex: 1,
    marginBottom: 12,
    letterSpacing: "-0.5px",
  },
  tagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    textAlign: "center",
    position: "relative",
    zIndex: 1,
    marginBottom: 48,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  infoCard: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "24px 32px",
    width: "100%",
    maxWidth: 380,
    position: "relative",
    zIndex: 1,
    backdropFilter: "blur(10px)",
  },
  infoRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
  },
  infoIcon: { fontSize: 18, minWidth: 24, textAlign: "center" },
  infoLabel: { color: "rgba(255,255,255,0.35)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 },
  infoVal: { color: "#e2e8f0", fontWeight: 600 },
  emergency: {
    background: "rgba(229,57,53,0.12)",
    border: "1px solid rgba(229,57,53,0.3)",
    borderRadius: 12,
    padding: "12px 20px",
    marginTop: 16,
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#fca5a5",
    fontSize: 14,
    fontWeight: 600,
  },
  right: {
    width: 480,
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    padding: "60px 48px",
    borderLeft: "1px solid rgba(255,255,255,0.06)",
  },
  loginTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 30,
    color: "#f1f5f9",
    marginBottom: 8,
  },
  loginSub: { color: "#64748b", fontSize: 14, marginBottom: 36 },
  label: { display: "block", fontSize: 12, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, fontWeight: 600 },
  input: {
    width: "100%",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    padding: "14px 16px",
    color: "#e2e8f0",
    fontSize: 15,
    outline: "none",
    transition: "border-color 0.2s",
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: 20,
  },
  btn: {
    width: "100%",
    background: "linear-gradient(135deg, #e53935, #b71c1c)",
    border: "none",
    borderRadius: 10,
    padding: "15px",
    color: "#fff",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    letterSpacing: "0.04em",
    marginTop: 8,
    transition: "opacity 0.2s, transform 0.1s",
    fontFamily: "'DM Sans', sans-serif",
  },
  error: {
    background: "rgba(229,57,53,0.1)",
    border: "1px solid rgba(229,57,53,0.3)",
    borderRadius: 8,
    padding: "12px 16px",
    color: "#fca5a5",
    fontSize: 13,
    marginBottom: 20,
    textAlign: "center",
  },
  hint: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    padding: "16px",
    marginTop: 24,
  },
  hintTitle: { fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontWeight: 600 },
  hintRow: { display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 6 },
  hintUser: { color: "#94a3b8", fontWeight: 600 },
  hintRole: { color: "#e53935", fontSize: 11 },
};

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hospital, setHospital] = useState(null);

  useEffect(() => {
    getHospital().then(setHospital).catch(() => {});
  }, []);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(form.username, form.password);
      onLogin(data);
    } catch {
      setError("Invalid username or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:translateX(-50%) scale(1);opacity:1} 50%{transform:translateX(-50%) scale(1.1);opacity:0.7} }
        input:focus { border-color: rgba(229,57,53,0.5) !important; box-shadow: 0 0 0 3px rgba(229,57,53,0.1); }
        button:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        button:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      {/* Left — Hospital branding */}
      <div style={s.left}>
        <div style={s.pulse} />
        <div style={s.cross}>🏥</div>
        <div style={s.hospitalName}>
          {hospital?.name || "City ER Medical Center"}
        </div>
        <div style={s.tagline}>Emergency Scheduling System</div>

        <div style={s.infoCard}>
          <div style={s.infoRow}>
            <span style={s.infoIcon}>📞</span>
            <div>
              <div style={s.infoLabel}>Main Line</div>
              <div style={s.infoVal}>{hospital?.phone || "+91-044-2345-6789"}</div>
            </div>
          </div>
          <div style={s.infoRow}>
            <span style={s.infoIcon}>📍</span>
            <div>
              <div style={s.infoLabel}>Address</div>
              <div style={s.infoVal}>{hospital?.address || "Chennai, Tamil Nadu"}</div>
            </div>
          </div>
          <div style={{ ...s.infoRow, marginBottom: 0 }}>
            <span style={s.infoIcon}>🕐</span>
            <div>
              <div style={s.infoLabel}>Hours</div>
              <div style={s.infoVal}>24 / 7 Emergency Services</div>
            </div>
          </div>
          <div style={s.emergency}>
            <span>🚨</span>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8 }}>EMERGENCY HELPLINE</div>
              <div>{hospital?.emergency || "108"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right — Login form */}
      <div style={s.right}>
        <div style={s.loginTitle}>Welcome back</div>
        <div style={s.loginSub}>Sign in to access the scheduling portal</div>

        {error && <div style={s.error}>{error}</div>}

        <form onSubmit={handle}>
          <label style={s.label}>Username</label>
          <input
            style={s.input}
            type="text"
            placeholder="Enter username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            autoComplete="username"
          />
          <label style={s.label}>Password</label>
          <input
            style={s.input}
            type="password"
            placeholder="Enter password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="current-password"
          />
          <button style={s.btn} type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <div style={s.hint}>
          <div style={s.hintTitle}>Demo Credentials</div>
          {[
            ["admin", "admin123", "Admin"],
            ["doctor", "doctor123", "Doctor"],
            ["patient", "patient123", "Patient"],
          ].map(([u, p, r]) => (
            <div key={u} style={s.hintRow}>
              <span style={s.hintUser}>{u} / {p}</span>
              <span style={s.hintRole}>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}