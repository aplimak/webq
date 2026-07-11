// scripts/webpack-runner.js
const { spawn } = require('child_process');
const path = require('path');

const config = process.argv[2] || 'webpack.config.js';
const env = process.env.NODE_ENV || 'development';
const target = process.env.WEBQ_TARGET || 'browser';
const output = path.resolve(__dirname, '..', 'bundle', target);
const watch = process.env.WEBQ_WATCH === '1';
const serve = process.env.WEBQ_SERVE === '1';

const args = [serve ? 'serve' : 'build', '--config', config, '--stats-error-details'];
if (env === 'production') {
  args.push('--fail-on-warnings');
}
if (watch) {
  args.push('--watch');
}

const wpEnv = {
  NODE_ENV: env,
  WEBQ_TARGET: target,
  WEBQ_OUTPUT: output,
  BROWSERSLIST_ENV: target,
};

console.log(
  `> webpack ${args.join(' ')} (NODE_ENV=${wpEnv.NODE_ENV}, WEBQ_TARGET=${wpEnv.WEBQ_TARGET})`
);
const child = spawn('npx', ['webpack', ...args], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ...wpEnv,
  },
});

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  child.kill('SIGINT'); // forward the signal
});

child.on('exit', (code) => {
  process.exit(code);
});
