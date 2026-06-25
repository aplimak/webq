const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  mode: isProduction ? 'production' : 'development',
  target: 'electron-main',
  entry: {
    electron_main: './src/shell/electron/main/index.ts',
  },
  output: {
    path: path.resolve(__dirname, './www'),
    filename: 'electron-main.js',
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
  node: {
    __dirname: false, // Keep __dirname as actual path
    __filename: false,
  },
  devtool: isProduction ? false : 'source-map',
};
