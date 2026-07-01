const { platform } = require('./env');

window.nativeBridge = {};

if (platform.cordova) {
  window.nativeBridge = require('./cordova')._bridge;
} else if (platform.electron) {
  window.nativeBridge = require('./electron')._bridge;
} else {
  window.nativeBridge = require('./browser')._bridge;
}
