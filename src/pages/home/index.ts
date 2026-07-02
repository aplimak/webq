import { Page } from '@/shell/page';
import { navigateTo } from '@/shell/router';

import main from './main.html';
import './style.scss';

const page: Page = {
  id: 'home',
  route: async (context) => {
    context.content.innerHTML = main;

    const cardContainer = context.content.querySelector('.card-container');
    if (!cardContainer) {
      console.error('card-container not found');
      return;
    }

    // Uno app
    cardContainer.querySelector('#uno-card #uno-button')?.addEventListener('click', async () => {
      navigateTo('uno');
    });

    cardContainer.querySelector('#test-card #toast-button')?.addEventListener('click', () => {
      window.nativeBridge.toast('A Test message');
    });
  },
};

export default page;
