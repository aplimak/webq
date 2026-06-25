const info = {
  isProduction: process.env.NODE_ENV === 'production',
  isWebpackServe: process.env.WEBPACK_SERVE,
  targetPlatform: process.env.WEBQ_TARGET,
  isPWA:
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
};

const platform = {
  browser: info.targetPlatform === 'browser',
  cordova: info.targetPlatform === 'cordova',
  electron: info.targetPlatform === 'electron',
};

if (platform.cordova) {
  require('./cordova');
} else if (platform.electron) {
  require('./electron');
}

function updateStatusBarColor(color, isDark) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  metaThemeColor.content = color;

  if (platform.cordova) {
    const cordova = require('./cordova');
    cordova.updateStatusBarColor(color, isDark);
  }
}

module.exports = {
  updateStatusBarColor,
  ...info,
  platform,
};
