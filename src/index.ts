import { isProduction } from './shell/bridge';
import './shell/router';
import './shell/themeManager';
import './shell/pwa';

import './shell/style.css';

document.addEventListener('DOMContentLoaded', () => {
  const headerTitle = document.querySelector('header .header-title');
  if (headerTitle && !isProduction) {
    headerTitle.innerHTML += ' (dev)';
  }
});
