import { TargetPlatform } from '@/shell/env';

export interface NativeBridgeBase {
  readonly platform: TargetPlatform;
  toast(message: string, duration?: number): Promise<void>;
}
