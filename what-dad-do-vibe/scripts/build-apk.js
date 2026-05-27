#!/usr/bin/env node
process.env.EXPO_TOKEN = 'Bc4vUB0t706OIT9smJ9adHKEKQxNRqdu9eNVfUUN';
const { spawn } = require('child_process');
const child = spawn('npx', ['eas', 'build', '--platform', 'android', '--profile', 'preview', '--non-interactive', '--wait'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, EXPO_TOKEN: 'Bc4vUB0t706OIT9smJ9adHKEKQxNRqdu9eNVfUUN' },
  shell: true,
});
child.on('exit', (code) => process.exit(code));
