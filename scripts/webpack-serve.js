// scripts/webpack-serve.js
const { spawn } = require('child_process');

const env = process.env.NODE_ENV || 'development';
const target = process.env.WEBQ_TARGET || 'browser';

const args = ['serve', '--config', 'webpack.config.js', '--progress'];

console.log(`> webpack ${args.join(' ')} (NODE_ENV=${env}, WEBQ_TARGET=${target})`);
const child = spawn('npx', ['webpack', ...args], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: env, WEBQ_TARGET: target },
});

// Handle SIGINT (Ctrl+C) gracefully
process.on('SIGINT', () => {
  child.kill('SIGINT'); // forward the signal
});

child.on('exit', (code) => {
  process.exit(code);
});
