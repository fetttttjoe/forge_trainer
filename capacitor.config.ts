import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.train.forgefit',
  appName: 'Forge',
  webDir: 'dist',
  // iOS: keep the webview below the status bar (Android 15+ is handled by the edge-to-edge plugin).
  plugins: {
    StatusBar: {
      overlaysWebView: false,
    },
  },
}

export default config
