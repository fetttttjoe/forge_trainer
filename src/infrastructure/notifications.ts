// Capacitor LocalNotifications adapter for the Notifier port. On the web (dev in a browser) the
// plugin isn't implemented, so every method is a guarded no-op — the in-app beep covers foreground.

import { Capacitor } from '@capacitor/core'
import { LocalNotifications } from '@capacitor/local-notifications'
import type { Notifier } from '@/domain/ports'

const REST_ID = 1001

export const capacitorNotifier: Notifier = {
  async requestPermission() {
    if (!Capacitor.isNativePlatform()) return
    try {
      await LocalNotifications.requestPermissions()
    } catch {
      /* ignore */
    }
  },

  async scheduleRestEnd(seconds: number) {
    if (!Capacitor.isNativePlatform() || seconds <= 0) return
    try {
      await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] })
      await LocalNotifications.schedule({
        notifications: [
          {
            id: REST_ID,
            title: 'Rest complete',
            body: 'Time for your next set 💪',
            schedule: { at: new Date(Date.now() + seconds * 1000) },
          },
        ],
      })
    } catch {
      /* ignore */
    }
  },

  async cancel() {
    if (!Capacitor.isNativePlatform()) return
    try {
      await LocalNotifications.cancel({ notifications: [{ id: REST_ID }] })
    } catch {
      /* ignore */
    }
  },
}
