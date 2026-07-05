const pkg = require('./package.json');
const base = require('./webpack.base');
const { isProduction, isWebpackServe, targetPlatform } = require('./scripts/webpack-env.mjs');

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { merge } = require('webpack-merge');

const pwaPlugins =
  targetPlatform === 'browser' && !isWebpackServe
    ? [
        new GenerateSW({
          swDest: 'service-worker.js',
          clientsClaim: true, // Take control of pages immediately
          skipWaiting: true, // Force update on new version

          // Exclude source maps and the manifest from precaching
          exclude: [/\.map$/, /manifest.webmanifest$/],

          // IMPORTANT: Tell Workbox not to add cache-busting query params
          // to hashed files (they're already uniquely versioned)
          dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,
          maximumFileSizeToCacheInBytes: 10000000,

          // Define runtime caching rules for external resources
          runtimeCaching: [
            {
              // cache Google Fonts
              urlPattern: /^https:\/\/fonts\.googleapis\.com/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
          ],
        }),
      ]
    : [];

const iconPlugin =
  targetPlatform === 'browser'
    ? [
        new FaviconsWebpackPlugin({
          logo: 'assets/icon_round.png',
          manifest: './manifest.webmanifest',
          favicons: {
            appName: pkg.displayName,
            appDescription: pkg.description,
            developerName: pkg.author.name,
            developerURL: pkg.author.url,
            version: pkg.version,
          },
        }),
      ]
    : [];

const config = {
  target:
    targetPlatform === 'electron' ? 'electron42-renderer' : isWebpackServe ? 'web' : 'browserslist',
  entry: {
    shell: './src/index.ts',
  },
  output: {
    path:
      targetPlatform === 'electron'
        ? path.resolve(process.env.WEBQ_OUTPUT, 'renderer')
        : process.env.WEBQ_OUTPUT,
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '',
    globalObject: 'window',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.html?$/,
        use: 'html-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(css|sass|scss)$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader', // Injects CSS into the DOM
          'css-loader', // Resolves @import and url() inside CSS
          'postcss-loader',
          'sass-loader', // Compiles Sass to CSS
        ],
      },
      {
        test: /\.module\.css$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          {
            loader: 'css-loader',
            options: {
              modules: true,
            },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.(png|jpe?g|gif|webp|avif|svg)$/i,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 8 * 1024, // Inline images < 8kb as base64 data URLs
          },
        },
        generator: {
          filename: 'images/[name].[contenthash:8][ext]',
        },
      },
      {
        test: /\.(woff|woff2|ttf|otf|eot)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]',
        },
      },
      {
        test: /\.(txt|xml)$/i,
        type: 'asset/source',
      },
      {
        test: /cordova\.js$/,
        type: 'asset/resource',
        generator: {
          filename: '[name][ext]',
        },
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
    }),
    ...iconPlugin,
    ...pwaPlugins,
  ],
  optimization: {
    minimizer: isProduction
      ? [
          new TerserPlugin({
            terserOptions: {
              compress: {
                drop_console: true,
                drop_debugger: true,
              },
              format: {
                comments: false,
              },
            },
            extractComments: false,
          }),
          new CssMinimizerPlugin(),
        ]
      : [],
    chunkIds: 'named',
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10,
          minSize: 0,
          maxSize: 100000, // Splits huge libs if necessary
        },

        pages: {
          test: (module) => {
            const id = module.identifier() || '';
            // Match `src/pages/*` but exclude `src/pages/*/lazy/`
            return /[\\/]src[\\/]pages[\\/]/.test(id) && !/[\\/]lazy[\\/]/.test(id);
          },
          chunks: 'all',
          priority: 20,
          minSize: 0,
          name(module) {
            const id = module.identifier() || '';
            const match = id.match(/[\\/]src[\\/]pages[\\/]([^\\/]+)/);
            return match ? `pages-${match[1]}` : 'pages';
          },
          enforce: true,
        },

        lazyPages: {
          test: (module) => {
            const id = module.identifier() || '';
            // Match `src/pages/*/lazy/`
            return /[\\/]src[\\/]pages[\\/][^\\/]+[\\/]lazy[\\/]/.test(id);
          },
          chunks: 'async', // only lazy-loaded modules (optional but safe)
          priority: 30, // higher than pages → takes precedence
          minSize: 0,
          enforce: true,
        },

        components: {
          test: /[\\/]src[\\/]shell[\\/]components[\\/]/,
          chunks: 'all',
          name: 'components',
          priority: 10,
          minSize: 0,
        },

        utils: {
          test: /[\\/]src[\\/]shell[\\/]utils\.ts/,
          chunks: 'all',
          name: 'utils',
          priority: 10,
          minSize: 0,
        },
      },
    },
    runtimeChunk: 'single',
    mergeDuplicateChunks: true,
  },
  devServer: isWebpackServe
    ? {
        hot: true,
        compress: false,
        client: {
          overlay: {
            errors: true,
            warnings: true,
            runtimeErrors: true,
          },
          progress: true,
        },
      }
    : {
        hot: false,
      },
};

module.exports = merge(base, config);
