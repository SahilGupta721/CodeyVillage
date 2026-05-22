# Codey Village

**Codey Village** is a gamified developer productivity platform that rewards real-world coding activity with in-game currency. Solve a LeetCode problem, push a GitHub commit, or submit a job application — and watch your village grow.

Built as a full-stack web app with a Phaser 3 multiplayer game at its core, a Python FastAPI backend, a Node.js OAuth middleware server, and a Manifest v3 Chrome extension that passively monitors your activity across LeetCode, GitHub, and Workday.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend (Python FastAPI)](#backend-python-fastapi)
  - [OAuth/Webhook Server (Node.js)](#oauthwebhook-server-nodejs)
  - [Frontend (Next.js)](#frontend-nextjs)
  - [Chrome Extension](#chrome-extension)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Overview](#api-overview)
- [Chrome Extension Details](#chrome-extension-details)
- [Multiplayer Architecture Notes](#multiplayer-architecture-notes)
- [License](#license)

---

## Overview

Codey Village turns your daily developer workflow into a resource loop:

1. A **Chrome extension** silently watches LeetCode, GitHub, and Workday.
2. When it detects an accepted submission, a commit, or a job application, it fires a request to the **FastAPI backend**.
3. The backend awards **coins** to your account and stores your activity in **MongoDB**.
4. You spend those coins in the **Next.js web app** to build and decorate your island in a **Phaser 3** top-down world.
5. You can join **multiplayer rooms** (up to 5 players) over WebSockets and roam each other's villages in real time.

---

## Features

| Feature | Description |
|---------|-------------|
| Coin Earning | Earn coins automatically from LeetCode solves, GitHub commits, and Workday job applications |
| Island Building | Purchase and place buildings/decorations using earned coins |
| Multiplayer Rooms | Real-time rooms supporting up to 5 simultaneous players via WebSockets |
| Player Interactions | Interact with other players in the same room |
| Shop System | Browse and buy items to customize your island |
| GitHub OAuth | Link your GitHub account for commit tracking via webhooks |
| AI Integration | Google Gemini powers NPC dialogue and dynamic content generation |
| Activity Tracking | Complete webhook and event pipeline from IDE → extension → backend → game |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌──────────────────────┐   ┌───────────────────────────┐  │
│  │   Next.js Frontend   │   │     Chrome Extension      │  │
│  │  (Phaser 3 Game UI)  │   │  (LeetCode / GitHub /     │  │
│  │  WebSocket client    │   │   Workday content scripts)│  │
│  └──────────┬───────────┘   └──────────┬────────────────┘  │
│             │                          │                    │
└─────────────┼──────────────────────────┼────────────────────┘
              │ HTTPS / WSS              │ HTTPS
              ▼                          ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│  Python FastAPI Backend │   │  Node.js OAuth Server    │
│  ─────────────────────  │   │  ──────────────────────  │
│  REST API               │   │  GitHub OAuth flow       │
│  WebSocket (rooms)      │   │  GitHub webhook receiver │
│  Coin system            │   │  Activity tracker        │
│  Island / shop logic    │   └──────────────────────────┘
│  Firebase auth verify   │
│  Gemini AI integration  │
│  ─────────────────────  │
│      MongoDB            │
└─────────────────────────┘
```

**Data flow for a LeetCode coin award:**
1. User solves a LeetCode problem in the browser.
2. The extension's `leetcode.js` content script detects the accepted submission.
3. Extension sends a POST to the FastAPI backend `/coins/award`.
4. Backend validates the Firebase auth token, increments user coins in MongoDB, and broadcasts to any active WebSocket room.
5. The frontend updates the coin counter in real time.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Phaser 3.90, Tailwind CSS 4 |
| State Management | Zustand |
| Auth | Firebase Authentication |
| Backend | Python 3.11, FastAPI, Uvicorn |
| Database | MongoDB (Atlas) via pymongo |
| Real-time | WebSockets (FastAPI native) |
| OAuth Server | Node.js, Express 4 |
| Chrome Extension | Manifest v3, Vanilla JS |
| AI | Google Gemini API |
| External APIs | GitHub REST API, LeetCode (scraped), Workday |
| Deployment | Google Cloud Run (backend), Vercel (frontend) |
| Containerization | Docker (Python 3.11-slim) |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- **MongoDB Atlas** account (or local MongoDB instance)
- **Firebase** project with Authentication enabled
- **Google Chrome** (for the extension)
- A **GitHub OAuth App** (for the OAuth server)

---

### Backend (Python FastAPI)

```bash
cd backend
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:

```env
MONGO_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?appName=<app>
FIREBASE_API_KEY=<your-firebase-api-key>
WEBHOOK_URL=https://<your-backend-domain>
```

Start the development server:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`. Interactive docs are at `http://localhost:8000/docs`.

---

### OAuth/Webhook Server (Node.js)

```bash
cd server
npm install
```

Create a `.env` file in `server/`:

```env
GITHUB_CLIENT_ID=<your-github-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<your-github-oauth-app-client-secret>
WEBHOOK_URL=https://<your-backend-domain>
PORT=3001
```

Start the server:

```bash
npm start
```

---

### Frontend (Next.js)

```bash
cd frontend
npm install
```

Create a `.env.local` file in `frontend/`:

```env
NEXT_PUBLIC_IDENTITY_PLATFORM_API_KEY=<firebase-api-key>
NEXT_PUBLIC_IDENTITY_PLATFORM_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Available scripts:**

```bash
npm run dev      # Start development server (hot reload)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

### Chrome Extension

1. Open Chrome and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and select the `extension/` directory.
4. The Codey Village extension icon will appear in your toolbar.
5. Sign in via the extension popup and connect your accounts.

The extension monitors:
- `leetcode.com` — problem submissions
- `github.com` — commit/push events
- Workday job application portals — application submissions

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `MONGO_URL` | MongoDB Atlas connection string |
| `FIREBASE_API_KEY` | Firebase project API key for token verification |
| `WEBHOOK_URL` | Public URL of this backend (used for webhook registration) |

### Node.js Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `GITHUB_CLIENT_ID` | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth App Client Secret |
| `WEBHOOK_URL` | Backend URL to forward GitHub webhook payloads |
| `PORT` | Port to listen on (default: 3000) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_IDENTITY_PLATFORM_API_KEY` | Firebase API key |
| `NEXT_PUBLIC_IDENTITY_PLATFORM_AUTH_DOMAIN` | Firebase auth domain |
| `NEXT_PUBLIC_BACKEND_URL` | FastAPI backend base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for multiplayer |

---

## Deployment

### Backend — Google Cloud Run

The backend is containerized and deployed to Cloud Run:

```bash
cd backend
./deploy.sh
```

The `cloudrun.yaml` is configured with:
- **maxScale: 1** — single instance to preserve in-memory WebSocket room state (see [Multiplayer Architecture Notes](#multiplayer-architecture-notes))
- **sessionAffinity: true** — routes WebSocket reconnects to the same instance
- **containerConcurrency: 50** — supports ~10 full rooms of 5 players concurrently
- **timeoutSeconds: 3600** — long timeout to keep WebSocket connections alive

### Frontend — Vercel

The Next.js app is deployed to Vercel. Connect the `frontend/` directory as the Vercel project root and set the environment variables in the Vercel dashboard.

---

## API Overview

The FastAPI backend exposes the following route groups:

| Prefix | Description |
|--------|-------------|
| `/users` | User CRUD — profile, username, stats |
| `/coins` | Coin award, balance, transaction history |
| `/rooms` | Room creation, joining, listing |
| `/island` | Island state, building placement |
| `/shop` | Item catalog, purchase |
| `/interactions` | Player-to-player interaction events |
| `/ws` | WebSocket endpoint for real-time multiplayer |
| `/webhooks` | Incoming webhooks from GitHub, LeetCode, Workday |

Full interactive documentation is available at `/docs` (Swagger UI) and `/redoc` when the backend is running.

---

## Chrome Extension Details

The extension uses **Manifest v3** with a persistent service worker and the following content scripts:

| Script | Injected On | Purpose |
|--------|-------------|---------|
| `leetcode.js` | `leetcode.com/*` | Detects accepted problem submissions |
| `github.js` | `github.com/*` | Tracks commit/push activity |
| `workday.js` | Workday job portals | Detects completed job applications |
| `webapp.js` | `localhost:3000`, production domain | Bridges extension state with the game frontend |
| `toast.js` | All monitored pages | Renders coin-earned toast notifications |

An `injected/interceptor.js` script is injected into the page context (not the extension context) to intercept outgoing API requests from LeetCode and GitHub before they leave the browser, allowing the extension to detect events without polling.

---

## Multiplayer Architecture Notes

The WebSocket room manager (`backend/routes/ws_routes.py`) holds all active room and player state in memory inside a `RoomManager` class. This means **the backend must run as a single instance** — splitting across multiple Cloud Run instances would cause players in the same room to connect to different instances with no shared state.

The current deployment enforces `maxScale: 1` in `cloudrun.yaml` as a hard guardrail. The natural path to horizontal scaling is to move room state to a **Redis pub/sub** layer, which would allow any number of backend instances to share room events. This is the primary scalability improvement for a production rollout.

At `containerConcurrency: 50`, a single instance can support approximately 50 concurrent WebSocket connections — roughly 10 full rooms of 5 players.

---

## Project Structure

```
GDG-HACKS3/
├── frontend/                   # Next.js web app
│   ├── app/                    # App Router pages (auth, lobby, game, room/[id])
│   ├── src/
│   │   ├── game/               # Phaser 3 game config, scenes, entities, map gen
│   │   ├── components/         # Shared React components
│   │   ├── hooks/              # Custom hooks (useCoins, useRoom, usePlayer)
│   │   ├── lib/                # Firebase, API client, Supabase utils
│   │   ├── store/              # Zustand game store
│   │   └── types/              # TypeScript type definitions
│   └── public/                 # Static assets and game sprites
│
├── backend/                    # Python FastAPI service
│   ├── main.py                 # App entrypoint, CORS, router registration
│   ├── models/                 # Pydantic data models
│   ├── controllers/            # Business logic
│   ├── routes/                 # API route handlers + WebSocket manager
│   ├── services/               # Firebase, GitHub, LeetCode, Gemini integrations
│   ├── database/               # MongoDB connection
│   ├── Dockerfile              # Python 3.11-slim container
│   ├── cloudrun.yaml           # Cloud Run deployment config
│   └── deploy.sh               # GCP build + deploy script
│
├── server/                     # Node.js OAuth + webhook middleware
│   └── index.js                # Express app (GitHub OAuth, webhook receiver)
│
├── extension/                  # Chrome Extension (Manifest v3)
│   ├── manifest.json
│   ├── background/             # Service worker
│   ├── popup/                  # Extension popup UI
│   ├── content-scripts/        # Page-injected scripts (leetcode, github, workday)
│   ├── injected/               # In-page context scripts (API interceptor)
│   └── icons/                  # Extension icons (16, 48, 128px)
│
└── LICENSE                     # GNU GPL v3
```

---

## License

This project is licensed under the **GNU General Public License v3.0**. See [LICENSE](LICENSE) for the full text.
