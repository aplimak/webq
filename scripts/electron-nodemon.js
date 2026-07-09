var nodemon = require('nodemon');
const path = require('path');

const electronMain = 'bundle/electron/main';

nodemon({
  exec: process.argv[2],
  watch: [electronMain],
});

let restarting = false;

nodemon.on('start', () => {
  restarting = false;
  console.log('Electron Started');
});

nodemon.on('restart', (files) => {
  console.log('Updates detected for following files:');
  files.forEach((file) => {
    console.log(path.relative(file, electronMain));
  });
  restarting = true;
});

nodemon.on('exit', (e) => {
  if (restarting) return;
  console.log('Electron explicitly closed with code', e || 0);
  process.exit(e);
});
