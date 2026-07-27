import type { CapacitorConfig } from '@capacitor/cli';
import path from 'node:path';

const config: CapacitorConfig = {
  appId: 'ir.aeliux.webq',
  appName: 'WebQ',
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
    },
  },
  webDir: path.join('bundle', 'cap', process.env.NODE_ENV === 'production' ? 'release' : 'debug'),
};

export default config;
