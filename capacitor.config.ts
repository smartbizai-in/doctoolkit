import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.smartbizai.doctoolkit',
  appName: 'DocToolkit',
  webDir: 'dist',
  backgroundColor: '#0f172a',
  android: {
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 400,
      backgroundColor: '#0f172a',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      overlaysWebView: false,
    },
  },
}

export default config
