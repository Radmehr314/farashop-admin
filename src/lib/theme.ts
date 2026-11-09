import { useSyncExternalStore } from 'react'

const KEY = 'fs_admin_theme'
export type Theme = 'light' | 'dark'

function read(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

function subscribe(cb: () => void) {
  window.addEventListener('fs-theme', cb)
  return () => window.removeEventListener('fs-theme', cb)
}

export function setTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event('fs-theme'))
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, read, () => 'light')
}
