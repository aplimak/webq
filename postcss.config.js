module.exports = {
  plugins: [
    require('postcss-import')({
      filter(path) {
        return !/^@node_modules\//.test(path);
      },
    }),
    'postcss-preset-env',
  ],
};
