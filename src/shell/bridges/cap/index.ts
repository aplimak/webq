import type { NativeBridgeBase } from '../base';
import { SplashScreen } from '@capacitor/splash-screen';
import { Toast } from '@capacitor/toast';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { shellEvents } from '@/shell/event';
import { getHeaderColor } from '@/shell/header';

SafeArea.getSafeAreaInsets().then(({ insets }) => {
  for (const [key, value] of Object.entries(insets)) {
    document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`);
  }
});

SafeArea.getStatusBarHeight().then(({ statusBarHeight }) => {
  document.documentElement.style.setProperty(`--status-bar-height`, `${statusBarHeight}px`);
});

SafeArea.removeAllListeners().then(() => {
  // when safe-area changed
  SafeArea.addListener('safeAreaChanged', (data) => {
    const { insets } = data;
    for (const [key, value] of Object.entries(insets)) {
      document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`);
    }
  });
});

export interface CapacitorBridge extends NativeBridgeBase {
  readonly platform: 'cap';
  quit(): Promise<void>;
}

async function quit(): Promise<void> {
  await App.exitApp();
}

App.addListener('backButton', () => {
  shellEvents.emit('bridge:back-pressed');
});

shellEvents.on('ui:theme-change', async (data) => {
  await StatusBar.setStyle({ style: !data.useDarkTheme ? Style.Light : Style.Dark });
  // await StatusBar.setBackgroundColor({ color: getHeaderColor() });
});

SplashScreen.hide();

export const _bridge: CapacitorBridge = {
  platform: 'cap',
  quit,
  async toast(message: string, duration: number = 3000): Promise<void> {
    await Toast.show({ text: message, duration: duration < 1000 ? 'short' : 'long' });
  },
};
