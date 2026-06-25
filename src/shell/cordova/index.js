function updateStatusBarColor(color, isDark) {
  window.StatusBar.backgroundColorByHexString(color);
  if (isDark) {
    window.StatusBar.styleLightContent();
  } else {
    window.StatusBar.styleDefault();
  }
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

module.exports = {
  updateStatusBarColor,
};
