import { stack } from './stack';
import './style.css';

export interface DialogButton {
  text: string;
  onClick?: () => void;
}

export class Dialog {
  readonly id: string;
  autoCloseAfterClickingButton: boolean;
  allowUnexpectedClosing: boolean;
  resolvePromiseOnUnexpectedClose: boolean;
  readonly promise: Promise<void>;
  promiseAccept!: (value: void | PromiseLike<void>) => void;
  promiseReject!: (reason?: string) => void;
  readonly parent: Element;
  readonly container: HTMLDivElement | null;
  readonly dialog: HTMLDivElement;
  readonly overlay: HTMLDivElement;
  readonly body: HTMLDivElement;
  readonly header: HTMLDivElement;
  readonly footer: HTMLDivElement;
  isOpen: boolean;

  constructor(
    containerId: string,
    title: string,
    footerButtons: DialogButton[] = [],
    parent: Element = document.body
  ) {
    this.id = stack.generateId();
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

    this.dialog = this.container.querySelector<HTMLDivElement>('.dialog')!;
    this.overlay = this.container.querySelector<HTMLDivElement>('.dialog-overlay')!;
    this.body = this.dialog.querySelector<HTMLDivElement>('.dialog-body')!;
    this.header = this.dialog.querySelector<HTMLDivElement>('.dialog-header')!;
    this.footer = this.dialog.querySelector<HTMLDivElement>('.dialog-footer')!;

    if (Array.isArray(footerButtons)) {
      footerButtons.forEach((button) => {
        this.addButton(button);
      });
    }

    this.isOpen = false;
    stack.push(this);

    this.overlay.addEventListener('click', this.handleUnexpectedClose.bind(this, false));
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

  close(acceptPromise = true, fromStack = false): void {
    if (!this.isOpen) {
      return;
    }

    if (!this.container) {
      throw Error('Dialog container is null');
    }

    this.isOpen = false;

    if (acceptPromise) {
      this.promiseAccept();
    }

    this.container.classList.add('fade-out');

    setTimeout(() => {
      if (this.container) {
        this.parent.removeChild(this.container);
      }
    }, 300);

    if (!fromStack) {
      stack.close(this.id);
    }
  }

  handleUnexpectedClose(fromStack = false): void {
    if (!this.isOpen) {
      return;
    }

    if (!fromStack && !this.allowUnexpectedClosing) {
      return;
    }

    if (this.resolvePromiseOnUnexpectedClose) {
      this.close(true, fromStack);
      return;
    }

    this.promiseReject('Dialog Closed Unexpectedly');
    this.close(false, fromStack);
  }
}
