import type { AuthResponse, User } from './types'

export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5080').replace(/\/$/, '')

const STORAGE_KEY = 'fs_admin_auth'

export type Session = { accessToken: string; refreshToken: string; user: User }

export function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

export function writeSession(value: Session | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event('fs-session'))
}

export function sessionFrom(data: AuthResponse): Session {
  return { accessToken: data.tokens.accessToken, refreshToken: data.tokens.refreshToken, user: data.user }
}

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(status: number, message: string, errors?: Record<string, string[]>) {
    super(message)
    this.status = status
    this.errors = errors
  }
}

async function toError(res: Response): Promise<ApiError> {
  try {
    const body = await res.json()
    const first = body.errors ? (Object.values(body.errors)[0] as string[])[0] : undefined
    return new ApiError(res.status, first ?? body.title ?? 'خطایی رخ داد', body.errors)
  } catch {
    return new ApiError(res.status, res.status === 403 ? 'دسترسی ندارید' : 'خطایی رخ داد')
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw await toError(res)
  return res.status === 204 ? (undefined as T) : ((await res.json()) as T)
}

export async function publicPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return parse<T>(res)
}

let refreshing: Promise<Session | null> | null = null

function refresh(): Promise<Session | null> {
  const current = readSession()
  if (!current) return Promise.resolve(null)
  refreshing ??= publicPost<AuthResponse>('/api/auth/refresh', { refreshToken: current.refreshToken })
    .then((data) => {
      const next = sessionFrom(data)
      writeSession(next)
      return next
    })
    .catch(() => {
      writeSession(null)
      return null
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

async function send(path: string, init: RequestInit): Promise<Response> {
  const go = (token?: string) =>
    fetch(`${API_URL}${path}`, {
      ...init,
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
    })
  let res = await go(readSession()?.accessToken)
  if (res.status === 401) {
    const renewed = await refresh()
    if (!renewed) throw new ApiError(401, 'لطفا دوباره وارد شوید')
    res = await go(renewed.accessToken)
  }
  return res
}

export const api = {
  get: <T>(path: string) => send(path, {}).then(parse<T>),
  post: <T>(path: string, body?: unknown) =>
    send(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) }).then(parse<T>),
  put: <T>(path: string, body: unknown) =>
    send(path, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(parse<T>),
  delete: <T = void>(path: string) => send(path, { method: 'DELETE' }).then(parse<T>),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return send('/api/admin/uploads/images', { method: 'POST', body: form }).then(parse<{ url: string }>)
  },
}

export function mediaUrl(url: string | null | undefined): string | null {
  if (!url) return null
  return url.startsWith('http') ? url : `${API_URL}${url}`
}

export async function logout() {
  const s = readSession()
  writeSession(null)
  if (s) await publicPost('/api/auth/logout', { refreshToken: s.refreshToken }).catch(() => undefined)
}
