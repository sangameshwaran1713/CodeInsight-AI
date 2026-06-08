from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import uvicorn
from dotenv import load_dotenv
import os

from app.api import analysis_router, github_router, sandbox_router, anti_gravity_router
from app.config import settings


# Global runtime provider state (allows switching without restart)
_runtime_provider = {"value": settings.ai_provider}


class ProviderRequest(BaseModel):
    provider: str  # "ollama" or "openai"


def get_current_provider() -> str:
    """Get the current AI provider"""
    return _runtime_provider["value"]


def set_current_provider(provider: str):
    """Set the current AI provider at runtime"""
    _runtime_provider["value"] = provider

# Load environment variables
load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[AI Service] Starting up...")
    yield
    # Shutdown
    print("[AI Service] Shutting down...")


app = FastAPI(
    title="CodeInsight AI Service",
    description="AI-powered code analysis service using OpenAI and static analysis tools",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(analysis_router, prefix="/api/analyze", tags=["Analysis"])
app.include_router(github_router, prefix="/api/github", tags=["GitHub Repository Analysis"])
app.include_router(sandbox_router, prefix="/api/sandbox", tags=["Code Execution Sandbox"])
app.include_router(anti_gravity_router, prefix="/api/anti-gravity", tags=["Anti-Gravity Analysis"])


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "CodeInsight AI Service",
        "version": "1.0.0",
    }


@app.get("/api/provider")
async def get_provider():
    """Get the current AI provider and model configurations"""
    return {
        "provider": get_current_provider(),
        "available_providers": ["ollama", "openai"],
        "ollama_model": settings.ollama_model,
        "openai_model": settings.openai_model,
        "models": [m.dict() for m in settings.models],
        "default_model": settings.default_model,
        "tab_autocomplete_model": settings.tab_autocomplete_model.dict() if settings.tab_autocomplete_model else None,
        "anti_gravity": {
            "enabled": settings.anti_gravity.enabled,
            "module": "anti_gravity"
        }
    }


@app.post("/api/provider")
async def set_provider(request: ProviderRequest):
    """Set the AI provider at runtime"""
    provider = request.provider.lower()
    if provider not in ["ollama", "openai"]:
        return {"error": "Invalid provider. Use 'ollama' or 'openai'"}
    
    set_current_provider(provider)
    return {
        "success": True,
        "provider": provider,
        "message": f"AI provider changed to {provider}"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to CodeInsight AI Service",
        "docs": "/docs",
        "health": "/health",
    }


if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
    )
