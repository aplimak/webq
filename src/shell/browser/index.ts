import { NativeBridge } from '../nativeBridge';

export interface BrowserBridge extends NativeBridge {
  readonly platform: 'browser';
}

export const _bridge: BrowserBridge = {
  platform: 'browser',
  async toast(message: string, duration: number = 3000): Promise<void> {
    const { toast } = await import('../components');
    toast.info(message, duration);
  },
};
