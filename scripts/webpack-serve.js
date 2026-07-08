// scripts/webpack-serve.js
const { spawn } = require('child_process');

const env = process.env.NODE_ENV || 'development';
const target = process.env.WEBQ_TARGET || 'browser';

const args = ['serve', '--config', 'webpack.config.js', '--progress'];

const wpEnv = {
  NODE_ENV: env,
  WEBQ_TARGET: target,
  BROWSERSLIST_ENV: target,
};

console.log(
  `> webpack ${args.join(' ')} (NODE_ENV=${wpEnv.NODE_ENV}, WEBQ_TARGET=${wpEnv.WEBQ_TARGET})`
);
const child = spawn('npx', ['webpack', ...args], {
  stdio: 'inherit',
  env: { ...process.env, ...wpEnv },
});

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  child.kill('SIGINT'); // forward the signal
});

child.on('exit', (code) => {
  process.exit(code);
});
