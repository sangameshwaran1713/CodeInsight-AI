# CodeInsight AI - Architecture Documentation

## System Overview

CodeInsight AI is a full-stack web application that provides AI-powered code analysis, consisting of three main services:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CodeInsight AI                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐                                                       │
│  │                  │                                                       │
│  │  React Frontend  │◄───────────────── User Interaction                    │
│  │  (Vercel)        │                                                       │
│  │                  │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                  │
│           │ HTTP/REST (JWT Auth)                                            │
│           ▼                                                                  │
│  ┌──────────────────┐                                                       │
│  │                  │                                                       │
│  │  Node.js API     │◄───────────────── Business Logic & Auth               │
│  │  Gateway         │                                                       │
│  │  (Render)        │                                                       │
│  │                  │                                                       │
│  └────────┬─────────┘                                                       │
│           │                                                                  │
│     ┌─────┴─────┐                                                           │
│     │           │                                                           │
│     ▼           ▼                                                           │
│  ┌──────────────────┐    ┌──────────────────────┐                          │
│  │                  │    │                      │                          │
│  │  MongoDB Atlas   │    │  Python AI Service   │◄──── Code Analysis       │
│  │  Database        │    │  (Railway)           │                          │
│  │                  │    │                      │                          │
│  └──────────────────┘    └──────────┬───────────┘                          │
│                                     │                                       │
│                                     ▼                                       │
│                          ┌──────────────────────┐                          │
│                          │                      │                          │
│                          │  OpenAI API          │                          │
│                          │                      │                          │
│                          └──────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Architecture

### 1. React Frontend

**Technology Stack:**
- React 18 with Vite
- Tailwind CSS for styling
- Monaco Editor for code editing
- React Router v6 for navigation
- Axios for HTTP requests
- Context API for state management

**Key Features:**
- Single Page Application (SPA)
- Responsive design
- Dark theme optimized for code
- Real-time code editing
- Multiple analysis type selection

**Directory Structure:**
```
client/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Layout/       # Header, Footer, Layout
│   │   ├── Editor/       # Monaco Editor wrapper
│   │   └── Analysis/     # Analysis result components
│   ├── pages/            # Route-level components
│   ├── context/          # React Context providers
│   ├── services/         # API service layer
│   ├── hooks/            # Custom React hooks
│   └── utils/            # Utility functions
├── public/               # Static assets
└── index.html            # Entry HTML
```

---

### 2. Node.js API Gateway

**Technology Stack:**
- Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- Multer for file uploads
- Express-validator for validation

**Responsibilities:**
- User authentication & authorization
- Request validation & sanitization
- Rate limiting
- Proxying requests to AI service
- Storing analysis history
- File upload handling

**Directory Structure:**
```
server/
├── src/
│   ├── config/           # Database & app configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Express middleware
│   │   ├── auth          # JWT verification
│   │   ├── validation    # Input validation
│   │   └── upload        # File upload handling
│   ├── models/           # Mongoose schemas
│   ├── routes/           # API route definitions
│   ├── services/         # Business logic & external calls
│   └── utils/            # Helper functions
└── app.js                # Express app entry point
```

**API Design:**
- RESTful endpoints
- JWT Bearer token authentication
- Consistent error response format
- Pagination for list endpoints

---

### 3. Python AI Service

**Technology Stack:**
- FastAPI
- OpenAI API (GPT-4)
- Radon for complexity analysis
- Pylint for Python linting
- AST module for syntax analysis

**Responsibilities:**
- Code explanation generation
- Line-by-line analysis
- Bug detection
- Fix suggestions
- Complexity analysis
- Code improvement recommendations

**Directory Structure:**
```
ai-service/
├── app/
│   ├── api/              # FastAPI route handlers
│   ├── models/           # Pydantic models
│   ├── services/         # Analysis services
│   │   ├── llm_service   # OpenAI integration
│   │   └── static_analysis # Radon, Pylint, AST
│   └── utils/            # Utility functions
├── main.py               # FastAPI entry point
└── config.py             # Configuration management
```

