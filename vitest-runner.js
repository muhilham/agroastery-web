// vitest-runner.js

const { spawn } = require('child_process');

// This script ensures the crypto API is available globally before starting Vitest.
const { webcrypto } = require('crypto');
global.crypto = webcrypto;

const args = ['vitest', 'run', ...process.argv.slice(2)];
const vitest = spawn('pnpm', args, { stdio: 'inherit' });

vitest.on('close', (code) => {
  process.exit(code);
});
