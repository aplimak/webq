export async function route(content: Element): Promise<void> {
  const main = await import('./main.html');
  content.innerHTML = main.default;

  const cardContainer = content.querySelector('.card-container');
  if (!cardContainer) {
    console.error('card-container not found');
    return;
  }

  // Uno app
  const unoCard = cardContainer.querySelector('#uno-card');
  if (unoCard) {
    const uno = await import('./apps/uno');
    uno.default(unoCard);
  }
}
