const info = {
  isProduction: process.env.NODE_ENV === 'production',
  isWebpackServe: process.env.WEBPACK_SERVE,
  targetPlatform: process.env.WEBQ_TARGET,
  isPWA:
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
};

const app = {
  name: __WEBQ_APP_NAME__,
  title: __WEBQ_APP_TITLE__,
  version: __WEBQ_APP_VERSION__,
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
  app,
};
