import { TargetPlatform } from './env';

export interface NativeBridge {
  readonly platform: TargetPlatform;
  toast(message: string, duration?: number): Promise<void>;
}
