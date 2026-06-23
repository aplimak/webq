import { service as toastService, ToastType } from './toast';

function showToast(type: ToastType, message: string, duration?: number): void {
  toastService.show(message, type, duration);
}

export { Dialog } from './dialog';
export * as loading from './loading';

export const toast = {
  service: toastService,
  show: showToast,
  info: (message: string, duration?: number): void => showToast('info', message, duration),
  success: (message: string, duration?: number): void => showToast('success', message, duration),
  error: (message: string, duration?: number): void => showToast('error', message, duration),
};
