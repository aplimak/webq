import { NativeBridge } from '../nativeBridge';

export interface CordovaBridge extends NativeBridge {
  readonly platform: 'cordova';
  quit(): Promise<void>;
}

export const _bridge: CordovaBridge;
