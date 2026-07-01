import { TargetPlatform } from './env';
import { BrowserBridge } from './browser';
import { CordovaBridge } from './cordova';
import { ElectronBridge } from './electron';

type NativeBridgeFor<T extends TargetPlatform> = T extends 'browser'
  ? BrowserBridge
  : T extends 'cordova'
    ? CordovaBridge
    : ElectronBridge;

export declare global {
  interface Window {
    nativeBridge: NativeBridgeFor<TargetPlatform>;
  }

  const __WEBQ_NODE_ENV__: string;
  const __WEBQ_WEBPACK_SERVE__: boolean;
  const __WEBQ_TARGET__: TargetPlatform;
}
