import './style.css';
import { _bridge } from 'webq.target.js';
window.nativeBridge = _bridge;

import './shell/pwa';
import './shell/router';
import './shell/themeManager';
import './shell/header';
import { shellEvents } from './shell/event';
import { app } from './shell/env';

shellEvents.on('router:page-change', (_) => {
  document.title = app.title;
});
