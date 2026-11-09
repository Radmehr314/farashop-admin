import { useMutation, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { KeyIcon, ShieldIcon } from '../components/Icons'
import { Avatar, Badge, Button, Card, ErrorText, Field, PageHeader, PasswordInput, Skeleton } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { date, displayName, ROLE_LABEL } from '../lib/format'
import { useToast } from '../lib/feedback'
import type { User } from '../lib/types'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="text-muted">{label}</span>
      <span className="font-bold">{children}</span>
    </div>
  )
}

export function AccountPage() {
  const toast = useToast()
  const me = useQuery({ queryKey: ['me'], queryFn: () => api.get<User>('/api/me') })
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [repeat, setRepeat] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [mismatch, setMismatch] = useState(false)

  const change = useMutation({
    mutationFn: () => api.post<User>('/api/me/password', { currentPassword: current, newPassword: next }),
    onSuccess: () => {
      toast('رمز عبور شما تغییر کرد')
      setCurrent('')
      setNext('')
      setRepeat('')
    },
    onError: (e) => setError(e as ApiError),
  })

  const user = me.data
  const strength = [next.length >= 8, /[a-zA-Z]/.test(next) && /\d/.test(next), next.length >= 12, /[^a-zA-Z0-9]/.test(next)].filter(Boolean).length

  return (
    <>
      <PageHeader title="حساب من و امنیت" subtitle="اطلاعات حساب کاربری و رمز عبور ورود به پنل" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          {!user ? (
            <Skeleton className="h-48" />
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar name={displayName(user)} seed={user.id} size="size-14" />
                <div>
                  <p className="text-lg font-black">{displayName(user)}</p>
                  <div className="mt-1 flex gap-1.5">
                    {user.roles.filter((r) => r !== 'Customer').map((r) => <Badge key={r} tone="blue">{ROLE_LABEL[r] ?? r}</Badge>)}
                  </div>
                </div>
              </div>
              <div className="mt-6 divide-y divide-line">
                <Row label="نام کاربری"><span className="ltr">{user.username ?? '—'}</span></Row>
                <Row label="شماره موبایل"><span className="ltr">{user.mobile}</span></Row>
                <Row label="عضویت از">{date(user.createdAt)}</Row>
                <Row label="آخرین ورود">{user.lastLoginAt ? date(user.lastLoginAt) : '—'}</Row>
              </div>
            </>
          )}
        </Card>

        <Card title="تغییر رمز عبور" subtitle="بعد از ۵ تلاش ناموفق، ورود به مدت ۱۵ دقیقه قفل می‌شود.">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              setMismatch(next !== repeat)
              if (next !== repeat) return
              change.mutate()
            }}
          >
            {user?.hasPassword !== false && (
              <Field label="رمز عبور فعلی" error={error?.errors?.currentPassword?.[0]}>
                <PasswordInput autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
              </Field>
            )}
            <Field label="رمز عبور جدید" error={error?.errors?.newPassword?.[0]}>
              <PasswordInput autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
            </Field>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={`h-1.5 flex-1 rounded-full ${i < strength ? (strength <= 1 ? 'bg-danger' : strength === 2 ? 'bg-sun' : 'bg-success') : 'bg-line'}`} />
              ))}
              <span className="w-14 text-end text-xs text-muted">{next ? ['ضعیف', 'ضعیف', 'متوسط', 'خوب', 'قوی'][strength] : ''}</span>
            </div>
            <Field label="تکرار رمز عبور جدید" error={mismatch ? 'تکرار رمز با رمز جدید یکسان نیست' : undefined}>
              <PasswordInput autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
            </Field>
            {error && !error.errors && <ErrorText error={error} />}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <ShieldIcon className="size-4 text-success" /> حداقل ۸ کاراکتر، شامل حرف و عدد
              </p>
              <Button type="submit" disabled={change.isPending || !next}>
                <KeyIcon className="size-4" /> {change.isPending ? 'در حال ذخیره...' : 'تغییر رمز'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}
