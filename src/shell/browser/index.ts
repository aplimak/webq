import { NativeBridge } from '../nativeBridge';

export interface BrowserBridge extends NativeBridge {
  readonly platform: 'browser';
}

export const _bridge: BrowserBridge = {
  platform: 'browser',
};
