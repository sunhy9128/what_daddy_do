#!/usr/bin/env node
process.env.EXPO_TOKEN = 'Bc4vUB0t706OIT9smJ9adHKEKQxNRqdu9eNVfUUN';
const { execSync } = require('child_process');

try {
  const result = execSync('npx eas build:view --build-id 3b983a4c-c695-459f-9116-4e9ebb28c36b', {
    cwd: __dirname,
    encoding: 'utf-8',
    timeout: 30000,
  });
  console.log(result);
} catch (e) {
  console.log('stdout:', e.stdout);
  console.log('stderr:', e.stderr);
}
