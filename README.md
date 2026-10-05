# 🤖 IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform

[![Node.js](https://img.shields.io/badge/Node.js-v22-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?logo=socket.io)](https://socket.io/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

IntellMeet is an AI-powered enterprise meeting and collaboration platform developed with the MERN stack. Designed for remote and hybrid teams, it integrates real-time video conferencing, live in-meeting chat, automatic transcription, AI-driven executive summaries, smart action item extraction, and collaborative team Kanban workspaces.

---

## ✨ Core Features

* **🎥 Real-Time Video Meetings:** Peer-to-peer WebRTC video/audio conferencing, screen sharing, meeting passcode protection, and participant management.
* **🧠 AI Meeting Intelligence:** Automatic audio transcription, concise executive summary generation, decision tracking, and sentiment analysis.
* **📋 Smart Action Item Extraction:** Automatically detects actionable tasks from meetings and allows one-click conversion into team Kanban cards.
* **💬 In-Meeting Collaboration:** Real-time chat messages synchronized across all participants and persisted to MongoDB.
* **📊 Team Workspaces & Kanban:** Multi-tenant project boards with drag-and-drop task status progression (`To Do`, `In Progress`, `Done`).
* **📈 Productivity Analytics:** Meeting frequency metrics, total meeting hours, and task completion rates.

---

## 👥 Engineering Team & Domain Ownership

| Team Member | Domain | Scope |
| :--- | :--- | :--- |
| **Ayush** | **Backend & Database** | RESTful APIs, MongoDB schemas, JWT authentication, Redis caching, rate limiting |
| **Vaishali** | **Frontend Engineering** | React 19, TypeScript, Vite, Tailwind CSS, shadcn/ui components, responsive UI |
| **Rishika** | **WebRTC & AI Services** | Real-time WebRTC media streams, Socket.IO signaling, OpenAI Whisper & LLM pipeline |
| **Vignesh** | **DevOps & QA** | Docker containerization, Kubernetes/Helm manifests, CI/CD GitHub Actions, testing |

---

## 🏗️ Repository Architecture

```
IntellMeet/
├── backend/                  # Express REST API, MongoDB Models, Socket.io Server
│   ├── src/
│   │   ├── config/           # MongoDB, Redis, and Cloudinary configurations
│   │   ├── controllers/      # Auth, Meeting, Workspace, Task, Intelligence, Analytics
│   │   ├── middlewares/      # JWT auth, RBAC, Zod validation, error handling, rate limits
│   │   ├── models/           # User, Meeting, Workspace, Task, MeetingIntelligence, Chat
│   │   ├── routes/           # REST endpoints (/api/auth, /api/meetings, /api/tasks, etc.)
│   │   ├── sockets/          # WebRTC signaling relay & real-time chat handlers
│   │   └── utils/            # Winston logger, API envelopes, JWT token helpers
│   ├── tests/                # Automated API test suite
│   ├── .env.example
│   └── package.json
├── frontend/                 # React 19 + TypeScript + Vite Single Page Application
│   ├── src/
│   │   ├── api/              # Axios API clients for Auth, Meetings, Tasks, and Summaries
│   │   ├── components/       # Video grid, ChatPanel, ParticipantList, Navigation Layout
│   │   ├── lib/              # PeerManager (WebRTC) and Socket.io client
│   │   ├── pages/            # Login, Signup, Dashboard, MeetingRoom, Summary, TeamBoard
│   │   └── store/            # Zustand global authentication and session state
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## 🚀 Quickstart Guide

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```
* Backend runs at: `http://localhost:5000`
* Health Check: `http://localhost:5000/api/v1/health`
* Run tests: `npm test`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
* Frontend development server runs at: `http://localhost:5173`

---

## 🔒 Security & Industry Standards

* **Stateless JWT Authentication:** Access tokens with 15-minute expiry and secure refresh token rotation.
* **Password Security:** Salted bcrypt hashing (10 rounds).
* **OWASP Top 10 Protections:** Helmet security headers, CORS origin whitelisting, rate limiting on sensitive routes, and Zod input validation.
* **High Availability:** Redis caching for fast meeting lookups with in-memory TTL fallback.

---

## 📄 License
This project is developed as part of the Zidio Development Internship Program (2026).
