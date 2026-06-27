const { shellEvents } = require('../event');

let ready = false;

function updateStatusBarColor(color, useDarkTheme) {
  window.StatusBar.backgroundColorByHexString(color);
  if (useDarkTheme) {
    window.StatusBar.styleLightContent();
  } else {
    window.StatusBar.styleDefault();
  }
}

document.addEventListener('deviceready', async () => {
  ready = true;
  shellEvents.emit('bridge:cordova-ready');

  const router = await import('@shell/router');
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
    const { toast } = await import('@shell/components');
    toast.error(`Error: ${event.message}`);
  });
});

shellEvents.on('ui:theme-change', async (data) => {
  if (!ready) {
    await shellEvents.waitFor('bridge:cordova-ready');
  }

  const { getHeaderColor } = require('../header');
  updateStatusBarColor(getHeaderColor(), data.useDarkTheme);
});
