import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptPath = path.resolve(__dirname, 'check_data.py');
const args = [scriptPath, ...process.argv.slice(2)];

function tryRun(cmd, nextCmd) {
  const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
  child.on('error', () => {
    if (nextCmd) tryRun(nextCmd, null);
    else {
      console.error(`Neither python3 nor python could be found to run check_data.py.`);
      process.exit(1);
    }
  });
  child.on('exit', (code) => {
    if (code !== 0 && nextCmd) {
      tryRun(nextCmd, null);
    } else {
      process.exit(code || 0);
    }
  });
}

tryRun('python3', 'python');

