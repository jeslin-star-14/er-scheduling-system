# er-scheduling-system
OS (OPERATING SYSTEM)
# 🏥 ER Scheduling System

**City ER Medical Center — Emergency Room Patient Scheduling**

## Folder Structure

```
er-scheduling-system/
├── backend/
│   ├── server.js          ← Express + Socket.io + all API routes
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx            ← Router + auth state
    │   ├── main.jsx
    │   ├── api.js             ← All API calls (axios)
    │   ├── pages/
    │   │   ├── Login.jsx          ← Login with hospital info
    │   │   ├── PatientBooking.jsx ← Patient portal
    │   │   └── AdminDashboard.jsx ← Admin/Doctor dashboard
    │   └── components/
    │       ├── QueueCard.jsx      ← Patient card in queue
    │       └── BookingForm.jsx    ← Appointment booking form
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Quick Start

### 1. Backend
```bash
cd backend
npm install
node server.js
# Runs on http://localhost:4000
```

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

## Login Credentials

| Username | Password   | Role    | Access              |
|----------|------------|---------|---------------------|
| admin    | admin123   | Admin   | Full dashboard       |
| doctor   | doctor123  | Doctor  | Dashboard + queue   |
| patient  | patient123 | Patient | Book + view queue   |

## Scheduling Logic

```
🔴 Critical  → First (Emergency, highest priority)
🟡 Urgent    → Second (Serious condition)
🟢 Normal    → Last (FCFS — First Come First Serve)
```

Within the same condition level, patients are served in booking order (FCFS).

## Features

- **Live Queue** — Real-time updates via Socket.io
- **Priority Scheduling** — Critical > Urgent > Normal
- **FCFS within same level** — Booking time determines order
- **Waiting time estimate** — ~5 min per patient ahead
- **Admin controls** — Call patient, Mark complete, Remove
- **Auto-advance** — Next patient appears when current is done
- **Patient Portal** — Self-booking with condition selection
- **Completed History** — Last 50 completed patients logged

## Hospital Info

- **Name:** City ER Medical Center  
- **Phone:** +91-044-2345-6789  
- **Emergency:** 108  
- **Address:** 123, Anna Salai, Chennai, Tamil Nadu - 600002