# 🤖 IntellMeet – Enterprise Backend & Database API

> **Role:** Ayush (Backend + Database)  
> **Project:** IntellMeet – AI-Powered Enterprise Meeting & Collaboration Platform  
> **Domain:** Zidio Development – Web Development (MERN) Domain  
> **Version:** 2.0 – Industry Edition  

---

## 🏗️ Architecture Overview

The backend is built as a production-grade, modular Node.js & Express REST API powered by MongoDB (Mongoose), Socket.IO, Redis caching, and JWT authentication with refresh token rotation.

```
backend/
├── src/
│   ├── config/              # Database connection, Redis caching, Cloudinary media storage
│   │   ├── db.js
│   │   ├── redis.js         # Redis with in-memory TTL fallback
│   │   └── cloudinary.js    # Cloudinary with local uploads fallback
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
│   │   ├── index.js         # Routes aggregator (/api/v1)
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
├── scripts/
│   └── test-api.js          # Automated end-to-end integration test suite
├── .env.example             # Environment configuration template
└── package.json
```

---

## ⚡ Quick Start

```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Configure environment
copy .env.example .env

# 4. Start local development server
npm run dev

# 5. Run automated integration test suite
node scripts/test-api.js
```

---

## 🤝 Team Member Integration Guides

### 🎨 1. For Vaishali (Frontend Lead – React 19 + TypeScript + Vite)

All endpoints return a standardized JSON envelope:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success message",
  "data": { ... }
}
```

#### Authentication (`/api/v1/auth`)
- `POST /api/v1/auth/register` — `{ name, email, password, title, department }`
- `POST /api/v1/auth/login` — `{ email, password }`
- `POST /api/v1/auth/refresh-token` — `{ refreshToken }` (also reads HTTP-only cookie)
- `POST /api/v1/auth/logout` — Header `Authorization: Bearer <accessToken>`
- `GET /api/v1/auth/me` — Returns current logged-in user

#### User Profile (`/api/v1/users`)
- `PUT /api/v1/users/profile` — `{ name, bio, title, department, preferences }`
- `POST /api/v1/users/avatar` — `multipart/form-data` with `avatar` file field

#### Meetings (`/api/v1/meetings`)
- `POST /api/v1/meetings` — Create meeting (`title`, `description`, `passcode`, `settings`)
- `GET /api/v1/meetings` — List user's meetings (supports `?status=scheduled|live|ended&page=1&limit=10`)
- `GET /api/v1/meetings/code/:code` — Look up meeting by code (e.g. `ABC-DEF-GHI`) for lobby
- `POST /api/v1/meetings/code/:code/join` — Join meeting with `{ passcode, displayName }`
- `POST /api/v1/meetings/:id/end` — End meeting & finalize participant metrics
- `GET /api/v1/meetings/history` — Post-meeting history

#### Team Workspaces & Kanban (`/api/v1/workspaces`, `/api/v1/tasks`)
- `POST /api/v1/workspaces` — Create workspace (`name`, `description`)
- `GET /api/v1/workspaces` — Get user's workspaces
- `GET /api/v1/tasks/workspace/:workspaceId?groupByStatus=true` — Get Kanban columns (`todo`, `in_progress`, `in_review`, `done`)
- `POST /api/v1/tasks` — Create task (`title`, `description`, `workspace`, `priority`, `assignee`, `dueDate`, `tags`)
- `PATCH /api/v1/tasks/:id/move` — Drag-and-drop support: `{ status: 'done', order: 1 }`

#### Analytics (`/api/v1/analytics`)
- `GET /api/v1/analytics/user` — Productivity metrics, total meeting hours, tasks completion rate
- `GET /api/v1/analytics/workspaces/:workspaceId` — Workspace meeting metrics & task distribution

---

### 🎙️ 2. For Rishika (WebRTC + Socket.io + AI Lead)

The backend provides a complete Socket.IO server on `http://localhost:5000` with the following event contracts:

#### WebRTC Signaling & Room Management
- `join-room`: `{ roomId, user: { _id, name, avatar } }`
- `signal-offer`: `{ targetSocketId, offer, user }`
- `signal-answer`: `{ targetSocketId, answer }`
- `ice-candidate`: `{ targetSocketId, candidate }`
- `user-connected`: Broadcast to other room members
- `user-disconnected`: Broadcast when peer leaves

#### In-Meeting Controls & Real-Time Chat
- `send-chat-message`: `{ roomId, message, attachments }` (automatically persisted to MongoDB!)
- `toggle-audio`: `{ roomId, isMuted }`
- `toggle-video`: `{ roomId, isVideoOff }`
- `raise-hand`: `{ roomId, isRaised }`
- `screen-share-status`: `{ roomId, isSharing }`
- `live-transcript-chunk`: Broadcast live transcription chunk to participants

#### AI Intelligence Endpoints (`/api/v1/intelligence`)
- `POST /api/v1/intelligence/meetings/:meetingId/transcript` — Append/save live transcript chunks
- `GET /api/v1/intelligence/meetings/:meetingId/transcript` — Fetch full meeting transcript
- `POST /api/v1/intelligence/meetings/:meetingId/summary` — Save AI-generated executive summary, key points, decisions, sentiment analysis, and extracted action items:
  ```json
  {
    "summary": {
      "overview": "Summary text...",
      "keyPoints": ["Point 1", "Point 2"],
      "decisions": ["Decision 1"]
    },
    "extractedActionItems": [
      { "taskTitle": "Follow up with client", "assigneeName": "Ayush", "priority": "high" }
    ],
    "sentiment": { "score": 0.85, "label": "positive" },
    "aiModelUsed": "gpt-4o-mini"
  }
  ```
- `POST /api/v1/intelligence/meetings/:meetingId/actions/:actionItemId/to-task` — Convert an AI-extracted action item directly into a Kanban task for the team!
- `GET /api/v1/intelligence/meetings/:meetingId/export` — Download formatted meeting notes as a Markdown document.

---

### 🚢 3. For Vignesh (DevOps + Testing + Deployment Lead)

- **Health Probe:** `GET /api/v1/health`
  - Returns `200` with detailed system metrics (MongoDB connection state, memory RSS/heap, uptime, version) for Kubernetes Liveness/Readiness probes and AWS/Render health checks.
- **Automated Tests:** Run `node scripts/test-api.js` to execute 15 end-to-end integration tests.
- **Containerization Readiness:** Standard Node.js entrypoint (`src/server.js`), stateless JWT authentication, environment variable driven configuration.
- **Graceful Shutdown:** Implemented for `SIGTERM` and `SIGINT` signals to close active connections cleanly.
