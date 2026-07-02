import { NativeBridge } from '../nativeBridge';

export interface CordovaBridge extends NativeBridge {
  readonly platform: 'cordova';
  isReady(): boolean;
  whenReady(): Promise<void>;
  quit(): Promise<void>;
}

export const _bridge: CordovaBridge;
