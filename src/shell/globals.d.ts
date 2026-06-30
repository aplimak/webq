import { TargetPlatform } from './env';

export declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    nativeBridge: any;
  }

  const __WEBQ_NODE_ENV__: string;
  const __WEBQ_WEBPACK_SERVE__: boolean;
  const __WEBQ_TARGET__: TargetPlatform;
}
