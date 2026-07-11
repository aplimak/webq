import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'ir.aeliux.webq',
  appName: 'WebQ',
  webDir: 'bundle/cap',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
  },
};

export default config;
