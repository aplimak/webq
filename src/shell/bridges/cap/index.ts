import type { NativeBridgeBase } from '../base';
import { SplashScreen } from '@capacitor/splash-screen';
import { Toast } from '@capacitor/toast';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { SystemBars, SystemBarsStyle, registerPlugin } from '@capacitor/core';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { Device } from '@capacitor/device';
import { shellEvents } from '@/shell/event';
import { isProduction } from '@/shell/env';
import { navigateTo } from '@/shell/router';

export interface WebQPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}

const WebQ = registerPlugin<WebQPlugin>('WebQ');

async function init(): Promise<void> {
  if (!isProduction) {
    // ensure our plugin works properly in dev mode
    const { value } = await WebQ.echo({ value: 'Hello World!' });
    if (value !== 'Hello World!') {
      console.error('WebQ plugin is not working properly');
    } else {
      console.log('WebQ plugin is working properly');
    }
  }

  const devInfo = await Device.getInfo();
  if (devInfo.androidSDKVersion && devInfo.androidSDKVersion <= 34) {
    const { insets } = await SafeArea.getSafeAreaInsets();
    for (const [key, value] of Object.entries(insets)) {
      document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`);
    }

    const { statusBarHeight } = await SafeArea.getStatusBarHeight();
    document.documentElement.style.setProperty(`--status-bar-height`, `${statusBarHeight}px`);

    await SafeArea.removeAllListeners();
    // when safe-area changed
    await SafeArea.addListener('safeAreaChanged', (data) => {
      const { insets } = data;
      for (const [key, value] of Object.entries(insets)) {
        document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`);
      }
    });
  }

  SplashScreen.hide();
}

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

App.addListener('appUrlOpen', (data: URLOpenListenerEvent) => {
  const url = new URL(data.url);
  if (url.pathname === '/navigate') {
    const target = url.searchParams.get('target');
    if (target) {
      navigateTo(target);
    }
  }
});

shellEvents.on('ui:theme-change', async (data) => {
  await SystemBars.setStyle({
    style: data.useDarkTheme ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
  });
  // await StatusBar.setBackgroundColor({ color: getHeaderColor() });
});

init();

export const _bridge: CapacitorBridge = {
  platform: 'cap',
  quit,
  async toast(message: string, duration: number = 3000): Promise<void> {
    await Toast.show({ text: message, duration: duration < 1000 ? 'short' : 'long' });
  },
};
