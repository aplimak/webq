import type { NativeBridgeBase } from '../base';
import { SplashScreen } from '@capacitor/splash-screen';
import { Toast } from '@capacitor/toast';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { PluginListenerHandle, SystemBars, SystemBarsStyle, registerPlugin } from '@capacitor/core';
import { SafeArea } from 'capacitor-plugin-safe-area';
import { shellEvents } from '@/shell/event';
import { isProduction } from '@/shell/env';
import { navigateTo } from '@/shell/router';

export interface WebQPlugin {
  addListener(eventName: 'uiReady', listenerFunc: () => void): Promise<PluginListenerHandle>;
  removeAllListeners(): Promise<void>;
  echo(options: { value: string }): Promise<{ value: string }>;
  canGoBack(): Promise<{ canGoBack: boolean }>;
}

export interface CapacitorBridge extends NativeBridgeBase {
  readonly platform: 'cap';
  shouldNavigate(): Promise<boolean>;
  quit(): Promise<void>;
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

  const { statusBarHeight } = await SafeArea.getStatusBarHeight();
  document.documentElement.style.setProperty(`--status-bar-height`, `${statusBarHeight}px`);

  SplashScreen.hide();
}

async function shouldNavigate(): Promise<boolean> {
  const info = await App.getLaunchUrl();
  if (info === undefined || info.url === '') {
    return true;
  }

  return false;
}

async function quit(): Promise<void> {
  await App.exitApp();
}

App.addListener('backButton', async () => {
  const { canGoBack } = await WebQ.canGoBack();
  shellEvents.emit('bridge:back-pressed', {
    canGoBack,
  });
});

App.addListener('appUrlOpen', (data: URLOpenListenerEvent) => {
  console.log('App opened with URL:', data.url);
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
  shouldNavigate,
  quit,
  async toast(message: string, duration: number = 3000): Promise<void> {
    await Toast.show({ text: message, duration: duration < 1000 ? 'short' : 'long' });
  },
};
