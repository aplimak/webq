const info = {
  isProduction: process.env.NODE_ENV === 'production',
  isWebpackServe: process.env.WEBPACK_SERVE,
  targetPlatform: process.env.WEBQ_TARGET,
  isPWA:
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true,
};

if (info.targetPlatform === 'electron') {
  require('./electron');
}

document.addEventListener('deviceready', async () => {
  const themeMgr = await import('./themeManager');
  themeMgr.applyTheme();

  const router = await import('./router');
  // handle back button, if we are in the main page, exit app, otherwise go back
  document.addEventListener('backbutton', () => {
    if (router.inMainPage()) {
      navigator.app.exitApp();
    } else {
      window.history.back();
    }
  });

  // show toast when error happens
  window.addEventListener('cordovacallbackerror', async (event) => {
    const { toast } = await import('./components');
    toast.error(`Error: ${event.message}`);
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
  ...info,
};
