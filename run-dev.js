const { spawn } = require('child_process');
const path = require('path');

// ANSI Escape Codes for Colors
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m'
};

console.log(`${colors.green}=== Starting Frontend & Backend Dev Servers ===${colors.reset}\n`);

function runCommand(command, args, cwd, label, colorCode) {
  const isWindows = process.platform === 'win32';
  const child = spawn(command, args, {
    cwd: cwd,
    shell: isWindows,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colorCode}[${label}]${colors.reset} ${line.replace(/\r?\n|\r/g, '')}`);
      }
    });
  });

  child.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.error(`${colors.red}[${label} ERROR]${colors.reset} ${line.replace(/\r?\n|\r/g, '')}`);
      }
    });
  });

  child.on('close', (code) => {
    console.log(`${colorCode}[${label}]${colors.reset} Process exited with code ${code}`);
  });

  return child;
}

const backendPath = path.join(__dirname, 'backend');
const frontendPath = path.join(__dirname, 'frontend');

// Start both processes
const backendProcess = runCommand('npm', ['run', 'dev'], backendPath, 'Backend', colors.cyan);
const frontendProcess = runCommand('npm', ['run', 'dev'], frontendPath, 'Frontend', colors.magenta);

// Clean up processes on exit
let isCleaningUp = false;
const cleanUp = () => {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log(`\n${colors.yellow}Stopping dev servers...${colors.reset}`);
  
  if (backendProcess && !backendProcess.killed) {
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', backendProcess.pid, '/f', '/t']);
      } catch (err) {
        backendProcess.kill();
      }
    } else {
      backendProcess.kill();
    }
  }

  if (frontendProcess && !frontendProcess.killed) {
    if (process.platform === 'win32') {
      try {
        spawn('taskkill', ['/pid', frontendProcess.pid, '/f', '/t']);
      } catch (err) {
        frontendProcess.kill();
      }
    } else {
      frontendProcess.kill();
    }
  }
  
  setTimeout(() => {
    process.exit();
  }, 500);
};

process.on('SIGINT', cleanUp);
process.on('SIGTERM', cleanUp);
process.on('exit', cleanUp);
