import { TargetPlatform } from './env';
import { BrowserBridge } from './browser';
import { CordovaBridge } from './cordova';
import { ElectronBridge } from './electron';

export type NativeBridgeAPI = CordovaBridge | ElectronBridge | BrowserBridge;

export declare global {
  interface Window {
    nativeBridge: NativeBridgeAPI;
  }

  const __WEBQ_NODE_ENV__: string;
  const __WEBQ_WEBPACK_SERVE__: boolean;
  const __WEBQ_TARGET__: TargetPlatform;
}
