import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { KeyIcon, PlusIcon, SearchIcon } from '../components/Icons'
import { Avatar, Badge, Button, Empty, ErrorText, Field, Input, Modal, PageHeader, Pagination, PasswordInput, Select, Spinner } from '../components/ui'
import { tableClass as t } from '../lib/table'
import { api, ApiError } from '../lib/api'
import { displayName, fa, relative, ROLE_LABEL } from '../lib/format'
import { errorMessage, useConfirm, useToast } from '../lib/feedback'
import type { Paged, User } from '../lib/types'
import { useSession } from '../lib/useSession'

type StaffForm = { firstName: string; lastName: string; mobile: string; username: string; password: string; role: 'Operator' | 'Admin' }
const blankStaff: StaffForm = { firstName: '', lastName: '', mobile: '', username: '', password: '', role: 'Operator' }

function NewStaffModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState(blankStaff)
  const [error, setError] = useState<ApiError | null>(null)
  const set = <K extends keyof StaffForm>(k: K, v: StaffForm[K]) => setForm((f) => ({ ...f, [k]: v }))

  const save = useMutation({
    mutationFn: () => api.post<User>('/api/admin/users/staff', form),
    onSuccess: (u) => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      toast(`حساب «${displayName(u)}» ساخته شد`)
      setForm(blankStaff)
      onClose()
    },
    onError: (e) => setError(e as ApiError),
  })
  const err = (k: string) => error?.errors?.[k]?.[0]

  return (
    <Modal open={open} title="کارمند جدید" onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate() }}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام"><Input autoFocus value={form.firstName} onChange={(e) => set('firstName', e.target.value)} /></Field>
          <Field label="نام خانوادگی"><Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} /></Field>
        </div>
        <Field label="شماره موبایل" error={err('mobile')}>
          <Input className="ltr" inputMode="numeric" placeholder="09xxxxxxxxx" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام کاربری" error={err('username')} hint="حروف انگلیسی، عدد، نقطه یا خط تیره">
            <Input className="ltr" autoComplete="off" spellCheck={false} value={form.username} onChange={(e) => set('username', e.target.value)} />
          </Field>
          <Field label="رمز عبور" error={err('password')} hint="حداقل ۸ کاراکتر، شامل حرف و عدد">
            <PasswordInput autoComplete="new-password" value={form.password} onChange={(e) => set('password', e.target.value)} />
          </Field>
        </div>
        <Field label="نقش" error={err('role')}>
          <Select value={form.role} onChange={(e) => set('role', e.target.value as StaffForm['role'])}>
            <option value="Operator">اپراتور (مدیریت کاتالوگ و کاربران)</option>
            <option value="Admin">مدیر (دسترسی کامل)</option>
          </Select>
        </Field>
        {error && !error.errors && <ErrorText error={error} />}
        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <Button variant="secondary" onClick={onClose}>انصراف</Button>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'در حال ساخت...' : 'ساخت حساب'}</Button>
        </div>
      </form>
    </Modal>
  )
}

function CredentialsModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [forId, setForId] = useState<string | null>(null)

  if (user && user.id !== forId) {
    setForId(user.id)
    setUsername(user.username ?? '')
    setPassword('')
    setError(null)
  }

  const save = useMutation({
    mutationFn: () => api.put<User>(`/api/admin/users/${user!.id}/credentials`, { username, password: password || null }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['users'] })
      toast(password ? 'رمز عبور جدید ثبت شد و نشست‌های قبلی کاربر بسته شد' : 'نام کاربری به‌روزرسانی شد')
      onClose()
    },
    onError: (e) => setError(e as ApiError),
  })

  return (
    <Modal open={!!user} title="نام کاربری و رمز عبور" onClose={onClose}>
      {user && (
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setError(null); save.mutate() }}>
          <div className="flex items-center gap-3 rounded-xl bg-canvas p-3">
            <Avatar name={displayName(user)} seed={user.id} />
            <div>
              <p className="text-sm font-bold">{displayName(user)}</p>
              <p className="ltr text-start text-xs text-muted">{user.mobile}</p>
            </div>
          </div>
          <Field label="نام کاربری" error={error?.errors?.username?.[0]}>
            <Input className="ltr" autoComplete="off" spellCheck={false} value={username} onChange={(e) => setUsername(e.target.value)} />
          </Field>
          <Field label="رمز عبور جدید" error={error?.errors?.password?.[0]} hint="خالی بگذارید تا رمز فعلی تغییر نکند">
            <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          {error && !error.errors && <ErrorText error={error} />}
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="secondary" onClick={onClose}>انصراف</Button>
            <Button type="submit" disabled={save.isPending}>ذخیره</Button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function UsersPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const session = useSession()
  const isAdmin = session?.user.roles.includes('Admin') ?? false
  const [tab, setTab] = useState<'all' | 'staff'>('all')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [credentials, setCredentials] = useState<User | null>(null)

  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (search) params.set('q', search)
  if (role) params.set('role', role)
  if (tab === 'staff') params.set('staff', 'true')

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', tab, search, role, page],
    queryFn: () => api.get<Paged<User>>(`/api/admin/users?${params}`),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })
  const block = useMutation({
    mutationFn: (u: User) => api.post<User>(`/api/admin/users/${u.id}/${u.isBlocked ? 'unblock' : 'block'}`),
    onSuccess: (u) => {
      void invalidate()
      toast(u.isBlocked ? `«${displayName(u)}» مسدود شد` : `مسدودی «${displayName(u)}» برداشته شد`)
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  const roles = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string[] }) => api.put<User>(`/api/admin/users/${id}/roles`, { roles: value }),
    onSuccess: () => {
      void invalidate()
      toast('نقش کاربر تغییر کرد')
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  async function toggleBlock(u: User) {
    if (!u.isBlocked) {
      const ok = await confirm({
        title: `مسدود کردن «${displayName(u)}»`,
        message: 'کاربر از همه دستگاه‌ها خارج می‌شود و تا رفع مسدودی نمی‌تواند وارد شود.',
        confirmLabel: 'مسدود کن',
        danger: true,
      })
      if (!ok) return
    }
    block.mutate(u)
  }

  const tabs = [
    { key: 'all' as const, label: 'همه کاربران' },
    { key: 'staff' as const, label: 'کارکنان' },
  ]

  return (
    <>
      <PageHeader
        title="کاربران و کارکنان"
        subtitle="مشتریان با شماره موبایل وارد می‌شوند و کارکنان با نام کاربری و رمز عبور."
        actions={isAdmin && (
          <Button onClick={() => setCreating(true)}>
            <PlusIcon className="size-4" /> کارمند جدید
          </Button>
        )}
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl border border-line bg-surface p-1">
          {tabs.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => { setTab(x.key); setPage(1); setRole('') }}
              className={`rounded-lg px-4 py-1.5 text-sm transition ${tab === x.key ? 'bg-night font-bold text-white' : 'text-muted hover:text-ink'}`}
            >
              {x.label}
            </button>
          ))}
        </div>
        <form
          className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[1fr_auto_auto]"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(q.trim())
          }}
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-[18px] text-muted" />
            <Input className="ps-10" placeholder="جست‌وجوی موبایل، نام یا شرکت" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          {tab === 'all' && (
            <Select className="w-40" value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
              <option value="">همه نقش‌ها</option>
              {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          )}
          <Button type="submit" variant="secondary">جست‌وجو</Button>
        </form>
      </div>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorText error={error} />
      ) : !data?.items.length ? (
        <Empty>کاربری پیدا نشد.</Empty>
      ) : (
        <div className={t.wrap}>
          <table className={`${t.table} min-w-[820px]`}>
            <thead className={t.head}>
              <tr>
                <th className={t.th}>کاربر</th>
                <th className={t.th}>ورود</th>
                <th className={t.th}>نقش</th>
                <th className={t.th}>عضویت / آخرین ورود</th>
                <th className={t.th} />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((u) => {
                const staffRole = u.roles.includes('Admin') ? 'Admin' : u.roles.includes('Operator') ? 'Operator' : ''
                const isSelf = u.id === session?.user.id
                const name = displayName(u)
                return (
                  <tr key={u.id} className={t.row}>
                    <td className={t.td}>
                      <div className="flex items-center gap-3">
                        <Avatar name={name} seed={u.id} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 font-bold">
                            {name}
                            {isSelf && <Badge tone="blue">شما</Badge>}
                            {u.isBlocked && <Badge tone="red">مسدود</Badge>}
                          </p>
                          <p className="ltr text-start text-xs text-muted">
                            {u.mobile}
                            {u.type === 'Legal' && u.companyName ? ` · ${u.companyName}` : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className={t.td}>
                      {u.username ? (
                        <span className="ltr inline-flex items-center gap-1.5 rounded-lg bg-canvas px-2 py-1 text-xs font-bold">
                          <KeyIcon className="size-3.5 text-muted" /> {u.username}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">{u.hasPassword ? 'موبایل + رمز' : 'موبایل + کد'}</span>
                      )}
                    </td>
                    <td className={t.td}>
                      {isAdmin && !isSelf ? (
                        <Select
                          className="h-9 w-32"
                          value={staffRole}
                          onChange={(e) => roles.mutate({ id: u.id, value: e.target.value ? [e.target.value] : [] })}
                        >
                          <option value="">مشتری</option>
                          <option value="Operator">اپراتور</option>
                          <option value="Admin">مدیر</option>
                        </Select>
                      ) : (
                        <Badge tone={staffRole ? 'blue' : 'gray'}>{ROLE_LABEL[staffRole || 'Customer']}</Badge>
                      )}
                    </td>
                    <td className={`${t.td} text-xs text-muted`}>
                      <p>{relative(u.createdAt)}</p>
                      <p className="mt-0.5">{u.lastLoginAt ? `ورود: ${relative(u.lastLoginAt)}` : 'بدون ورود'}</p>
                    </td>
                    <td className={`${t.td} text-end`}>
                      <div className="flex justify-end gap-2">
                        {isAdmin && staffRole && (
                          <Button variant="secondary" className="h-9 px-3" onClick={() => setCredentials(u)}>
                            <KeyIcon className="size-4" /> رمز
                          </Button>
                        )}
                        {!isSelf && (
                          <Button variant={u.isBlocked ? 'secondary' : 'danger'} className="h-9 px-3" onClick={() => void toggleBlock(u)}>
                            {u.isBlocked ? 'رفع مسدودی' : 'مسدود'}
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="border-t border-line px-4 py-3 text-xs text-muted">{fa(data.total)} کاربر</p>
        </div>
      )}
      {data && <Pagination page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />}

      <NewStaffModal open={creating} onClose={() => setCreating(false)} />
      <CredentialsModal user={credentials} onClose={() => setCredentials(null)} />
    </>
  )
}
