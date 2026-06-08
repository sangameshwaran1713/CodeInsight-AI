# CodeInsight AI

A full-stack web platform for AI-powered code analysis, explanation, bug detection, and optimization suggestions.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CodeInsight AI                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────────┐   │
│  │                  │    │                  │    │                      │   │
│  │  React Frontend  │───▶│  Node.js API     │───▶│  Python AI Service   │   │
│  │  (Vercel)        │    │  Gateway         │    │  (Railway)           │   │
│  │                  │    │  (Render)        │    │                      │   │
│  └──────────────────┘    └────────┬─────────┘    └──────────────────────┘   │
│                                   │                                          │
│                                   ▼                                          │
│                          ┌──────────────────┐                               │
│                          │                  │                               │
│                          │  MongoDB Atlas   │                               │
│                          │  Database        │                               │
│                          │                  │                               │
│                          └──────────────────┘                               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
codeinsight-ai/
├── client/                     # React Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API service functions
│   │   ├── context/            # React context providers
│   │   ├── utils/              # Utility functions
│   │   ├── styles/             # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js Backend API Gateway
│   ├── src/
│   │   ├── config/             # Configuration files
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Express middleware
│   │   ├── models/             # Mongoose models
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utility functions
│   │   └── app.js
│   ├── .env.example
│   └── package.json
│
├── ai-service/                 # Python AI Analysis Service
│   ├── app/
│   │   ├── api/                # FastAPI routes
│   │   ├── services/           # AI analysis services
│   │   ├── utils/              # Utility functions
│   │   ├── models/             # Pydantic models
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── docker/                     # Docker configurations
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── nginx/
│
├── docs/                       # Documentation
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── ARCHITECTURE.md
│
├── .gitignore
├── .env.example
└── README.md
```

## 🚀 Features

1. **Code Explanation** - Get detailed explanations of what code does
2. **Line-by-Line Analysis** - Understand each line of code
3. **Bug Detection** - Identify potential bugs and issues
4. **Fix Suggestions** - Get AI-powered fix recommendations
5. **Time Complexity Analysis** - Understand algorithmic complexity
6. **Code Improvement** - Receive optimization suggestions

## 🛠️ Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- Monaco Editor (VS Code editor)
- Axios
- React Router v6

### Backend (API Gateway)
- Node.js
- Express.js
- JWT Authentication
- Multer (file uploads)
- Mongoose ODM

### AI Service
- Python 3.11+
- FastAPI
- OpenAI API / LLM
- AST module
- Radon (complexity analysis)
- Pylint (bug detection)

### Database
- MongoDB Atlas

### DevOps
- Docker & Docker Compose
- Git & GitHub
- Vercel (Frontend)
- Render (Node backend)
- Railway (Python AI service)

## 🏃 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB Atlas account (optional for basic usage)
- OpenAI API key (for AI features)

### Quick Start (Recommended)

**Option 1: Single Command (npm)**
```bash
# Install all dependencies first
npm run install:all

# Start all services with one command
npm start
```

**Option 2: Windows Batch Script**
```bash
# Double-click or run:
start-all.bat
```

**Option 3: PowerShell Script**
```powershell
.\start-all.ps1
```

**After starting, open:** http://localhost:3000

### Manual Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/codeinsight-ai.git
cd codeinsight-ai
```

2. **Setup Frontend**
```bash
cd client
npm install
cp .env.example .env
npm run dev
```

3. **Setup Backend**
```bash
cd server
npm install
cp .env.example .env
npm run dev
```

4. **Setup AI Service**
```bash
cd ai-service
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### Using Docker
```bash
docker-compose -f docker/docker-compose.dev.yml up --build
```

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Code Analysis
- `POST /api/analysis/explain` - Get code explanation
- `POST /api/analysis/line-by-line` - Line-by-line analysis
- `POST /api/analysis/bugs` - Detect bugs
- `POST /api/analysis/fix` - Get fix suggestions
- `POST /api/analysis/complexity` - Time complexity analysis
- `POST /api/analysis/improve` - Improvement suggestions
- `POST /api/analysis/upload` - Upload code file

### History
- `GET /api/history` - Get analysis history
- `GET /api/history/:id` - Get specific analysis
- `DELETE /api/history/:id` - Delete analysis

## 🔐 Environment Variables

See `.env.example` files in each service directory for required environment variables.

## 📜 License

MIT License - see LICENSE file for details.
