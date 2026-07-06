import { TargetPlatform } from '@/shell/env';
import { BrowserBridge } from './browser';
import { CordovaBridge } from './cordova';
import { ElectronBridge } from './electron';

type NativeBridge = CordovaBridge | ElectronBridge | BrowserBridge;

export declare global {
  interface Window {
    nativeBridge: NativeBridge;
  }

  const __WEBQ_NODE_ENV__: string;
  const __WEBQ_WEBPACK_SERVE__: boolean;
  const __WEBQ_TARGET__: TargetPlatform;
}

export const _bridge: NativeBridge;
