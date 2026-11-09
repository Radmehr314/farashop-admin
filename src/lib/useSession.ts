import { useSyncExternalStore } from 'react'
import { readSession, type Session } from './api'

let cachedRaw: string | null = null
let cachedSession: Session | null = null

function subscribe(cb: () => void) {
  window.addEventListener('fs-session', cb)
  window.addEventListener('storage', cb)
  return () => {
    window.removeEventListener('fs-session', cb)
    window.removeEventListener('storage', cb)
  }
}

function snapshot(): Session | null {
  const s = readSession()
  const raw = s ? JSON.stringify(s) : null
  if (raw !== cachedRaw) {
    cachedRaw = raw
    cachedSession = s
  }
  return cachedSession
}

export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, snapshot)
}

export function isBackoffice(session: Session | null): boolean {
  return !!session && session.user.roles.some((r) => r === 'Admin' || r === 'Operator')
}
