import _ from 'lodash';

export function setupInputNavigation(
  container: HTMLElement,
  onLastElement: (elem: HTMLInputElement) => void
) {
  function handleContainerKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter') {
      return;
    }

    const focusedInput = event.target;
    if (!(focusedInput instanceof HTMLInputElement)) {
      return;
    }
    const inputs: HTMLInputElement[] = [];
    container.querySelectorAll('input:not(.hide)').forEach((item) => {
      if (item instanceof HTMLInputElement) {
        inputs.push(item);
      }
    });
    const currentIndex = inputs.indexOf(focusedInput);
    if (currentIndex !== -1) {
      const nextIndex = currentIndex + 1;
      if (nextIndex >= inputs.length) {
        onLastElement(focusedInput);
        return;
      }
      inputs[nextIndex]?.focus();
    }
  }

  container.addEventListener('keydown', handleContainerKeydown);

  // Return a cleanup function (important if you replace the container)
  return function cleanup(): void {
    container.removeEventListener('keydown', handleContainerKeydown);
  };
}

export function scrollToBottom(element: Element): void {
  element.scrollTo({
    behavior: 'smooth',
    top: element.scrollHeight,
  });
}

export function toNumber(text?: string | null): number {
  return text ? _.toNumber(text) : NaN;
}
