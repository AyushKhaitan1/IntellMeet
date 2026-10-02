# 🤖 IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform

> **Zidio Development Internship Project — Sept/Oct 2026**  
> **Production-Grade MERN Full-Stack System with AI Intelligence**  
> **Prepared for:** Zidio Development – Web Development (MERN) Domain  

---

## 👥 Engineering Team & Domain Ownership

| Team Member | Assigned Domain | Status |
| :--- | :--- | :--- |
| **Ayush (Me)** | **Backend & Database Architecture** | ✅ **Core Foundation Built & Tested** |
| **Vaishali** | **Frontend Engineering (React 19 + TypeScript + Vite + Tailwind)** | 🚀 Ready to Connect to API |
| **Rishika** | **WebRTC + Socket.io + AI Intelligence (Whisper + Summaries)** | 🚀 Ready with Sockets & Intelligence Schemas |
| **Vignesh** | **DevOps + Testing + CI/CD + Cloud Deployment** | 🚀 Ready with Health Probes & Test Suite |

---

## 📁 Repository Structure

```
├── backend/                  # Ayush (Backend + Database)
│   ├── src/
│   │   ├── config/           # MongoDB, Redis, Cloudinary configuration
│   │   ├── controllers/      # Auth, Meeting, Workspace, Task, AI Intelligence, Analytics
│   │   ├── middlewares/      # JWT auth, RBAC, error handling, rate limiting, upload
│   │   ├── models/           # User, Meeting, Workspace, Task, MeetingIntelligence, ChatMessage
│   │   ├── routes/           # REST endpoints mounted at /api/v1/*
│   │   ├── sockets/          # Socket.io event engine & WebRTC signaling bridge
│   │   └── utils/            # Winston logger, API envelopes, JWT token generation
│   ├── scripts/              # Automated integration test suite
│   ├── .env.example
│   └── package.json
├── frontend/                 # Vaishali (React 19 + Vite + Tailwind + shadcn/ui)
└── README.md
```

---

## 🚀 Backend Quickstart

```bash
cd backend
npm install
npm run dev
node scripts/test-api.js
```
See [backend/README.md](file:///c:/Users/DELL/OneDrive/P%20Clg/Zidio%20-%20IntellMeet/backend/README.md) for full endpoint specifications, request schemas, and Socket.io event interfaces.
