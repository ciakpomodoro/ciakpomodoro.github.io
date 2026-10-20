export type Permission = 'unsupported' | 'default' | 'granted' | 'denied'

export const permission = (): Permission =>
  'Notification' in window ? (Notification.permission as Permission) : 'unsupported'

export async function askPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  try {
    return (await Notification.requestPermission()) === 'granted'
  } catch {
    return false
  }
}

export async function showNotification(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(title, { body, icon: './pwa-192.png', tag: 'ciak', silent: true })
    else new Notification(title, { body, silent: true })
  } catch {
    /* notifiche non disponibili */
  }
}
