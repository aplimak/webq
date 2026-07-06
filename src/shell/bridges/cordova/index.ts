import { shellEvents } from '@/shell/event';
import type { NativeBridgeBase } from '../base';

export interface CordovaBridge extends NativeBridgeBase {
  readonly platform: 'cordova';
  isReady(): boolean;
  whenReady(): Promise<void>;
  quit(): Promise<void>;
}

let ready = false;

function isReady(): boolean {
  return ready;
}

async function whenReady(): Promise<void> {
  if (isReady()) {
    return;
  }
  await shellEvents.waitFor('bridge:cordova-ready');
}

async function quit(): Promise<void> {
  await whenReady();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (navigator as any).app.exitApp();
}

function toast(message: string, isLong = false): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).webq.toast(
    message,
    isLong,
    () => {},
    async (error: Error) => {
      const { toast } = await import('@/shell/components');
      toast.error(`Toast error: ${error}`);
    }
  );
}

function updateStatusBarColor(color: string, useDarkTheme: boolean): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).StatusBar.backgroundColorByHexString(color);
  if (useDarkTheme) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).StatusBar.styleLightContent();
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).StatusBar.styleDefault();
  }
}

document.addEventListener('deviceready', () => {
  ready = true;
  shellEvents.emit('bridge:cordova-ready');

  document.addEventListener('backbutton', () => {
    shellEvents.emit('bridge:back-pressed');
  });

  // show toast when error happens
  window.addEventListener('cordovacallbackerror', async (event) => {
    const { toast } = await import('@/shell/components');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toast.error(`Error: ${(event as any).message}`);
  });
});

shellEvents.on('ui:theme-change', async (data) => {
  await whenReady();

  const { getHeaderColor } = await import('@/shell/header');
  updateStatusBarColor(getHeaderColor(), data.useDarkTheme);
});

export const _bridge: CordovaBridge = {
  platform: 'cordova',
  isReady,
  whenReady,
  quit,
  toast: async (message: string, duration = 3000): Promise<void> => {
    await whenReady();
    toast(message, duration > 1000);
  },
};
