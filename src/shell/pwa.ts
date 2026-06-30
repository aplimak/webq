import { isWebpackServe, isPWA, platform } from './env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function registerHandler(e: any): void {
  // Prevent the browser's default mini-infobar from showing
  e.preventDefault();

  // Save the event so we can trigger it later
  let deferredPrompt = e;

  const installBtn = document.querySelector('header #install-pwa');
  if (installBtn) {
    installBtn.classList.remove('hide');
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      installBtn.classList.add('hide');

      // Show the native install prompt
      deferredPrompt.prompt();

      // Wait for the user's response
      const result = await deferredPrompt.userChoice;
      const { toast } = await import('./components');

      if (result.outcome === 'accepted') {
        toast.success('App Installed Successfully');
      } else {
        toast.error('App Installation Cancelled');
      }

      deferredPrompt = null;
    });
  }
}

if (platform.browser && !isWebpackServe && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((reg) => {
        console.log('SW registered:', reg);
        if (!isPWA) {
          window.addEventListener('beforeinstallprompt', registerHandler);
        }
      })
      .catch((err) => console.error('SW registration failed:', err));
  });
}
