import { Page } from '@/shell/page';
import { navigateTo } from '@/shell/router';

import main from './main.html';

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
    const unoCard = cardContainer.querySelector('#uno-card');
    if (unoCard) {
      const enterBtn = unoCard.querySelector('#uno-button');
      if (enterBtn) {
        enterBtn.addEventListener('click', async () => {
          navigateTo('uno');
        });
      }
    }
  },
};

export default page;
