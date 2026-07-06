import type { NativeBridgeBase } from '../base';

export interface BrowserBridge extends NativeBridgeBase {
  readonly platform: 'browser';
}

export const _bridge: BrowserBridge = {
  platform: 'browser',
  async toast(message: string, duration: number = 3000): Promise<void> {
    const { toast } = await import('@/shell/components');
    toast.info(message, duration);
  },
};
