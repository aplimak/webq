const { platform } = require('./env');

window.nativeBridge = {};

if (platform.cordova) {
  window.nativeBridge = require('./cordova');
} else if (platform.electron) {
  window.nativeBridge = require('./electron');
}
