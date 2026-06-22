import './style.css';

export interface DialogButton {
  text: string;
  onClick?: () => void;
}

export class Dialog {
  autoCloseAfterClickingButton: boolean;
  allowUnexpectedClosing: boolean;
  resolvePromiseOnUnexpectedClose: boolean;
  promise: Promise<void>;
  promiseAccept!: (value: void | PromiseLike<void>) => void;
  promiseReject!: (reason?: string) => void;
  parent: Element;
  container: HTMLDivElement | null;
  dialog: HTMLDivElement;
  overlay: HTMLDivElement;
  body: HTMLDivElement;
  header: HTMLDivElement;
  footer: HTMLDivElement;
  isOpen: boolean;

  constructor(
    containerId: string,
    title: string,
    footerButtons: DialogButton[] = [],
    parent: Element = document.body
  ) {
    this.parent = parent;
    const existingContainer = this.parent.querySelector(`#${containerId}`);
    if (existingContainer) {
      throw Error('Element Already Exists');
    }

    this.autoCloseAfterClickingButton = true;
    this.allowUnexpectedClosing = true;
    this.resolvePromiseOnUnexpectedClose = false;
    this.promise = new Promise((accept, reject) => {
      this.promiseAccept = accept;
      this.promiseReject = reject;
    });

    this.container = document.createElement('div');
    this.container.id = containerId;
    this.container.classList.add('dialog-container');

    let html = '';
    html += '<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">';
    html += '<div class="dialog-header flex-row center">';
    html += `<h2 id="dialogTitle" class="dialog-title">${title}</h2>`;
    html += '</div>';
    html += '<div class="dialog-body"></div>';
    html += '<div class="dialog-footer"></div>';
    html += '</div>';
    html += '<div class="dialog-overlay fade-in" aria-hidden="false"></div>';
    this.container.innerHTML = html;

    const dialog = this.container.querySelector('.dialog');
    if (dialog instanceof HTMLDivElement) {
      this.dialog = dialog;
    } else {
      throw Error("Can't find dialog div");
    }

    const overlay = this.container.querySelector('.dialog-overlay');
    if (overlay instanceof HTMLDivElement) {
      this.overlay = overlay;
    } else {
      throw Error("Can't find dialog overlay div");
    }

    const body = this.dialog.querySelector('.dialog-body');
    if (body instanceof HTMLDivElement) {
      this.body = body;
    } else {
      throw Error("Can't find dialog body div");
    }

    const header = this.dialog.querySelector('.dialog-header');
    if (header instanceof HTMLDivElement) {
      this.header = header;
    } else {
      throw Error("Can't find dialog header div");
    }

    const footer = this.dialog.querySelector('.dialog-footer');
    if (footer instanceof HTMLDivElement) {
      this.footer = footer;
    } else {
      throw Error("Can't find dialog footer div");
    }

    if (Array.isArray(footerButtons)) {
      footerButtons.forEach((button) => {
        this.addButton(button);
      });
    }

    this.isOpen = false;

    this.overlay.addEventListener('click', this.onUnexpectedClose.bind(this));
  }

  addButton(button: DialogButton): void {
    const btn = document.createElement('button');
    btn.classList.add('button', 'flat', 'center');
    btn.textContent = button.text;
    btn.addEventListener('click', () => {
      if (button.onClick) {
        button.onClick();
      }
      if (this.autoCloseAfterClickingButton) {
        this.close();
      }
    });
    this.footer.appendChild(btn);
  }

  open(): Promise<void> {
    if (this.isOpen) {
      return this.promise; // Prevent multiple openings
    }

    if (!this.container) {
      throw Error('Dialog container is null');
    }

    this.parent.appendChild(this.container);
    this.isOpen = true;

    return this.promise;
  }

  close(acceptPromise = true): void {
    if (!this.container) {
      throw Error('Dialog container is null');
    }

    if (!this.isOpen) {
      return;
    }

    if (acceptPromise) {
      this.promiseAccept();
    }

    this.container.classList.add('fade-out');

    setTimeout(() => {
      if (this.container) {
        this.parent.removeChild(this.container);
      }
      this.container = null;
    }, 300);

    this.isOpen = false;
  }

  private onUnexpectedClose(): void {
    if (!this.allowUnexpectedClosing) {
      return;
    }

    if (this.resolvePromiseOnUnexpectedClose) {
      this.close();
      return;
    }

    this.promiseReject('Dialog Closed Unexpectedly');
    this.close(false);
  }
}
