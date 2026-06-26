import { isProduction, app } from './shell/bridge';
import './shell/router';
import './shell/themeManager';
import './shell/pwa';

import './shell/style.css';
import { shellEvents } from './shell/event';

function setTitle(): void {
  document.title = app.title;

  const headerTitle = document.querySelector('header .header-title');
  if (headerTitle) {
    let title = app.title;
    if (!isProduction) {
      title += ' (dev)';
    }
    headerTitle.innerHTML = title;
  }
}

shellEvents.on('router:page-change', (_) => {
  setTitle();
});
