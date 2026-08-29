import { App as CapApp } from '@capacitor/app'
import { useEffect } from 'react'
import { isNative } from '@/lib/platform'

/** Wires the Android hardware/gesture back button to browser history (which
 *  react-router's BrowserRouter drives), exiting the app once there's nowhere
 *  left to go back to — the standard Capacitor recipe. */
export function useAndroidBackButton() {
  useEffect(() => {
    if (!isNative()) return
    const listenerPromise = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) window.history.back()
      else CapApp.exitApp()
    })
    return () => {
      listenerPromise.then((l) => l.remove())
    }
  }, [])
}
