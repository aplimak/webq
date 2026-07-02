const { shellEvents } = require('../event');

let ready = false;

function isReady() {
  return ready;
}

async function whenReady() {
  if (isReady()) {
    return;
  }
  await shellEvents.waitFor('bridge:cordova-ready');
}

async function quit() {
  await whenReady();
  navigator.app.exitApp();
}

function toast(message, isLong = false) {
  window.webq.toast(
    message,
    isLong,
    () => {},
    async (error) => {
      const { toast } = await import('@/shell/components');
      toast.error('Toast error:', error);
    }
  );
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
  await whenReady();

  const { getHeaderColor } = require('../header');
  updateStatusBarColor(getHeaderColor(), data.useDarkTheme);
});

module.exports = {
  _bridge: {
    platform: 'cordova',
    isReady,
    whenReady,
    quit,
    toast: async (message, duration = 3000) => {
      await whenReady();
      toast(message, duration > 1000);
    },
  },
};
