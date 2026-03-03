import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mymoney.app',
  appName: 'SpendSee',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
