const pkg = require('./package.json');

module.exports = {
  appId: pkg.name,
  artifactName: '${os}.${ext}',
  asar: true,
  detectUpdateChannel: false,
  electronLanguages: 'en',
  productName: pkg.displayName,
  directories: {
    buildResources: 'assets',
    output: 'dist',
  },
  files: ['bundle/electron/**/*', '!node_modules/**/*'],
  appImage: {
    compression: 'zstd',
  },
  linux: {
    icon: 'assets/icon.png',
    target: ['AppImage'],
    category: 'Utility',
    syncDesktopName: true,
  },
  win: {
    target: ['portable'],
  },
};