**Analysis Pipeline:**
1. Receive code + language from API Gateway
2. For Python: Run static analysis (Radon, Pylint, AST)
3. Generate LLM prompt based on analysis type
4. Call OpenAI API with structured prompt
5. Parse and format response
6. Return combined results

---

## Data Flow

### Authentication Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────►│  API Gateway │────►│   MongoDB    │
│          │     │             │     │              │
│  Login   │     │  Validate   │     │  Find User   │
│  Request │     │  Credentials │     │  Verify Pass │
│          │◄────│  Generate JWT│◄────│              │
└──────────┘     └─────────────┘     └──────────────┘
```

### Analysis Flow

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐     ┌──────────┐
│  Client  │────►│  API Gateway │────►│  AI Service  │────►│  OpenAI  │
│          │     │             │     │              │     │          │
│  Code +  │     │  Validate   │     │  Static      │     │  Generate │
│  Language │     │  Auth Token │     │  Analysis   │     │  Response │
│          │     │             │     │              │     │          │
│          │◄────│  Save to DB │◄────│  LLM Call   │◄────│          │
└──────────┘     └─────────────┘     └──────────────┘     └──────────┘
```

---

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['user', 'admin']),
  analysisCount: Number,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Analysis Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User),
  code: String,
  language: String,
  analysisTypes: [String],
  results: {
    explain: { result: String, error: String },
    'line-by-line': { result: Mixed, error: String },
    bugs: { result: Mixed, error: String },
    fix: { result: Mixed, error: String },
    complexity: { result: Mixed, error: String },
    improve: { result: Mixed, error: String }
  },
  fileName: String,
  processingTime: Number,
  status: String (enum: ['pending', 'processing', 'completed', 'failed']),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Architecture

### Authentication

- JWT tokens with configurable expiration
- Bcrypt password hashing (12 salt rounds)
- Token refresh mechanism (optional)

### Authorization

- Role-based access control (user, admin)
- Resource ownership validation
- Route-level middleware protection

### API Security

- Helmet.js for security headers
- CORS with whitelist
- Rate limiting per IP
- Input validation and sanitization
- SQL injection prevention (NoSQL)
- XSS prevention

---

## Scalability Considerations

### Horizontal Scaling

- Stateless API design enables horizontal scaling
- JWT tokens eliminate session storage needs
- Database connection pooling
- Load balancer compatible

### Caching Strategy

```
┌──────────┐     ┌─────────────┐     ┌──────────────┐
│  Client  │────►│    CDN      │────►│  API Gateway │
│          │     │  (Static)   │     │              │
│          │     │             │     │    Redis     │
│          │     │             │     │   (Cache)    │
└──────────┘     └─────────────┘     └──────────────┘
```

**Cacheable Resources:**
- Static frontend assets (CDN)
- Repeated analysis requests (Redis)
- User session data

### Performance Optimizations

- Database indexing on frequently queried fields
- Pagination for large result sets
- Async/await for non-blocking I/O
- Connection pooling
- Response compression (gzip)

---

## Error Handling

### Frontend
- Global error boundary
- Toast notifications for user feedback
- Retry mechanisms for failed requests

### Backend
- Centralized error handler middleware
- Structured error responses
- Logging with severity levels
- Graceful degradation

### AI Service
- Timeout handling for OpenAI calls
- Fallback responses
- Rate limit handling

---

## Monitoring & Observability

### Recommended Stack

- **Logging**: Winston (Node), Loguru (Python)
- **APM**: New Relic, Datadog
- **Error Tracking**: Sentry
- **Metrics**: Prometheus + Grafana

### Key Metrics

- API response times
- Error rates by endpoint
- AI service latency
- Database query performance
- User engagement metrics

---

## Future Enhancements

1. **Real-time Collaboration**: WebSocket support for live code sharing
2. **Code Execution Sandbox**: Safe execution environment using Docker
3. **Plugin System**: Support for additional analysis tools
4. **Team Features**: Shared analysis history, team management
5. **IDE Extensions**: VS Code, JetBrains plugins
6. **Offline Support**: PWA with caching strategies
