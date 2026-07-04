if (!process.env.BROWSERSLIST_ENV) {
  throw Error('BROWSERSLIST_ENV environment variable is not set');
}
const target = process.env.BROWSERSLIST_ENV;

module.exports = {
  presets: [['@babel/preset-env', {}]],
  plugins: [
    [
      'polyfill-corejs3',
      {
        method: 'usage-global',
        version: require('core-js/package.json').version,
      },
    ],
  ],
};
