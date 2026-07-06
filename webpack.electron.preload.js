const base = require('./webpack.base');

const path = require('path');
const { merge } = require('webpack-merge');

const config = {
  target: 'electron42-preload',
  entry: {
    electron_preload: './src/shell/bridges/electron/preload/index.ts',
  },
  output: {
    path: path.resolve(process.env.WEBQ_OUTPUT, 'preload'),
    filename: 'index.js',
  },
};

module.exports = merge(base, config);
