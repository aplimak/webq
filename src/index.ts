import './style.css';
import { _bridge } from 'webq/target';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
if ((module as any).hot) {
  // Accept all updates from this entry point.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (module as any).hot.accept();
}
