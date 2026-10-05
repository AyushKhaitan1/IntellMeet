# 🤖 IntellMeet – Enterprise Backend & Database API

[![Node.js](https://img.shields.io/badge/Node.js-v22-339933?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4-000000?logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?logo=socket.io)](https://socket.io/)

Production-grade, modular Node.js & Express REST API powered by MongoDB, Redis caching, Socket.io real-time signaling, and JWT authentication with refresh token rotation.

---

## 🏗️ Architecture Overview

```
backend/
├── src/
│   ├── config/              # Database connection, Redis caching, Cloudinary media storage
│   │   ├── db.js            # MongoDB Mongoose connection & connection pooling
│   │   ├── redis.js         # Redis client with in-memory TTL fallback
│   │   └── cloudinary.js    # Cloudinary upload SDK with local uploads fallback
│   ├── controllers/         # Business logic handlers
│   │   ├── auth.controller.js
│   │   ├── meeting.controller.js
│   │   ├── workspace.controller.js
│   │   ├── task.controller.js
│   │   ├── intelligence.controller.js
│   │   └── analytics.controller.js
│   ├── middlewares/         # Express middlewares
│   │   ├── auth.middleware.js       # JWT & Role-Based Access Control (RBAC)
│   │   ├── error.middleware.js      # Global error handler & Zod validation catcher
│   │   ├── rateLimiter.middleware.js # Express rate limiters
│   │   ├── upload.middleware.js     # Multer file upload
│   │   └── validate.middleware.js   # Zod request schema validator
│   ├── models/              # Mongoose data schemas & indexes
│   │   ├── User.js
│   │   ├── Meeting.js
│   │   ├── Workspace.js
│   │   ├── Task.js
│   │   ├── MeetingIntelligence.js
│   │   └── ChatMessage.js
│   ├── routes/              # Express API route declarations
│   │   ├── index.js         # Routes aggregator
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── meeting.routes.js
│   │   ├── workspace.routes.js
│   │   ├── task.routes.js
│   │   ├── intelligence.routes.js
│   │   ├── analytics.routes.js
│   │   └── health.routes.js
│   ├── sockets/             # Socket.IO handlers for real-time events & WebRTC bridge
│   │   └── socketHandler.js
│   ├── utils/               # Structured logging, API envelopes, and JWT helpers
│   │   ├── logger.js
│   │   ├── apiResponse.js
│   │   ├── apiError.js
│   │   └── token.utils.js
│   ├── app.js               # Express application pipeline & security
│   └── server.js            # Server entrypoint & graceful shutdown
├── tests/                   # Automated unit & integration tests
│   └── api.test.js
├── scripts/
│   └── test-api.js          # Automated end-to-end integration test suite
├── .env.example             # Environment configuration template
└── package.json
```

---

## ⚡ Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start local development server
npm run dev

# 4. Run automated test suite
npm test
```

---

## 📡 Client API Specifications

All endpoints return a standardized JSON envelope with backward-compatible flat response fields:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "token": "eyJhbGciOi...",
  "_id": "67...",
  "name": "User Name",
  "email": "user@example.com",
  "data": { ... }
}
```

### 1. Authentication (`/api/auth` & `/api/v1/auth`)
* `POST /api/auth/signup` (or `/register`) — `{ name, email, password, title, department }`
* `POST /api/auth/login` — `{ email, password }`
* `POST /api/auth/refresh-token` — `{ refreshToken }` (also reads HTTP-only cookie)
* `POST /api/auth/logout` — Header `Authorization: Bearer <accessToken>`
* `GET /api/auth/me` — Returns current logged-in user

### 2. Meetings (`/api/meetings` & `/api/v1/meetings`)
* `POST /api/meetings` — Create meeting (`{ title, description, passcode, settings }`)
* `GET /api/meetings` — List user's meetings (`[{ _id, title, status, roomId, meetingCode }]`)
* `GET /api/meetings/code/:code` — Look up meeting by code (e.g. `ABC-DEF-GHI`) for lobby
* `POST /api/meetings/code/:code/join` — Join meeting with `{ passcode, displayName }`
* `GET /api/meetings/:roomId/summary` — Fetch meeting AI summary and extracted action items
* `POST /api/meetings/:id/end` — End meeting & calculate participant attendance duration

### 3. Team Workspaces & Tasks (`/api/tasks` & `/api/workspaces`)
* `GET /api/tasks` — List all user tasks (`[{ _id, title, status, assignee }]`)
* `POST /api/tasks` — Create task (`{ title, status, priority, assignee, dueDate }`)
* `PATCH /api/tasks/:id` — Update status (`todo`, `in-progress`, `done`)
* `POST /api/workspaces` — Create workspace (`{ name, description }`)
* `GET /api/workspaces` — Get user workspaces

### 4. Meeting Intelligence & Export (`/api/v1/intelligence`)
* `POST /api/v1/intelligence/meetings/:id/transcript` — Append live Whisper transcript chunks
* `POST /api/v1/intelligence/meetings/:id/summary` — Save AI executive summary & action items
* `POST /api/v1/intelligence/meetings/:id/actions/:actionId/to-task` — Convert AI action item into a Kanban task
* `GET /api/v1/intelligence/meetings/:id/export` — Download formatted meeting notes as Markdown

---

## 🎙️ WebRTC & Real-Time Socket.io Protocol

The Socket.IO server runs on `http://localhost:5000` with the following event contracts:

### WebRTC Signaling & Room Management
* `join-room`: `{ roomId, user }`, acknowledges via `callback({ error: null, success: true })`
* `existing-peers`: Broadcasts connected peer array `[{ socketId, user }]` to joiner
* `peer-joined`: Broadcasts new participant info to existing room members
* `peer-left`: Broadcasts when a peer disconnects
* `signal`: Relays WebRTC SDP offers, answers, and ICE candidates between peers:
  * Client sends: `{ to: targetSocketId, data: { sdp / candidate } }`
  * Relayed as: `{ from: senderSocketId, data }`

### In-Meeting Chat
* Client sends: `chat:send` with `{ text }`, `callback`
* Server broadcasts: `chat:message` with `{ id, senderName, text }`

---

## 🚢 DevOps & Deployment Specifications

* **Health Probe:** `GET /api/v1/health`
  * Returns `200 OK` with database connection state, memory RSS/heap, and system uptime.
* **Testing:** `npm test` runs the unit & integration test suite in under 3 seconds.
* **Stateless Container Readiness:** Ready for multi-stage Docker builds and Kubernetes deployments.
