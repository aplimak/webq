import './shell/bridge';
import './shell/pwa';
import './shell/router';
import './shell/themeManager';
import './shell/header';
import { shellEvents } from './shell/event';
import { app } from './shell/env';

import './style.css';

shellEvents.on('router:page-change', (_) => {
  document.title = app.title;
});
