var exec = require('cordova/exec');

var WebQPlugin = {
  echo: function (message, success, error) {
    exec(success, error, 'webq', 'echo', [message]);
  },
  openSettings: function (success, error) {
    exec(success, error, 'webq', 'openSettings', []);
  },
  toast: function (message, isLong, success, error) {
    exec(success, error, 'webq', 'showToast', [message, isLong || false]);
  },
};

module.exports = WebQPlugin;
