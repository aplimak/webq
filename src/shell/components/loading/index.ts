import './style.css';

const loadingContainer = document.getElementById('loading-container');

export function show(useOverlay = true): void {
  if (!loadingContainer) {
    throw Error('loading-container div is not exists');
  }

  if (useOverlay) {
    loadingContainer.style.display = 'flex';
  } else {
    loadingContainer.style.display = 'block';
  }
}

export function hide(): void {
  if (!loadingContainer) {
    throw Error('loading-container div is not exists');
  }

  loadingContainer.style.display = 'none';
}
