const path = require('path');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const pkg = require('./package.json');
const isProduction = process.env.NODE_ENV === 'production';
const isWebpackServe = Boolean(process.env.WEBPACK_SERVE || false);
const targetPlatform = process.env.WEBQ_TARGET;
if (!targetPlatform || !['browser', 'cordova', 'electron'].includes(targetPlatform)) {
  throw Error(`Unknown target platform: ${targetPlatform}`);
}

if (targetPlatform === 'electron' && isWebpackServe) {
  throw Error("Can't serve electron target with webpack");
}

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
          // to your hashed files (they're already uniquely versioned)
          // This saves bandwidth and avoids unnecessary re-downloads[reference:0]
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
          logo: 'assets/icon.png',
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

module.exports = {
  context: __dirname,
  target:
    targetPlatform === 'electron' ? 'electron-renderer' : isWebpackServe ? 'web' : 'browserslist',
  mode: isProduction ? 'production' : 'development',
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
        test: /\.js$/, // Target .js files
        exclude: /node_modules/, // CRITICAL: Don't process node_modules (huge performance boost)
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env', // Transpiles ES6+ to ES5
              // '@babel/preset-react', // Uncomment if using React
              // '@babel/preset-typescript', // Uncomment if using TS
            ],
          },
        },
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
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
        ],
      },
      {
        test: /\.scss$/,
        use: [
          isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]', // e.g. fonts/MyFont.woff2
        },
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
  resolve: {
    extensions: ['.ts', '.js', '.jsx', '.css', '.scss'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shell': path.resolve(__dirname, 'src', 'shell'),
    },
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.WEBPACK_SERVE': JSON.stringify(isWebpackServe),
      'process.env.WEBQ_TARGET': JSON.stringify(process.env.WEBQ_TARGET),
      __WEBQ_APP_NAME__: JSON.stringify(pkg.name),
      __WEBQ_APP_TITLE__: JSON.stringify(pkg.displayName),
      __WEBQ_APP_VERSION__: JSON.stringify(pkg.version),
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
    }),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash:8].css',
    }),
    new ForkTsCheckerWebpackPlugin({
      typescript: {
        configFile: path.resolve(__dirname, 'tsconfig.json'),
      },
    }),
    ...iconPlugin,
    ...pwaPlugins,
  ],
  optimization: {
    minimizer: isProduction
      ? [
          new TerserPlugin({
            terserOptions: {
              ecma: 2020,
              compress: {
                drop_console: true,
                drop_debugger: true,
                ecma: 2020, // compress using ES2020 rules
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
  devtool: isProduction ? false : 'inline-source-map',
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
  performance: {
    hints: false,
  },
};
