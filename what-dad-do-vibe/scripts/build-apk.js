const path = require('path');
const projectRoot = path.resolve(__dirname, '..');
process.env.EXPO_TOKEN = 'Bc4vUB0t706OIT9smJ9adHKEKQxNRqdu9eNVfUUN';
require('child_process').execSync(
  `node ${path.join(projectRoot, 'node_modules/eas-cli/build/index.js')} build --platform android --profile preview --non-interactive`,
  { cwd: projectRoot, stdio: 'inherit', timeout: 600000 }
);
