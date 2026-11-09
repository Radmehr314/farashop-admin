import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button, Input } from '../components/ui'
import { ApiError, publicPost, sessionFrom, writeSession } from '../lib/api'
import type { AuthResponse } from '../lib/types'
import { useSession } from '../lib/useSession'

type OtpResponse = { mobile: string; devCode: string | null }

export function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState<'mobile' | 'code'>('mobile')
  const [mobile, setMobile] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  if (session) return <Navigate to="/" replace />

  async function submit() {
    setError(null)
    setBusy(true)
    try {
      if (step === 'mobile') {
        const res = await publicPost<OtpResponse>('/api/auth/otp/request', { mobile })
        setMobile(res.mobile)
        setDevCode(res.devCode)
        setStep('code')
      } else {
        const res = await publicPost<AuthResponse>('/api/auth/otp/verify', { mobile, code })
        writeSession(sessionFrom(res))
        const from = (location.state as { from?: string } | null)?.from
        navigate(from && from !== '/login' ? from : '/', { replace: true })
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'ارتباط با سرور برقرار نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm"
      >
        <div className="mb-6 flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-lg bg-brand text-lg font-black text-white">ف</span>
          <h1 className="font-extrabold">ورود به پنل مدیریت فراشاپ</h1>
        </div>
        {step === 'mobile' ? (
          <label className="block text-sm">
            <span className="text-muted">شماره موبایل</span>
            <Input autoFocus inputMode="numeric" value={mobile} onChange={(e) => setMobile(e.target.value)} className="ltr mt-1 h-11 text-center" />
            {import.meta.env.DEV && (
              <button type="button" onClick={() => setMobile('09120000000')} className="mt-2 block text-xs text-muted hover:text-brand">
                محیط توسعه: ورود با شماره مدیر <span className="ltr font-bold">09120000000</span>
              </button>
            )}
          </label>
        ) : (
          <label className="block text-sm">
            <span className="text-muted">کد ارسال‌شده به <span className="ltr">{mobile}</span></span>
            <Input
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={5}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="ltr mt-1 h-11 text-center text-lg tracking-[0.5em]"
            />
            {devCode && <span className="mt-2 block text-xs text-muted">کد آزمایشی: <span className="ltr font-bold">{devCode}</span></span>}
          </label>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
        <Button type="submit" disabled={busy} className="mt-5 h-11 w-full">
          {busy ? 'لطفا صبر کنید...' : step === 'mobile' ? 'دریافت کد' : 'ورود'}
        </Button>
        {step === 'code' && (
          <button type="button" onClick={() => setStep('mobile')} className="mt-3 w-full text-center text-xs text-brand">
            تغییر شماره
          </button>
        )}
      </form>
    </div>
  )
}
