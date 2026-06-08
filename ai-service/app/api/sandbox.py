"""
Code Execution Sandbox API Routes

Secure endpoints for executing user code in isolated containers.
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from enum import Enum

from app.services.sandbox_service import (
    SandboxService,
    SandboxConfig,
    Language,
    execute_code
)

router = APIRouter()
sandbox_service = SandboxService()


class ExecuteRequest(BaseModel):
    """Request to execute code"""
    code: str = Field(..., description="Source code to execute", max_length=50000)
    language: Literal["python", "javascript", "java"] = Field(..., description="Programming language")
    stdin: Optional[str] = Field(None, description="Standard input for the program", max_length=10000)
    timeout: int = Field(10, ge=1, le=30, description="Execution timeout in seconds")
    memory_limit: str = Field("128m", description="Memory limit (e.g., '128m', '256m')")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "print('Hello, World!')",
                "language": "python",
                "timeout": 10
            }
        }


class ExecuteResponse(BaseModel):
    """Response from code execution"""
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
    language: str
    timed_out: bool = False
    memory_exceeded: bool = False
    error: Optional[str] = None


class BatchExecuteRequest(BaseModel):
    """Request to execute multiple code snippets"""
    executions: List[ExecuteRequest] = Field(..., max_length=10)


class BatchExecuteResponse(BaseModel):
    """Response from batch execution"""
    results: List[ExecuteResponse]
    total_time: float


class LanguageInfo(BaseModel):
    """Information about a supported language"""
    name: str
    extension: str
    version: Optional[str] = None
    packages: List[str] = []


@router.post("/execute", response_model=ExecuteResponse)
async def execute_user_code(request: ExecuteRequest):
    """
    Execute code in a secure sandbox.
    
    The code runs inside an isolated Docker container with:
    - Limited CPU and memory
    - No network access
    - Read-only filesystem
    - Non-root user
    - Execution timeout
    
    Supports Python and JavaScript.
    
    **Security Notes:**
    - Certain dangerous operations are blocked
    - Output is limited to 10KB
    - Maximum code size is 50KB
    """
    try:
        result = await execute_code(
            code=request.code,
            language=request.language,
            stdin=request.stdin,
            timeout=request.timeout,
            memory_limit=request.memory_limit
        )
        
        return ExecuteResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Execution failed: {str(e)}"
        )


@router.post("/execute/batch", response_model=BatchExecuteResponse)
async def batch_execute(request: BatchExecuteRequest):
    """
    Execute multiple code snippets sequentially.
    
    Limited to 10 executions per request.
    Each execution has the same security constraints.
    """
    import time
    start_time = time.time()
    results = []
    
    for exec_req in request.executions:
        try:
            result = await execute_code(
                code=exec_req.code,
                language=exec_req.language,
                stdin=exec_req.stdin,
                timeout=exec_req.timeout,
                memory_limit=exec_req.memory_limit
            )
            results.append(ExecuteResponse(**result))
        except Exception as e:
            results.append(ExecuteResponse(
                success=False,
                stdout="",
                stderr=str(e),
                exit_code=1,
                execution_time=0,
                language=exec_req.language,
                error=str(e)
            ))
    
    return BatchExecuteResponse(
        results=results,
        total_time=round(time.time() - start_time, 3)
    )


@router.get("/languages")
async def list_languages():
    return {
        "languages": [
            {"name": "python",     "display_name": "Python 3",  "extension": ".py",   "example": "print('Hello, World!')"},
            {"name": "javascript", "display_name": "JavaScript", "extension": ".js",   "example": "console.log('Hello, World!');"},
            {"name": "java",       "display_name": "Java",       "extension": ".java", "example": "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}"},
        ]
    }


@router.post("/execute-simple", response_model=ExecuteResponse)
async def execute_simple(request: ExecuteRequest):
    """
    Execute code without Docker. Supports Python, JavaScript (Node.js), and Java.
    """
    import subprocess
    import tempfile
    import time
    import os
    import re
    import shutil

    start_time = time.time()
    lang = request.language
    temp_dir = None

    try:
        # ── Python ──────────────────────────────────────────────────
        if lang == "python":
            with tempfile.NamedTemporaryFile(mode='w', suffix=".py", delete=False, encoding='utf-8') as f:
                f.write(request.code)
                temp_path = f.name
            cmd = ["python", "-u", temp_path]
            run_cwd = tempfile.gettempdir()

        # ── JavaScript ──────────────────────────────────────────────
        elif lang == "javascript":
            with tempfile.NamedTemporaryFile(mode='w', suffix=".js", delete=False, encoding='utf-8') as f:
                f.write(request.code)
                temp_path = f.name
            cmd = ["node", temp_path]
            run_cwd = tempfile.gettempdir()

        # ── Java ────────────────────────────────────────────────────
        elif lang == "java":
            match = re.search(r'public\s+class\s+(\w+)', request.code)
            class_name = match.group(1) if match else "Main"
            temp_dir = tempfile.mkdtemp(prefix="java_sandbox_")
            src_path = os.path.join(temp_dir, f"{class_name}.java")
            with open(src_path, 'w', encoding='utf-8') as f:
                f.write(request.code)
            # Compile
            compile_result = subprocess.run(
                ["javac", src_path],
                capture_output=True, text=True, timeout=15, cwd=temp_dir
            )
            if compile_result.returncode != 0:
                return ExecuteResponse(
                    success=False, stdout="",
                    stderr=compile_result.stderr,
                    exit_code=1,
                    execution_time=round(time.time() - start_time, 3),
                    language=lang, timed_out=False, memory_exceeded=False,
                    error="Compilation failed"
                )
            cmd = ["java", "-cp", temp_dir, class_name]
            run_cwd = temp_dir
            temp_path = None  # cleaned via temp_dir

        else:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {lang}")

        # ── Run ─────────────────────────────────────────────────────
        try:
            result = subprocess.run(
                cmd,
                capture_output=True, text=True,
                timeout=min(request.timeout, 30),
                input=request.stdin or None,
                cwd=run_cwd,
            )
            return ExecuteResponse(
                success=result.returncode == 0,
                stdout=result.stdout[:10000] if result.stdout else "",
                stderr=result.stderr[:10000] if result.stderr else "",
                exit_code=result.returncode,
                execution_time=round(time.time() - start_time, 3),
                language=lang, timed_out=False, memory_exceeded=False, error=None
            )
        except subprocess.TimeoutExpired:
            return ExecuteResponse(
                success=False, stdout="",
                stderr=f"Execution timed out after {request.timeout} seconds",
                exit_code=124,
                execution_time=round(time.time() - start_time, 3),
                language=lang, timed_out=True, memory_exceeded=False,
                error="Execution timed out"
            )
        finally:
            if temp_dir:
                shutil.rmtree(temp_dir, ignore_errors=True)
            elif temp_path:
                try: os.unlink(temp_path)
                except: pass

    except HTTPException:
        raise
    except Exception as e:
        return ExecuteResponse(
            success=False, stdout="", stderr=str(e), exit_code=1,
            execution_time=round(time.time() - start_time, 3),
            language=lang, timed_out=False, memory_exceeded=False, error=str(e)
        )


@router.get("/status")
async def sandbox_status():
    """
    Check sandbox service status.
    
    Returns Docker availability and image status.
    """
    docker_available = await sandbox_service.check_docker()
    image_exists = await sandbox_service.image_exists() if docker_available else False
    
    return {
        "docker_available": docker_available,
        "image_exists": image_exists,
        "image_name": sandbox_service.config.image_name,
        "config": {
            "memory_limit": sandbox_service.config.memory_limit,
            "cpu_limit": sandbox_service.config.cpu_limit,
            "timeout": sandbox_service.config.timeout,
            "network_disabled": sandbox_service.config.network_disabled,
            "read_only_fs": sandbox_service.config.read_only_fs
        },
        "fallback_mode": not docker_available
    }


@router.post("/build-image")
async def build_sandbox_image():
    """
    Build or rebuild the sandbox Docker image.
    
    This is required before first use if the image doesn't exist.
    """
    docker_available = await sandbox_service.check_docker()
    
    if not docker_available:
        raise HTTPException(
            status_code=503,
            detail="Docker is not available on this system"
        )
    
    success = await sandbox_service.build_image()
    
    if success:
        return {"success": True, "message": "Sandbox image built successfully"}
    else:
        raise HTTPException(
            status_code=500,
            detail="Failed to build sandbox image"
        )


@router.post("/validate")
async def validate_code(request: ExecuteRequest):
    """
    Validate code without executing it.
    
    Checks for blocked patterns and dangerous operations.
    """
    try:
        lang = Language(request.language)
    except ValueError:
        return {
            "valid": False,
            "error": f"Unsupported language: {request.language}"
        }
    
    is_safe, error = sandbox_service.validate_code(request.code, lang)
    
    return {
        "valid": is_safe,
        "error": error,
        "language": request.language,
        "code_length": len(request.code)
    }
