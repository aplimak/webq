import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.aeliux.webq',
  appName: 'WebQ',
  webDir: 'bundle/cap',
  cordova: {
    preferences: {
      FadeSplashScreen: 'false'
    }
  }
};

export default config;
