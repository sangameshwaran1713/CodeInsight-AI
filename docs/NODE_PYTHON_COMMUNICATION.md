# Node.js ↔ Python Service Communication

This document explains how the Node.js backend communicates with the Python AI service.

## Architecture

```
┌─────────────┐     HTTP/REST      ┌─────────────────┐
│   Node.js   │ ─────────────────► │  Python FastAPI │
│   Backend   │                    │   AI Service    │
│             │ ◄───────────────── │                 │
│  Port 5000  │     JSON Response  │    Port 8000    │
└─────────────┘                    └─────────────────┘
```

## Communication Flow

### 1. Client Request
```javascript
// Client makes request to Node.js backend
POST /api/analysis/explain
{
  "code": "def hello(): print('Hello')",
  "language": "python"
}
```

### 2. Node.js Service Layer (ai.service.js)
```javascript
// server/src/services/ai.service.js
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: AI_SERVICE_URL,
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  async analyzeCode(code, language, analysisType) {
    const response = await this.client.post(`/api/analyze/${analysisType}`, {
      code,
      language,
    });
    return response.data;
  }
}

module.exports = new AIService();
```

### 3. Node.js Controller
```javascript
// server/src/controllers/analysis.controller.js
const aiService = require('../services/ai.service');

exports.explainCode = async (req, res, next) => {
  try {
    const { code, language } = req.body;
    const result = await aiService.analyzeCode(code, language, 'explain');
    res.json({ success: true, result: result.data });
  } catch (error) {
    next(error);
  }
};
```

### 4. Python FastAPI Endpoint
```python
# ai-service/app/api/analysis.py
from fastapi import APIRouter
from app.services.llm_service import LLMService

router = APIRouter()
llm_service = LLMService()

@router.post("/explain")
async def explain_code(request: AnalysisRequest):
    result = await llm_service.explain_code(
        request.code, 
        request.language
    )
    return {"success": True, "data": result}
```

### 5. Python LLM Service
```python
# ai-service/app/services/llm_service.py
from openai import AsyncOpenAI

class LLMService:
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key)
    
    async def explain_code(self, code: str, language: str) -> str:
        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "Explain what this code does..."},
                {"role": "user", "content": f"```{language}\n{code}\n```"},
            ]
        )
        return response.choices[0].message.content
```

## Environment Configuration

### Node.js (.env)
```env
AI_SERVICE_URL=http://localhost:8000
```

### Python (.env)
```env
OPENAI_API_KEY=your-api-key
OPENAI_MODEL=gpt-4-turbo-preview
```

## Error Handling

### Node.js Side
```javascript
async analyzeCode(code, language, analysisType) {
  try {
    const response = await this.client.post(`/api/analyze/${analysisType}`, {
      code,
      language,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || 'AI service error');
    }
    throw new Error('Unable to connect to AI service');
  }
}
```

### Python Side
```python
@router.post("/explain")
async def explain_code(request: AnalysisRequest):
    try:
        result = await llm_service.explain_code(request.code, request.language)
        return AnalysisResponse(success=True, data=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

## Health Check

Both services expose health endpoints:

- **Node.js**: `GET http://localhost:5000/health`
- **Python**: `GET http://localhost:8000/health`

The Node.js service can verify Python service availability:

```javascript
async healthCheck() {
  try {
    const response = await this.client.get('/health');
    return response.data;
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

## Docker Networking

When using Docker Compose, services communicate via service names:

```yaml
# docker-compose.yml
services:
  server:
    environment:
      - AI_SERVICE_URL=http://ai-service:8000
  
  ai-service:
    # Python service on internal network
```

The Node.js service uses `ai-service` as the hostname instead of `localhost`.
