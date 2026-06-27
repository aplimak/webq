import { app } from './shell/bridge';
import './shell/pwa';
import './shell/router';
import './shell/themeManager';
import './shell/header';
import { shellEvents } from './shell/event';

import './shell/style.css';

shellEvents.on('router:page-change', (_) => {
  document.title = app.title;
});
