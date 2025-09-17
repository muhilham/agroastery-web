// vitest-runner.js

const { spawn } = require('child_process');

// This script ensures the crypto API is available globally before starting Vitest.
const { webcrypto } = require('crypto');
global.crypto = webcrypto;

const vitest = spawn('pnpm', ['vitest'], { stdio: 'inherit' });

vitest.on('close', (code) => {
  process.exit(code);
});

