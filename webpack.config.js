const path = require('path');
const { DefinePlugin } = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';
const isWebpackServe = Boolean(process.env.WEBPACK_SERVE || false);

const pwaPlugins = !isWebpackServe
  ? [
      new WebpackPwaManifest({
        name: 'WebQ',
        short_name: 'WebQ',
        description: 'A suite of simple web apps.',
        display: 'standalone',
        start_url: '/',
        // This injects the manifest link into your HTML automatically
        inject: true,
        // Fingerprint the manifest file itself
        fingerprint: true,
        icons: [
          {
            src: path.resolve('assets/icon.png'),
            sizes: [192, 512],
            destination: path.join('icons'),
          },
        ],
      }),
      new GenerateSW({
        swDest: 'service-worker.js',
        clientsClaim: true, // Take control of pages immediately
        skipWaiting: true, // Force update on new version

        // Exclude source maps and the manifest from precaching
        exclude: [/\.map$/, /manifest.*\.json$/],

        // IMPORTANT: Tell Workbox not to add cache-busting query params
        // to your hashed files (they're already uniquely versioned)
        // This saves bandwidth and avoids unnecessary re-downloads[reference:0]
        dontCacheBustURLsMatching: /\.[0-9a-f]{8}\./,

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

module.exports = {
  context: __dirname,
  target: isWebpackServe ? 'web' : 'browserslist',
  mode: isProduction ? 'production' : 'development',
  entry: {
    shell: './src/index.ts',
  },
  output: {
    path: path.resolve(__dirname, 'www'),
    filename: '[name].[contenthash:8].js',
    chunkFilename: '[name].[contenthash:8].chunk.js',
    publicPath: '',
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
      '@shell': path.resolve(__dirname, 'src', 'shell'),
    },
  },
  plugins: [
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      'process.env.WEBPACK_SERVE': JSON.stringify(isWebpackServe),
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
    new FaviconsWebpackPlugin('assets/icon.png'),
    ...pwaPlugins,
  ],
  optimization: {
    minimizer: isProduction
      ? [
          `...`,
          new TerserPlugin({
            terserOptions: {
              ecma: 2020, // output ES2020 syntax
              output: {
                ecma: 2020, // ensure output uses ES2020
              },
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
  cache: false,
};
