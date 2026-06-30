const { platform } = require('./env');

if (platform.cordova) {
  require('./cordova');
} else if (platform.electron) {
  require('./electron');
}
