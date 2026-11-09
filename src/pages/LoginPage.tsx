import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { BoxIcon, LockIcon, ShieldIcon, UserIcon, UsersIcon } from '../components/Icons'
import { Logo, LogoMark } from '../components/Logo'
import { Button, Input, PasswordInput } from '../components/ui'
import { ApiError, publicPost, sessionFrom, writeSession } from '../lib/api'
import type { AuthResponse } from '../lib/types'
import { useSession } from '../lib/useSession'

const FEATURES = [
  { icon: BoxIcon, title: 'مدیریت کاتالوگ', text: 'کالا، دسته‌بندی، برند، قیمت و موجودی' },
  { icon: UsersIcon, title: 'کاربران و کارکنان', text: 'نقش‌ها، دسترسی‌ها و مسدودسازی' },
  { icon: ShieldIcon, title: 'ورود امن', text: 'رمز عبور رمزنگاری‌شده و قفل خودکار' },
]

export function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function submit() {
    setError(null)
    if (!username.trim() || !password) {
      setError('نام کاربری و رمز عبور را وارد کنید')
      return
    }
    setBusy(true)
    try {
      const res = await publicPost<AuthResponse>('/api/auth/admin/login', { username, password })
      writeSession(sessionFrom(res))
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/', { replace: true })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'ارتباط با سرور برقرار نشد')
      setPassword('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="flex items-center justify-center bg-surface p-6 sm:p-10">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            void submit()
          }}
          className="w-full max-w-sm"
        >
          <div className="mb-10">
            <Logo />
          </div>
          <h1 className="text-2xl font-black">ورود به پنل مدیریت</h1>
          <p className="mt-2 text-sm text-muted">با نام کاربری و رمز عبور کارکنان وارد شوید.</p>

          <div className="mt-8 space-y-4">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink/80">نام کاربری</span>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute inset-y-0 start-3.5 my-auto size-[18px] text-muted" />
                <Input
                  autoFocus
                  autoComplete="username"
                  spellCheck={false}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="ltr h-12 pe-11"
                />
              </div>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-ink/80">رمز عبور</span>
              <div className="relative">
                <LockIcon className="pointer-events-none absolute inset-y-0 start-3.5 z-10 my-auto size-[18px] text-muted" />
                <PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pe-11" />
              </div>
            </label>
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-danger/5 px-3 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy} className="mt-6 h-12 w-full text-base">
            {busy ? 'در حال ورود...' : 'ورود به پنل'}
          </Button>

          {import.meta.env.DEV && (
            <button
              type="button"
              onClick={() => {
                setUsername('admin')
                setPassword('Admin12345')
              }}
              className="mt-4 w-full rounded-xl border border-dashed border-line px-3 py-2.5 text-xs text-muted transition hover:border-brand/40 hover:text-brand"
            >
              محیط توسعه: پر کردن با <span className="ltr font-bold">admin / Admin12345</span>
            </button>
          )}
        </form>
      </div>

      <div className="relative hidden overflow-hidden bg-night p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <span aria-hidden className="absolute -top-40 -left-40 size-[520px] rounded-full bg-brand/40 blur-3xl" />
        <span aria-hidden className="absolute right-0 -bottom-40 size-[420px] rounded-full bg-sun/10 blur-3xl" />
        <span aria-hidden className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative">
          <LogoMark className="size-14" />
        </div>

        <div className="relative max-w-md">
          <p className="text-4xl leading-[1.5] font-black">
            همه‌چیز فروشگاه،
            <br />
            <span className="text-sun">در یک پنل.</span>
          </p>
          <ul className="mt-10 space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10 text-sun">
                  <Icon className="size-6" />
                </span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className="block text-sm text-white/55">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-white/40">دسترسی فقط برای کارکنان فراشاپ</p>
      </div>
    </div>
  )
}
