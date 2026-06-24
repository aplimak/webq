import { Dialog } from '.';

interface DialogStackEntry {
  id: string;
  dialog: WeakRef<Dialog>;
}

class DialogStack {
  private readonly stack: DialogStackEntry[] = [];
  private isSyncing = false;

  generateId(): string {
    if (crypto && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    // Fallback for older browsers / insecure contexts
    return Date.now() + '-' + Math.random().toString(36).substring(2, 9) + '-' + performance.now();
  }

  push(dialog: Dialog): void {
    this.stack.push({
      id: dialog.id,
      dialog: new WeakRef(dialog),
    });

    // Push a unique history state
    history.pushState({ dialogId: dialog.id }, '');
  }

  private doClose(entry: DialogStackEntry): void {
    entry.dialog.deref()?.handleUnexpectedClose(true);
  }

  close(id: string): void {
    const index = this.stack.findIndex((entry) => entry.id === id);
    if (index === -1) return;

    const count = this.stack.length - index; // dialogs to close

    // Close UI from top down to the target
    for (let i = this.stack.length - 1; i >= index; i--) {
      const entry = this.stack[i];
      this.doClose(entry);
    }

    // Remove them from the stack
    this.stack.splice(index, count);

    // Remove the corresponding history entries by going back 'count' steps.
    // This will trigger a popstate event that lands on the state before the closed dialogs.
    if (count > 0) {
      history.go(-count);
    }
  }

  closeTop(): void {
    if (this.stack.length === 0) return;
    const top = this.stack[this.stack.length - 1];
    this.close(top.id);
  }

  sync(state: PopStateEvent): void {
    if (this.isSyncing) return; // prevent loops when history.go() fires popstate
    this.isSyncing = true;

    const targetId = state?.state?.dialogId || null;

    // Close all dialogs from the top until the top matches the target ID
    while (this.stack.length > 0) {
      const top = this.stack[this.stack.length - 1];
      // If the top dialog matches the state we landed on, stop closing.
      if (top.id === targetId) {
        break;
      }
      // Otherwise, close the top one
      const closed = this.stack.pop();
      this.doClose(closed!);
    }

    // If targetId is null, we close everything (landed on the base page).
    // If targetId isn't found in the stack, we close everything (edge case).

    this.isSyncing = false;
  }
}

export const stack = new DialogStack();

window.addEventListener('popstate', stack.sync.bind(stack));
