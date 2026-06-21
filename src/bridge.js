const utils = require('./utils');

document.addEventListener('deviceready', () => {
  // handle back button, if we are in the main page, exit app, otherwise go back
  document.addEventListener('backbutton', () => {
    if (window.location.pathname === '/index.html' && window.location.hash === '#/') {
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
