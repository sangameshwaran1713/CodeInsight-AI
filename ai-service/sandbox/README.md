# Code Execution Sandbox

Secure code execution environment using Docker containers.

## Features

- **Isolated Execution**: Code runs in Docker containers with no access to host system
- **Resource Limits**: CPU and memory limits prevent resource exhaustion
- **Network Isolation**: No network access from sandbox containers
- **Read-Only Filesystem**: Prevents file system modifications
- **Timeout Enforcement**: Automatic termination of long-running code
- **Code Validation**: Blocks dangerous patterns before execution

## Supported Languages

| Language | Runtime | Pre-installed Packages |
|----------|---------|----------------------|
| Python | 3.11 | numpy, pandas, requests |
| JavaScript | Node.js | (none) |

## Security Measures

### Container Isolation
- Non-root user execution
- Read-only root filesystem
- No new privileges (`--security-opt=no-new-privileges`)
- Network disabled (`--network=none`)
- Process limit (`--pids-limit=50`)
- File descriptor limit (`--ulimit nofile=64:64`)

### Code Validation
Blocked patterns for Python:
- `import os`, `import subprocess`, `import sys`
- `__import__`, `eval(`, `exec(`, `compile(`
- `open(`, `file(`, `input(`
- `import socket`, `import shutil`, `import ctypes`

Blocked patterns for JavaScript:
- `require('child_process')`, `require('fs')`
- `require('net')`, `require('http')`
- `process.env`, `process.exit`, `process.kill`
- `eval(`, `Function(`

### Resource Limits
- Memory: 128MB default (configurable)
- CPU: 0.5 cores default (configurable)
- Timeout: 10 seconds default (max 30 seconds)
- Output: 10KB max
- Code size: 50KB max

## API Endpoints

### Execute Code
```
POST /api/sandbox/execute
{
    "code": "print('Hello')",
    "language": "python",
    "timeout": 10,
    "memory_limit": "128m"
}
```

### Batch Execute
```
POST /api/sandbox/execute/batch
{
    "executions": [
        {"code": "print(1)", "language": "python"},
        {"code": "console.log(2)", "language": "javascript"}
    ]
}
```

### Validate Code
```
POST /api/sandbox/validate
{
    "code": "import os",
    "language": "python"
}
```

### Check Status
```
GET /api/sandbox/status
```

### Build Image
```
POST /api/sandbox/build-image
```

## Setup

### 1. Build Docker Image

```bash
cd ai-service/sandbox
docker build -t code-sandbox:latest .
```

Or via API:
```bash
curl -X POST http://localhost:8000/api/sandbox/build-image
```

### 2. Verify Setup

```bash
curl http://localhost:8000/api/sandbox/status
```

### 3. Test Execution

```bash
curl -X POST http://localhost:8000/api/sandbox/execute \
  -H "Content-Type: application/json" \
  -d '{"code": "print(sum(range(10)))", "language": "python"}'
```

## Fallback Mode

When Docker is not available, the sandbox falls back to subprocess execution with validation only. This is **NOT RECOMMENDED** for production as it lacks container isolation.

## Configuration

Configure via `SandboxConfig`:

```python
from app.services.sandbox_service import SandboxService, SandboxConfig

config = SandboxConfig(
    memory_limit="256m",
    cpu_limit=1.0,
    timeout=15,
    network_disabled=True,
    read_only_fs=True,
    no_new_privileges=True,
    image_name="code-sandbox:latest"
)

sandbox = SandboxService(config)
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    FastAPI                          │
│  POST /api/sandbox/execute                          │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│              SandboxService                         │
│  - Code validation                                  │
│  - Docker container management                      │
│  - Timeout enforcement                              │
└───────────────────────┬─────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────┐
│           Docker Container (code-sandbox)           │
│  ┌─────────────────────────────────────────────┐   │
│  │  User: sandbox (non-root)                   │   │
│  │  Filesystem: read-only                      │   │
│  │  Network: none                              │   │
│  │  Memory: limited                            │   │
│  │  CPU: limited                               │   │
│  │                                             │   │
│  │  ┌─────────────────────────────────────┐   │   │
│  │  │  Python 3.11 / Node.js              │   │   │
│  │  │  Executes user code                 │   │   │
│  │  └─────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```
