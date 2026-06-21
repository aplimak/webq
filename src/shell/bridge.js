const utils = require('./utils');
const themeMgr = require('./themeManager');

document.addEventListener('deviceready', () => {
  themeMgr.applyTheme();

  // handle back button, if we are in the main page, exit app, otherwise go back
  document.addEventListener('backbutton', () => {
    if (window.location.pathname === '/index.html' && window.location.hash.slice(1) === 'home') {
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
};
