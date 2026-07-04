// scripts/webpack-runner.js
const { spawn } = require('child_process');
const path = require('path');

const config = process.argv[2] || 'webpack.config.js';
const env = process.env.NODE_ENV || 'development';
const target = process.env.WEBQ_TARGET || 'browser';
const outDir = target === 'cordova' ? ['www'] : ['bundle', target];
const output = path.resolve(__dirname, '..', ...outDir);

const args = ['--config', config, '--progress', '--stats-error-details'];
if (env === 'production') {
  args.push('--fail-on-warnings');
}

console.log(`> webpack ${args.join(' ')} (NODE_ENV=${env}, WEBQ_TARGET=${target})`);
const child = spawn('npx', ['webpack', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: env,
    WEBQ_TARGET: target,
    WEBQ_OUTPUT: output,
    BROWSERSLIST_ENV: target,
  },
});

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  child.kill('SIGINT'); // forward the signal
});

child.on('exit', (code) => {
  process.exit(code);
});
