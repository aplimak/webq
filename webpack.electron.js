const base = require('./webpack.base');

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');

const mainConfig = merge(base, {
  target: 'electron42-main',
  entry: {
    electron_main: './src/shell/bridges/electron/main/index.ts',
  },
  output: {
    path: path.resolve(process.env.WEBQ_OUTPUT, 'main'),
    filename: 'index.js',
  },
  module: {
    rules: [
      {
        test: /\.node$/,
        use: 'node-loader',
      },
    ],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'assets/icon_round.png',
          to: 'icon.png',
        },
      ],
    }),
  ],
  node: {
    __dirname: false, // Keep __dirname as actual path
    __filename: false,
  },
});

const preloadConfig = merge(base, {
  target: 'electron42-preload',
  entry: {
    electron_preload: './src/shell/bridges/electron/preload/index.ts',
  },
  output: {
    path: path.resolve(process.env.WEBQ_OUTPUT, 'preload'),
    filename: 'index.js',
  },
});

const configs = [mainConfig, preloadConfig];
if (process.env.WEBQ_ELECTRON_NO_RENDERER !== '1') {
  configs.push(require('./webpack.config'));
}

module.exports = configs;
