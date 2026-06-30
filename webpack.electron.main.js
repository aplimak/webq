const base = require('./webpack.base');

const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { merge } = require('webpack-merge');

const config = {
  target: 'electron-main',
  entry: {
    electron_main: './src/shell/electron/main/index.ts',
  },
  output: {
    path: path.resolve(process.env.WEBQ_OUTPUT, 'main'),
    filename: 'index.js',
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
};

module.exports = merge(base, config);
