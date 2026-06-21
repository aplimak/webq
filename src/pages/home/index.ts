import main from './main.html';

export default async function route(content: Element): Promise<void> {
  content.innerHTML = main;

  const cardContainer = content.querySelector('.card-container');
  if (!cardContainer) {
    console.error('card-container not found');
    return;
  }

  // Uno app
  const unoCard = cardContainer.querySelector('#uno-card');
  if (unoCard) {
    const uno = await import('../uno');
    uno.initCard(unoCard);
  }
}
