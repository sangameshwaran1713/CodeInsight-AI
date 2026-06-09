<div align="center">

# 🤖 CodeInsight AI

### AI-Powered Code Analysis Platform

[![CI/CD Pipeline](https://github.com/sangameshwaran1713/CodeInsight-AI/actions/workflows/ci.yml/badge.svg)](https://github.com/sangameshwaran1713/CodeInsight-AI/actions/workflows/ci.yml)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)
![Python](https://img.shields.io/badge/Python-3.11+-blue?style=flat-square&logo=python)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)

**Paste your code → Get instant AI-powered explanations, bug detection, complexity analysis, and improvement suggestions — all running locally with zero API costs.**

</div>

---

## 📌 Project Description

CodeInsight AI is a full-stack developer tool that lets you analyze code using a locally-hosted Large Language Model (LLM) via **Ollama**. Instead of sending your code to cloud APIs like OpenAI or Anthropic, everything runs on your own machine — keeping your code private and eliminating per-request costs.

The platform combines a **React frontend** with a **Monaco code editor**, a **Node.js/Express backend** for authentication and routing, a **Python/FastAPI AI microservice** for LLM inference, and a **secure sandbox** that can actually execute your code and show you the output — all in one unified interface.

Key differentiators:
- **No cloud AI costs** — uses Ollama to run models locally (tested with `gpt-oss:120b-cloud`)
- **Real code execution** — run Python, JavaScript, and Java directly in the browser with output
- **Dry Run** — trace code logic step-by-step using AI without actually executing it
- **Production-grade security** — 30+ security patches, JWT auth, rate limiting, RBAC

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Monaco Editor, Framer Motion |
| **Backend API** | Node.js, Express.js, JWT, Mongoose, Multer |
| **AI Service** | Python 3.11, FastAPI, Uvicorn, Ollama, httpx |
| **LLM** | Ollama (local) — supports any model e.g. `llama3.2`, `gpt-oss:120b-cloud` |
| **Database** | MongoDB Atlas |
| **Code Execution** | Subprocess sandbox (Python, JavaScript, Java) |
| **Auth** | JWT + bcrypt + email OTP verification |
| **Security** | Helmet, express-mongo-sanitize, CORS, rate limiting, RBAC |
| **DevOps** | Docker, Docker Compose, GitHub Actions CI/CD |
| **UI Libraries** | Three.js / WebGL (shader backgrounds), @react-three/fiber |

---

## 🔄 System Architecture & Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                        USER BROWSER                         │
│                                                             │
│   React + Vite (localhost:3000)                             │
│   ┌─────────────┐  ┌──────────┐  ┌──────────────────────┐  │
│   │ Monaco      │  │ Output   │  │ Analysis Summary      │  │
│   │ Code Editor │  │ Panel    │  │ + Dry Run Trace       │  │
│   └─────────────┘  └──────────┘  └──────────────────────┘  │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP (Axios)
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              NODE.JS API GATEWAY (localhost:5000)           │
│                                                             │
│   ┌──────────┐  ┌────────────┐  ┌──────────┐  ┌────────┐  │
│   │   Auth   │  │  Analysis  │  │ History  │  │ Admin  │  │
│   │  Routes  │  │   Routes   │  │  Routes  │  │ Routes │  │
│   └──────────┘  └────────────┘  └──────────┘  └────────┘  │
│                                                             │
│   Middleware: JWT Auth → Rate Limit → Validate → Sanitize   │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────┐    ┌─────────────────────────────────┐
│   MongoDB Atlas      │    │   PYTHON AI SERVICE (port 8000) │
│                      │    │                                  │
│   Collections:       │    │   FastAPI + Uvicorn              │
│   - users            │    │                                  │
│   - analyses         │    │   ┌──────────────────────────┐  │
│                      │    │   │  LLM Service (Ollama)    │  │
└──────────────────────┘    │   │  POST /api/analyze/...   │  │
                            │   └──────────────────────────┘  │
                            │                                  │
                            │   ┌──────────────────────────┐  │
                            │   │  Sandbox Executor        │  │
                            │   │  POST /api/sandbox/...   │  │
                            │   └──────────────────────────┘  │
                            └──────────────┬───────────────────┘
                                           │
                                           ▼
                            ┌──────────────────────────┐
                            │   OLLAMA (port 11434)    │
                            │   Local LLM Runtime      │
                            │   Model: any Ollama model│
                            └──────────────────────────┘
```

---

## 🔐 Authentication Flow

```
Register ──► Email Verification (Token + OTP) ──► Login ──► JWT Token
                                                              │
                                           ┌──────────────────┘
                                           ▼
                              Bearer Token in every request
                              → auth.middleware validates
                              → req.user attached
                              → RBAC checks (user/admin/super_admin)
```

---

## 🧪 Code Analysis Flow

```
User pastes code
       │
       ▼
Select analysis types: [explain] [bugs] [fix] [complexity] [improve] [line-by-line]
       │
       ▼
POST /api/analyze (Node.js backend)
       │
       ├── Validate code size, language, types
       ├── Check JWT auth
       └── Call aiService.analyzeMultiple()
                │
                ▼
       POST /api/analyze/{type} (Python FastAPI)
                │
                ├── Build prompt template for selected type
                └── POST to Ollama /api/chat
                         │
                         ▼
                  Local LLM generates response
                         │
                         ▼
       Response flows back → Node.js → saves to MongoDB → Frontend
                                                              │
                                                              ▼
                                              Sliding carousel UI
                                              Tab pills (Summary / Bugs / Fixes / etc.)
                                              ← → navigation with dot indicators
```

---

## ⚡ Code Execution Flow (Sandbox)

```
User clicks "Run"
       │
       ▼
POST /api/sandbox/execute-simple (Python FastAPI)
       │
       ├── Python  → subprocess + python temp file
       ├── JavaScript → subprocess + node temp file
       └── Java    → javac compile → java run temp dir
                │
                ▼
       stdout / stderr / exit_code / execution_time
                │
                ▼
       Output panel in browser (green stdout, red stderr)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- [Ollama](https://ollama.com/download) installed and a model pulled
- MongoDB Atlas account (free tier works)

### 1. Clone
```bash
git clone https://github.com/sangameshwaran1713/CodeInsight-AI.git
cd CodeInsight-AI
```

### 2. Install dependencies
```bash
npm run install:all
```

### 3. Configure environment
```bash
# Copy example env files
cp server/.env.example server/.env
cp ai-service/.env.example ai-service/.env
cp client/.env.example client/.env

# Edit server/.env — add your MongoDB URI and JWT secret
# Edit ai-service/.env — set OLLAMA_MODEL to your installed model
```

### 4. Pull an Ollama model
```bash
ollama pull llama3.2
# or any other model you have
```

### 5. Start everything
```bash
npm start
```

Opens at **http://localhost:3000**

---

## 📡 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |
| PUT | `/api/auth/reset-password/:token` | Reset password |
| POST | `/api/auth/verify-email-otp` | Verify email with OTP |

### Analysis
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Run multiple analysis types at once |
| POST | `/api/analysis/explain` | Explain code |
| POST | `/api/analysis/bugs` | Detect bugs |
| POST | `/api/analysis/fix` | Suggest fixes |
| POST | `/api/analysis/complexity` | Time & space complexity |
| POST | `/api/analysis/improve` | Improvement suggestions |
| POST | `/api/analysis/line-by-line` | Line-by-line breakdown |

### Sandbox (Code Execution)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sandbox/execute-simple` | Execute Python / JavaScript / Java |

### History
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/history` | Get analysis history |
| DELETE | `/api/history/:id` | Delete analysis |

---

## 🔑 Key Features

- **🧠 Local LLM** — Ollama integration, no cloud API needed
- **🖥️ Monaco Editor** — VS Code-quality editor in the browser
- **▶️ Code Execution** — Run Python, JavaScript, Java with stdin support
- **🔍 Dry Run** — AI traces execution logic without running code
- **📊 Analysis Carousel** — Sliding tab UI for switching between analysis types
- **🌌 Animated UI** — WebGL hex shader (login page), Space starfield background
- **🔐 Full Auth** — JWT, bcrypt (rounds 14), email verification, OTP, password reset
- **🛡️ Security** — Rate limiting, NoSQL injection prevention, IDOR protection, RBAC
- **📱 Responsive** — Draggable split panes, works on any screen size
- **🔄 CI/CD** — GitHub Actions pipeline (lint + build + security audit)

---

## 📁 Project Structure

```
CodeInsight-AI/
├── client/                  # React 18 + Vite frontend
│   └── src/
│       ├── components/      # UI components (Editor, Analysis, Layout)
│       ├── pages/           # Route pages (Home, Analyze, Login, etc.)
│       ├── services/        # API clients
│       └── context/         # Auth context
│
├── server/                  # Node.js + Express API gateway
│   └── src/
│       ├── controllers/     # Route handlers
│       ├── middleware/       # Auth, validation, rate limiting
│       ├── models/          # Mongoose schemas
│       ├── routes/          # Express routers
│       └── services/        # AI service client
│
├── ai-service/              # Python + FastAPI AI microservice
│   └── app/
│       ├── api/             # FastAPI endpoints
│       └── services/        # LLM + sandbox + analysis logic
│
├── docker/                  # Docker Compose configs
├── docs/                    # API + architecture docs
├── start.js                 # One-command launcher (npm start)
└── .github/workflows/       # CI/CD pipeline
```

---

## 📜 License

MIT — free to use, modify, and distribute.

---

<div align="center">
Built with ☕ and a lot of debugging
</div>
