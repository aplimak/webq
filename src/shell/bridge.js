const utils = require('./utils');
const themeMgr = require('./themeManager');
const router = require('./router');

document.addEventListener('deviceready', () => {
  themeMgr.applyTheme();

  // handle back button, if we are in the main page, exit app, otherwise go back
  document.addEventListener('backbutton', () => {
    if (router.inMainPage()) {
      navigator.app.exitApp();
    } else {
      window.history.back();
    }
  });

  // show toast when error happens
  window.addEventListener('cordovacallbackerror', (event) => {
    utils.showToast(`Error: ${event.message}`);
  });
});

function updateStatusBarColor(color, isDark) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  metaThemeColor.content = color;

  if (window.StatusBar) {
    window.StatusBar.backgroundColorByHexString(color);
    if (isDark) {
      window.StatusBar.styleLightContent();
    } else {
      window.StatusBar.styleDefault();
    }
  }
}

module.exports = {
  updateStatusBarColor,
  isProduction: process.env.NODE_ENV === 'production',
  isPWA:
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
};
