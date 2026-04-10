import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const login = (username, password) =>
  api.post("/login", { username, password }).then((r) => r.data);

export const getPatients = () => api.get("/patients").then((r) => r.data);

export const addPatient = (data) =>
  api.post("/patients", data).then((r) => r.data);

export const callPatient = (id) =>
  api.put(`/patients/${id}/call`).then((r) => r.data);

// ✅ Updated: accepts an optional conclusion payload
export const completePatient = (id, conclusion = "") =>
  api.put(`/patients/${id}/complete`, { conclusion }).then((r) => r.data);

export const deletePatient = (id) =>
  api.delete(`/patients/${id}`).then((r) => r.data);

export const getStats = () => api.get("/stats").then((r) => r.data);

export const getHospital = () => api.get("/hospital").then((r) => r.data);
// ... existing code ...

export const updatePatientNotes = (id, notes) =>
  api.put(`/patients/${id}/notes`, { notes }).then((r) => r.data);