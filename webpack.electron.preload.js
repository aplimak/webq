const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  target: 'electron-preload',
  entry: {
    electron_preload: './src//shell/electron/preload/index.ts',
  },
  output: {
    path: path.resolve(process.env.WEBQ_OUTPUT, 'preload'),
    filename: 'index.js',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  devtool: isProduction ? false : 'source-map',
};
