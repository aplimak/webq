export enum StorageCategory {
  remotePortal = 'rp',
  Uno = 'uno',
  configuration = 'config',
}

export function getLocalItem(category: StorageCategory, key: string): string | null {
  return localStorage.getItem(`als_${category}_${key}`);
}

export function setLocalItem(category: StorageCategory, key: string, value: string): void {
  localStorage.setItem(`als_${category}_${key}`, value);
}

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

/**
 * Converts a Unix epoch timestamp to a relative time string.
 *
 * @param {number} timestamp - The Unix epoch timestamp in seconds.
 * @returns {string} A relative time string (e.g., "5m ago", "1h ago", "2d ago", "3w ago").
 * @throws {Error} If the input is not a number or is negative.
 */
export function getRelativeTime(timestamp: number, short = false): string {
  if (typeof timestamp !== 'number') {
    throw new Error('Timestamp must be a number.');
  }

  if (timestamp < 0) {
    throw new Error('Timestamp cannot be negative.');
  }

  let lower = new Date(timestamp * 1000); // Convert seconds to milliseconds
  let upper = new Date();

  const tLower = lower;
  const tUpper = upper;

  let future = false;

  if (lower > upper) {
    lower = tUpper;
    upper = tLower;
    future = true;
  }

  const duration = {
    years: Math.floor((upper.getTime() - lower.getTime()) / (365.25 * 24 * 60 * 60 * 1000)),
    months: Math.floor((upper.getTime() - lower.getTime()) / (30.44 * 24 * 60 * 60 * 1000)),
    days: Math.floor((upper.getTime() - lower.getTime()) / (24 * 60 * 60 * 1000)),
    hours: Math.floor((upper.getTime() - lower.getTime()) / (60 * 60 * 1000)),
    minutes: Math.floor((upper.getTime() - lower.getTime()) / (60 * 1000)),
    seconds: Math.floor((upper.getTime() - lower.getTime()) / 1000),
  };

  function fixTime(time: string): string {
    if (short) {
      return time;
    }
    if (future) {
      return `in ${time}`;
    } else {
      return `${time} ago`;
    }
  }

  const mappings: { [key: string]: (value: number) => string } = {
    years: (value: number) => fixTime(`${value}y`),
    months: (value: number) => fixTime(`${value}mo`),
    days: (value: number) => fixTime(`${value}d`),
    hours: (value: number) => fixTime(`${value}h`),
    minutes: (value: number) => fixTime(`${value}m`),
    seconds: (value: number) => fixTime(`${value}s`),
  };

  let relativeTime;

  if (duration.years > 0) {
    relativeTime = mappings.years(duration.years);
    return relativeTime;
  }
  if (duration.months > 0) {
    relativeTime = mappings.months(duration.months);
    return relativeTime;
  }
  if (duration.days > 0) {
    relativeTime = mappings.days(duration.days);
    return relativeTime;
  }
  if (duration.hours > 0) {
    relativeTime = mappings.hours(duration.hours);
    return relativeTime;
  }
  if (duration.minutes > 0) {
    relativeTime = mappings.minutes(duration.minutes);
    return relativeTime;
  }

  return mappings.seconds(duration.seconds);
}

export function isElementHidden(element: HTMLElement): boolean {
  // Check if offsetWidth and offsetHeight are 0
  if (element.offsetWidth === 0 && element.offsetHeight === 0) {
    return true;
  }

  // Get the computed style of the element
  const computedStyle = window.getComputedStyle(element);

  // Check for common CSS properties that cause visibility issues
  // A more comprehensive list could be added if needed.
  const visibility = computedStyle.visibility;
  const display = computedStyle.display;
  const opacity = computedStyle.opacity;

  //Consider elements with zero-height/width and hidden due to media query
  if (display === 'none') {
    return true; //Explicitly hidden
  }
  if (visibility === 'hidden') {
    return true; //Explicitly hidden
  }
  if (opacity === '0' || opacity === '0.0' || opacity === '0.00') {
    //Accounts for float representation.
    return true; // Transparent (effectively hidden)
  }

  return false; // Not hidden (based on these checks)
}

export function scrollToBottom(element: Element): void {
  element.scrollTo({
    behavior: 'smooth',
    top: element.scrollHeight,
  });
}
