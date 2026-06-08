"""
Secure Code Execution Sandbox Service

Executes user code in isolated Docker containers with resource limits.
Supports Python and JavaScript execution.
"""

import asyncio
import subprocess
import tempfile
import os
import uuid
import shutil
import time
from typing import Optional, Dict, Any, Literal
from dataclasses import dataclass, field
from enum import Enum
import logging

logger = logging.getLogger(__name__)


class Language(str, Enum):
    PYTHON = "python"
    JAVASCRIPT = "javascript"


@dataclass
class ExecutionResult:
    """Result of code execution"""
    success: bool
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float  # seconds
    language: str
    timed_out: bool = False
    memory_exceeded: bool = False
    error: Optional[str] = None


@dataclass 
class SandboxConfig:
    """Configuration for sandbox execution"""
    # Resource limits
    memory_limit: str = "128m"  # Docker memory limit (128MB)
    cpu_limit: float = 0.5  # CPU cores (0.5 = 50% of one core)
    timeout: int = 10  # Execution timeout in seconds
    
    # Security settings
    network_disabled: bool = True
    read_only_fs: bool = True
    no_new_privileges: bool = True
    
    # Docker settings
    image_name: str = "code-sandbox:latest"
    container_prefix: str = "sandbox-"


class SandboxService:
    """
    Secure code execution sandbox using Docker containers.
    
    Features:
    - Isolated execution environment
    - Memory and CPU limits
    - Timeout enforcement
    - Network isolation
    - Non-root execution
    """
    
    LANGUAGE_CONFIG = {
        Language.PYTHON: {
            "extension": ".py",
            "command": ["python3"],
            "shebang": "#!/usr/bin/env python3\n"
        },
        Language.JAVASCRIPT: {
            "extension": ".js",
            "command": ["node"],
            "shebang": ""
        }
    }
    
    # Dangerous patterns to block
    BLOCKED_PATTERNS = {
        Language.PYTHON: [
            "import os",
            "from os",
            "import subprocess", 
            "from subprocess",
            "import sys",
            "from sys",
            "__import__",
            "eval(",
            "exec(",
            "compile(",
            "open(",
            "file(",
            "input(",
            "raw_input(",
            "breakpoint(",
            "import socket",
            "from socket",
            "import shutil",
            "from shutil",
            "import ctypes",
            "from ctypes",
            "import multiprocessing",
            "from multiprocessing",
            "__builtins__",
            "globals(",
            "locals(",
            "vars(",
            "dir(",
            "getattr(",
            "setattr(",
            "delattr(",
            "hasattr(",
            "import requests",
            "from requests",
            "import urllib",
            "from urllib",
            "import http",
            "from http",
            "import ftplib",
            "from ftplib",
            "import telnetlib",
            "from telnetlib",
            "import pickle",
            "from pickle",
            "import shelve",
            "from shelve",
            "import tempfile",
            "from tempfile",
            "import pty",
            "from pty",
        ],
        Language.JAVASCRIPT: [
            "require('child_process')",
            "require('fs')",
            "require('net')",
            "require('http')",
            "require('https')",
            "require('dgram')",
            "require('cluster')",
            "require('worker_threads')",
            "require('vm')",
            "require('repl')",
            "process.env",
            "process.exit",
            "process.kill",
            "process.binding",
            "eval(",
            "Function(",
            "setTimeout(",
            "setInterval(",
            "setImmediate(",
            "import(",
            "require(",
            "global.",
            "__dirname",
            "__filename",
        ]
    }
    
    def __init__(self, config: Optional[SandboxConfig] = None):
        self.config = config or SandboxConfig()
        self._docker_available: Optional[bool] = None
    
    async def check_docker(self) -> bool:
        """Check if Docker is available"""
        if self._docker_available is not None:
            return self._docker_available
            
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "version",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            self._docker_available = proc.returncode == 0
        except Exception:
            self._docker_available = False
            
        return self._docker_available
    
    async def build_image(self) -> bool:
        """Build the sandbox Docker image"""
        sandbox_dir = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "sandbox"
        )
        
        if not os.path.exists(os.path.join(sandbox_dir, "Dockerfile")):
            logger.error(f"Dockerfile not found in {sandbox_dir}")
            return False
        
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "build", "-t", self.config.image_name, sandbox_dir,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            
            if proc.returncode != 0:
                logger.error(f"Docker build failed: {stderr.decode()}")
                return False
                
            logger.info(f"Successfully built {self.config.image_name}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to build Docker image: {e}")
            return False
    
    async def image_exists(self) -> bool:
        """Check if sandbox image exists"""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "image", "inspect", self.config.image_name,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            await proc.communicate()
            return proc.returncode == 0
        except Exception:
            return False
    
    def validate_code(self, code: str, language: Language) -> tuple[bool, Optional[str]]:
        """
        Validate code for dangerous patterns.
        Returns (is_safe, error_message)
        """
        blocked = self.BLOCKED_PATTERNS.get(language, [])
        
        for pattern in blocked:
            if pattern in code:
                return False, f"Blocked pattern detected: {pattern}"
        
        # Check code length
        if len(code) > 50000:  # 50KB limit
            return False, "Code exceeds maximum length (50KB)"
        
        return True, None
    
    async def execute(
        self,
        code: str,
        language: Language,
        stdin: Optional[str] = None
    ) -> ExecutionResult:
        """
        Execute code in a sandboxed Docker container.
        
        Args:
            code: Source code to execute
            language: Programming language (python/javascript)
            stdin: Optional input to provide to the program
            
        Returns:
            ExecutionResult with stdout, stderr, exit code, etc.
        """
        start_time = time.time()
        
        # Validate code
        is_safe, error = self.validate_code(code, language)
        if not is_safe:
            return ExecutionResult(
                success=False,
                stdout="",
                stderr=error or "Code validation failed",
                exit_code=1,
                execution_time=0,
                language=language.value,
                error=error
            )
        
        # Check Docker availability
        if not await self.check_docker():
            # Fallback to subprocess (less secure, for development only)
            logger.warning("Docker not available, using subprocess fallback")
            return await self._execute_subprocess(code, language, stdin, start_time)
        
        # Ensure image exists
        if not await self.image_exists():
            built = await self.build_image()
            if not built:
                return ExecutionResult(
                    success=False,
                    stdout="",
                    stderr="Failed to build sandbox image",
                    exit_code=1,
                    execution_time=time.time() - start_time,
                    language=language.value,
                    error="Docker image build failed"
                )
        
        return await self._execute_docker(code, language, stdin, start_time)
    
    async def _execute_docker(
        self,
        code: str,
        language: Language,
        stdin: Optional[str],
        start_time: float
    ) -> ExecutionResult:
        """Execute code in Docker container"""
        lang_config = self.LANGUAGE_CONFIG[language]
        container_name = f"{self.config.container_prefix}{uuid.uuid4().hex[:12]}"
        
        # Create temp directory with code file
        temp_dir = tempfile.mkdtemp(prefix="sandbox_")
        code_file = f"code{lang_config['extension']}"
        code_path = os.path.join(temp_dir, code_file)
        
        try:
            # Write code to file
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(lang_config["shebang"] + code)
            
            # Build Docker command
            docker_cmd = [
                "docker", "run",
                "--rm",  # Remove container after execution
                "--name", container_name,
                "--memory", self.config.memory_limit,
                f"--cpus={self.config.cpu_limit}",
                "--pids-limit", "50",  # Limit processes
                "--ulimit", "nofile=64:64",  # Limit open files
            ]
            
            # Security options
            if self.config.network_disabled:
                docker_cmd.append("--network=none")
            
            if self.config.read_only_fs:
                docker_cmd.extend(["--read-only", "--tmpfs", "/tmp:size=10m"])
            
            if self.config.no_new_privileges:
                docker_cmd.append("--security-opt=no-new-privileges")
            
            # Mount code directory
            docker_cmd.extend([
                "-v", f"{temp_dir}:/app/code:ro",
                "-w", "/app/code",
                self.config.image_name
            ])
            
            # Add execution command
            docker_cmd.extend(lang_config["command"])
            docker_cmd.append(code_file)
            
            # Execute with timeout
            try:
                proc = await asyncio.create_subprocess_exec(
                    *docker_cmd,
                    stdin=asyncio.subprocess.PIPE if stdin else None,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                
                try:
                    stdout, stderr = await asyncio.wait_for(
                        proc.communicate(stdin.encode() if stdin else None),
                        timeout=self.config.timeout
                    )
                    
                    execution_time = time.time() - start_time
                    
                    return ExecutionResult(
                        success=proc.returncode == 0,
                        stdout=stdout.decode(errors="replace")[:10000],  # Limit output
                        stderr=stderr.decode(errors="replace")[:10000],
                        exit_code=proc.returncode or 0,
                        execution_time=execution_time,
                        language=language.value
                    )
                    
                except asyncio.TimeoutError:
                    # Kill container on timeout
                    await self._kill_container(container_name)
                    
                    return ExecutionResult(
                        success=False,
                        stdout="",
                        stderr=f"Execution timed out after {self.config.timeout} seconds",
                        exit_code=124,
                        execution_time=self.config.timeout,
                        language=language.value,
                        timed_out=True
                    )
                    
            except Exception as e:
                return ExecutionResult(
                    success=False,
                    stdout="",
                    stderr=str(e),
                    exit_code=1,
                    execution_time=time.time() - start_time,
                    language=language.value,
                    error=str(e)
                )
                
        finally:
            # Cleanup temp directory
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    async def _execute_subprocess(
        self,
        code: str,
        language: Language,
        stdin: Optional[str],
        start_time: float
    ) -> ExecutionResult:
        """
        Fallback subprocess execution (less secure).
        Only for development when Docker is not available.
        """
        lang_config = self.LANGUAGE_CONFIG[language]
        temp_dir = tempfile.mkdtemp(prefix="sandbox_")
        code_file = f"code{lang_config['extension']}"
        code_path = os.path.join(temp_dir, code_file)
        
        try:
            # Write code
            with open(code_path, "w", encoding="utf-8") as f:
                f.write(code)
            
            # Execute
            cmd = lang_config["command"] + [code_path]
            
            try:
                proc = await asyncio.create_subprocess_exec(
                    *cmd,
                    stdin=asyncio.subprocess.PIPE if stdin else None,
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=temp_dir
                )
                
                try:
                    stdout, stderr = await asyncio.wait_for(
                        proc.communicate(stdin.encode() if stdin else None),
                        timeout=self.config.timeout
                    )
                    
                    return ExecutionResult(
                        success=proc.returncode == 0,
                        stdout=stdout.decode(errors="replace")[:10000],
                        stderr=stderr.decode(errors="replace")[:10000],
                        exit_code=proc.returncode or 0,
                        execution_time=time.time() - start_time,
                        language=language.value
                    )
                    
                except asyncio.TimeoutError:
                    proc.kill()
                    return ExecutionResult(
                        success=False,
                        stdout="",
                        stderr=f"Execution timed out after {self.config.timeout} seconds",
                        exit_code=124,
                        execution_time=self.config.timeout,
                        language=language.value,
                        timed_out=True
                    )
                    
            except Exception as e:
                return ExecutionResult(
                    success=False,
                    stdout="",
                    stderr=str(e),
                    exit_code=1,
                    execution_time=time.time() - start_time,
                    language=language.value,
                    error=str(e)
                )
                
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)
    
    async def _kill_container(self, container_name: str) -> None:
        """Kill a running Docker container"""
        try:
            proc = await asyncio.create_subprocess_exec(
                "docker", "kill", container_name,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            await proc.wait()
        except Exception:
            pass


# Convenience function
async def execute_code(
    code: str,
    language: str,
    stdin: Optional[str] = None,
    timeout: int = 10,
    memory_limit: str = "128m"
) -> Dict[str, Any]:
    """
    Execute code in a sandbox.
    
    Args:
        code: Source code to execute
        language: "python" or "javascript"
        stdin: Optional input
        timeout: Timeout in seconds
        memory_limit: Docker memory limit
        
    Returns:
        Dictionary with execution results
    """
    try:
        lang = Language(language.lower())
    except ValueError:
        return {
            "success": False,
            "error": f"Unsupported language: {language}. Supported: python, javascript"
        }
    
    config = SandboxConfig(timeout=timeout, memory_limit=memory_limit)
    sandbox = SandboxService(config)
    result = await sandbox.execute(code, lang, stdin)
    
    return {
        "success": result.success,
        "stdout": result.stdout,
        "stderr": result.stderr,
        "exit_code": result.exit_code,
        "execution_time": round(result.execution_time, 3),
        "language": result.language,
        "timed_out": result.timed_out,
        "memory_exceeded": result.memory_exceeded,
        "error": result.error
    }
