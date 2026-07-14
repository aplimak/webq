import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.aeliux.webq',
  appName: 'WebQ',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
};

export default config;
