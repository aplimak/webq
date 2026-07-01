import { TargetPlatform } from './env';

export interface NativeBridge {
  readonly platform: TargetPlatform;
}
