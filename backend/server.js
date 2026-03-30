const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] },
});

app.use(cors());
app.use(express.json());

// ─── In-Memory Store ──────────────────────────────────────────────────────────
let patients = [];
let completedPatients = [];

// Credentials
const USERS = {
  admin: { password: "admin123", role: "admin", name: "Dr. Admin" },
  doctor: { password: "doctor123", role: "doctor", name: "Dr. Sharma" },
  patient: { password: "patient123", role: "patient", name: "Patient Portal" },
};

// Hospital Info
const HOSPITAL = {
  name: "City ER Medical Center",
  phone: "+91-044-2345-6789",
  emergency: "108",
  address: "123, Anna Salai, Chennai, Tamil Nadu - 600002",
};

// ─── Priority Score ───────────────────────────────────────────────────────────
// Critical=3, Urgent=2, Normal=1 — higher score = served first
function priorityScore(condition) {
  if (condition === "critical") return 3;
  if (condition === "urgent") return 2;
  return 1;
}

// Sort queue: by priority desc, then by bookingTime asc (FCFS within same level)
function sortQueue() {
  patients.sort((a, b) => {
    const pd = priorityScore(b.condition) - priorityScore(a.condition);
    if (pd !== 0) return pd;
    return new Date(a.bookingTime) - new Date(b.bookingTime);
  });
  // Reassign queue positions
  patients.forEach((p, i) => (p.queuePosition = i + 1));
}

// Estimate waiting time (5 min per patient ahead)
function estimateWait(position) {
  return (position - 1) * 5;
}

function broadcastQueue() {
  sortQueue();
  const enriched = patients.map((p) => ({
    ...p,
    estimatedWait: estimateWait(p.queuePosition),
  }));
  io.emit("queueUpdate", { patients: enriched, completed: completedPatients });
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = USERS[username];
  if (!user || user.password !== password)
    return res.status(401).json({ error: "Invalid credentials" });
  res.json({ username, role: user.role, name: user.name, hospital: HOSPITAL });
});

app.get("/api/hospital", (_req, res) => res.json(HOSPITAL));

// ─── Patients ─────────────────────────────────────────────────────────────────
app.get("/api/patients", (_req, res) => {
  sortQueue();
  const enriched = patients.map((p) => ({
    ...p,
    estimatedWait: estimateWait(p.queuePosition),
  }));
  res.json({ patients: enriched, completed: completedPatients });
});

app.post("/api/patients", (req, res) => {
  const { name, age, symptoms, condition, phone } = req.body;
  if (!name || !age || !symptoms || !condition)
    return res.status(400).json({ error: "All fields are required" });

  const patient = {
    id: uuidv4(),
    name,
    age: Number(age),
    symptoms,
    condition, // "normal" | "urgent" | "critical"
    phone: phone || "",
    bookingTime: new Date().toISOString(),
    status: "waiting", // waiting | in-progress | completed
    queuePosition: patients.length + 1,
  };

  patients.push(patient);
  broadcastQueue();

  const enriched = {
    ...patient,
    estimatedWait: estimateWait(patient.queuePosition),
  };
  res.status(201).json(enriched);
});

// Mark patient as in-progress (called to the doctor)
app.put("/api/patients/:id/call", (req, res) => {
  const patient = patients.find((p) => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: "Patient not found" });
  patient.status = "in-progress";
  broadcastQueue();
  res.json(patient);
});

// Mark patient as completed → remove from queue
app.put("/api/patients/:id/complete", (req, res) => {
  const idx = patients.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Patient not found" });
  const [done] = patients.splice(idx, 1);
  done.status = "completed";
  done.completedAt = new Date().toISOString();
  completedPatients.unshift(done);
  if (completedPatients.length > 50) completedPatients.pop();
  broadcastQueue();
  res.json(done);
});

// Delete patient from queue (admin)
app.delete("/api/patients/:id", (req, res) => {
  const idx = patients.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Patient not found" });
  patients.splice(idx, 1);
  broadcastQueue();
  res.json({ success: true });
});

// Stats
app.get("/api/stats", (_req, res) => {
  const waiting = patients.filter((p) => p.status === "waiting").length;
  const inProgress = patients.filter((p) => p.status === "in-progress").length;
  const critical = patients.filter((p) => p.condition === "critical").length;
  const urgent = patients.filter((p) => p.condition === "urgent").length;
  res.json({
    waiting,
    inProgress,
    critical,
    urgent,
    completed: completedPatients.length,
    total: patients.length + completedPatients.length,
  });
});

// ─── Socket.io ────────────────────────────────────────────────────────────────
io.on("connection", (socket) => {
  sortQueue();
  const enriched = patients.map((p) => ({
    ...p,
    estimatedWait: estimateWait(p.queuePosition),
  }));
  socket.emit("queueUpdate", { patients: enriched, completed: completedPatients });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;
server.listen(PORT, () =>
  console.log(`✅  ER Scheduling Server running on http://localhost:${PORT}`)
);