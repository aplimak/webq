import type { NativeBridgeBase } from '../base';
import { SplashScreen } from '@capacitor/splash-screen';
import { Toast } from '@capacitor/toast';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { shellEvents } from '@/shell/event';

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
  const { getHeaderColor } = await import('@/shell/header');
  await StatusBar.setStyle({ style: data.useDarkTheme ? Style.Light : Style.Dark });
  await StatusBar.setBackgroundColor({ color: getHeaderColor() });
});

SplashScreen.hide();

export const _bridge: CapacitorBridge = {
  platform: 'cap',
  quit,
  async toast(message: string, duration: number = 3000): Promise<void> {
    await Toast.show({ text: message, duration: duration < 1000 ? 'short' : 'long' });
  },
};
