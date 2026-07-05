const path = require('path');
const { DefinePlugin } = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const pkg = require('./package.json');
const { isProduction, isWebpackServe, targetPlatform } = require('./scripts/webpack-env.mjs');

module.exports = {
  context: __dirname,
  mode: isProduction ? 'production' : 'development',
  devtool: isProduction ? false : 'eval-source-map',
  performance: {
    hints: false,
  },
  module: {
    rules: [
      {
        test: /\.([cm]?ts|tsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader', 'ts-loader'],
      },
      {
        test: /\.([cm]?js)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    extensionAlias: {
      '.js': ['.js', '.ts'],
      '.cjs': ['.cjs', '.cts'],
      '.mjs': ['.mjs', '.mts'],
    },
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'package.json': path.resolve(__dirname, 'package.json'),
      '@node_modules': path.resolve(__dirname, 'node_modules'),
    },
  },
  plugins: [
    new DefinePlugin({
      __WEBQ_NODE_ENV__: JSON.stringify(process.env.NODE_ENV),
      __WEBQ_WEBPACK_SERVE__: JSON.stringify(isWebpackServe),
      __WEBQ_TARGET__: JSON.stringify(targetPlatform),
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      },
    }),
  ],
};
