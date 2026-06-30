const { shellEvents } = require('../event');

let ready = false;

function quit() {
  navigator.app.exitApp();
}

function updateStatusBarColor(color, useDarkTheme) {
  window.StatusBar.backgroundColorByHexString(color);
  if (useDarkTheme) {
    window.StatusBar.styleLightContent();
  } else {
    window.StatusBar.styleDefault();
  }
}

document.addEventListener('deviceready', () => {
  ready = true;
  shellEvents.emit('bridge:cordova-ready');

  document.addEventListener('backbutton', () => {
    shellEvents.emit('bridge:back-pressed');
  });

  // show toast when error happens
  window.addEventListener('cordovacallbackerror', async (event) => {
    const { toast } = await import('@/shell/components');
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

module.exports = {
  quit,
};
