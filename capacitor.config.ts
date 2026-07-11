import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.aeliux.webq',
  appName: 'WebQ',
  webDir: 'bundle/cap',
  plugins: {
    SplashScreen: {
      launchShowDuration: 500,
      launchAutoHide: true,
    },
  },
};

export default config;
