const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  target: 'electron-main',
  entry: {
    electron_main: './src/shell/electron/main/index.ts',
  },
  output: {
    path: path.resolve(process.env.WEBQ_OUTPUT, 'main'),
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
  devtool: isProduction ? false : 'source-map',
};
