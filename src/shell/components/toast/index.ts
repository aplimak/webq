import './style.css';

export type ToastType = 'info' | 'success' | 'error';

class ToastService {
  container: Element;
  observer: MutationObserver;

  constructor() {
    const container = document.getElementById('toast-container');
    if (!container) {
      throw Error('Toast container not found!');
    }
    this.container = container;

    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0 && this.container.children.length > 7) {
          let targetChild = null;
          const childs = this.container.children;

          for (let i = 0; i < childs.length; i++) {
            const child = childs[i];
            if (child && !child.classList.contains('fade-out')) {
              targetChild = child;
              break;
            }
          }

          if (targetChild) {
            this.removeToast(targetChild);
          }
        }
      });
    });

    const config = {
      childList: true,
      subtree: false, // Only watch direct children, not descendants. More efficient.
      attributes: false,
      characterData: false,
    };

    this.observer.observe(this.container, config);
  }

  show(message: string, type: ToastType = 'info', duration = 8000): void {
    const toast = this.createToast(message, type);
    this.container.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(toast);
      }, duration);
    }
  }

  private createToast(message: string, type: ToastType): HTMLDivElement {
    const toast = document.createElement('div');
    toast.classList.add('toast', 'flex-row', 'center');
    toast.classList.add(type);

    toast.addEventListener('click', () => {
      this.removeToast(toast);
    });

    const icon = document.createElement('span');
    icon.classList.add('material-icons');
    icon.textContent = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
    toast.appendChild(icon);

    const text = document.createElement('span');
    text.textContent = message;
    toast.appendChild(text);

    // const closeButton = document.createElement("button");
    // closeButton.classList.add("close-button");
    // closeButton.innerHTML = "&times;";
    // closeButton.addEventListener("click", () => {
    //     this.removeToast(toast);
    // });
    // toast.appendChild(closeButton);

    toast.classList.add('show', 'animate-in');
    setTimeout(() => {
      toast.classList.remove('animate-in');
    }, 350);

    return toast;
  }

  private removeToast(toast: Element): void {
    if (toast.classList.contains('fade-out')) {
      // Already fading out
      return;
    }

    toast.classList.remove('animate-in');
    toast.classList.add('fade-out');

    setTimeout(() => {
      this.container.removeChild(toast);
    }, 300);
  }
}

export const service = new ToastService();
