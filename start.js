const { spawn, execSync } = require('child_process');
const http = require('http');
const path = require('path');

const isWindows = process.platform === 'win32';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

function log(prefix, color, msg) {
  console.log(`${color}[${prefix}]${colors.reset} ${msg}`);
}

// Check if a port is already listening
function isPortInUse(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, () => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => { req.destroy(); resolve(false); });
  });
}

// Start a process and prefix its output
function startProcess(name, color, command, args, cwd) {
  log(name, color, `Starting... (${command} ${args.join(' ')})`);
  const proc = spawn(command, args, {
    cwd: cwd || process.cwd(),
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  proc.stdout.on('data', (data) => {
    data.toString().trim().split('\n').forEach((line) => {
      if (line.trim()) log(name, color, line);
    });
  });

  proc.stderr.on('data', (data) => {
    data.toString().trim().split('\n').forEach((line) => {
      if (line.trim()) log(name, color, line);
    });
  });

  proc.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      log(name, colors.red, `Process exited with code ${code}`);
    }
  });

  return proc;
}

async function main() {
  console.log(`\n${colors.cyan}========================================${colors.reset}`);
  console.log(`${colors.cyan}   CodeInsight AI - Starting All Services${colors.reset}`);
  console.log(`${colors.cyan}========================================${colors.reset}\n`);

  const processes = [];

  // ─── 1. OLLAMA ───────────────────────────────────────────────────────────
  const ollamaRunning = await isPortInUse(11434);
  if (ollamaRunning) {
    log('OLLAMA', colors.yellow, 'Already running on port 11434 ✓');
  } else {
    log('OLLAMA', colors.yellow, 'Starting Ollama...');
    const ollamaProc = startProcess('OLLAMA', colors.yellow, 'ollama', ['serve'], process.cwd());
    processes.push(ollamaProc);

    // Wait for Ollama to be ready
    log('OLLAMA', colors.yellow, 'Waiting for Ollama to be ready...');
    let ready = false;
    for (let i = 0; i < 15; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      ready = await isPortInUse(11434);
      if (ready) break;
    }
    if (ready) {
      log('OLLAMA', colors.yellow, 'Ollama is ready ✓');
    } else {
      log('OLLAMA', colors.red, 'Ollama did not start in time - continuing anyway');
    }
  }

  // ─── 2. AI SERVICE (Python/FastAPI) ──────────────────────────────────────
  const aiRunning = await isPortInUse(8000);
  if (aiRunning) {
    log('AI-SVC', colors.magenta, 'Already running on port 8000 ✓');
  } else {
    const aiProc = startProcess(
      'AI-SVC', colors.magenta,
      'python', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', '8000'],
      path.join(process.cwd(), 'ai-service')
    );
    processes.push(aiProc);
  }

  // ─── 3. BACKEND (Node/Express) ───────────────────────────────────────────
  const serverRunning = await isPortInUse(5000);
  if (serverRunning) {
    log('SERVER', colors.blue, 'Already running on port 5000 ✓');
  } else {
    const serverProc = startProcess(
      'SERVER', colors.blue,
      isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'],
      path.join(process.cwd(), 'server')
    );
    processes.push(serverProc);
  }

  // ─── 4. FRONTEND (React/Vite) ────────────────────────────────────────────
  const clientRunning = await isPortInUse(3000);
  if (clientRunning) {
    log('CLIENT', colors.green, 'Already running on port 3000 ✓');
  } else {
    const clientProc = startProcess(
      'CLIENT', colors.green,
      isWindows ? 'npm.cmd' : 'npm', ['run', 'dev'],
      path.join(process.cwd(), 'client')
    );
    processes.push(clientProc);
  }

  // ─── Ready banner ─────────────────────────────────────────────────────────
  setTimeout(async () => {
    const [c, s, a, o] = await Promise.all([
      isPortInUse(3000),
      isPortInUse(5000),
      isPortInUse(8000),
      isPortInUse(11434),
    ]);
    console.log(`\n${colors.cyan}========================================${colors.reset}`);
    console.log(`${colors.cyan}   All Services Status${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`  Ollama      :11434  ${o ? colors.green + '✓ Running' : colors.red + '✗ Not running'}${colors.reset}`);
    console.log(`  AI Service  :8000   ${a ? colors.green + '✓ Running' : colors.red + '✗ Not running'}${colors.reset}`);
    console.log(`  Backend     :5000   ${s ? colors.green + '✓ Running' : colors.red + '✗ Not running'}${colors.reset}`);
    console.log(`  Frontend    :3000   ${c ? colors.green + '✓ Running' : colors.red + '✗ Not running'}${colors.reset}`);
    console.log(`${colors.cyan}========================================${colors.reset}`);
    console.log(`\n  ${colors.green}Open: http://localhost:3000${colors.reset}`);
    console.log(`  ${colors.yellow}Login: mmm@gmail.com / SecurePass123!${colors.reset}\n`);
  }, 12000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.red}Shutting down all services...${colors.reset}`);
    processes.forEach((p) => p.kill());
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    processes.forEach((p) => p.kill());
    process.exit(0);
  });
}

main().catch(console.error);
