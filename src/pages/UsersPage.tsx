import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Badge, Button, Empty, ErrorText, Input, PageHeader, Pagination, Select, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { date, ROLE_LABEL } from '../lib/format'
import type { Paged, User } from '../lib/types'
import { useSession } from '../lib/useSession'

export function UsersPage() {
  const qc = useQueryClient()
  const session = useSession()
  const isAdmin = session?.user.roles.includes('Admin') ?? false
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [page, setPage] = useState(1)

  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (search) params.set('q', search)
  if (role) params.set('role', role)

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', search, role, page],
    queryFn: () => api.get<Paged<User>>(`/api/admin/users?${params}`),
    placeholderData: keepPreviousData,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] })
  const block = useMutation({
    mutationFn: (u: User) => api.post(`/api/admin/users/${u.id}/${u.isBlocked ? 'unblock' : 'block'}`),
    onSuccess: invalidate,
    onError: (e) => alert((e as Error).message),
  })
  const roles = useMutation({
    mutationFn: ({ id, value }: { id: string; value: string[] }) => api.put(`/api/admin/users/${id}/roles`, { roles: value }),
    onSuccess: invalidate,
    onError: (e) => alert((e as Error).message),
  })

  return (
    <>
      <PageHeader title="کاربران" />
      <form
        className="mb-4 grid gap-3 sm:grid-cols-[1fr_160px_auto]"
        onSubmit={(e) => {
          e.preventDefault()
          setPage(1)
          setSearch(q.trim())
        }}
      >
        <Input placeholder="موبایل، نام یا شرکت" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={role} onChange={(e) => { setRole(e.target.value); setPage(1) }}>
          <option value="">همه نقش‌ها</option>
          {Object.entries(ROLE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
        <Button type="submit" variant="secondary">جست‌وجو</Button>
      </form>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorText error={error} />
      ) : !data?.items.length ? (
        <Empty>کاربری پیدا نشد.</Empty>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-white">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="bg-canvas text-xs text-muted">
              <tr>
                <th className="p-3 text-start font-medium">کاربر</th>
                <th className="p-3 text-start font-medium">نوع</th>
                <th className="p-3 text-start font-medium">نقش</th>
                <th className="p-3 text-start font-medium">عضویت / آخرین ورود</th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((u) => {
                const staffRole = u.roles.includes('Admin') ? 'Admin' : u.roles.includes('Operator') ? 'Operator' : ''
                const isSelf = u.id === session?.user.id
                return (
                  <tr key={u.id}>
                    <td className="p-3">
                      <p className="font-medium">{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</p>
                      <p className="ltr text-start text-xs text-muted">{u.mobile}</p>
                    </td>
                    <td className="p-3 text-muted">{u.type === 'Legal' ? `حقوقی${u.companyName ? ` (${u.companyName})` : ''}` : 'حقیقی'}</td>
                    <td className="p-3">
                      {isAdmin && !isSelf ? (
                        <Select
                          className="w-32"
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
                    <td className="p-3 text-xs text-muted">
                      <p>{date(u.createdAt)}</p>
                      <p>{u.lastLoginAt ? date(u.lastLoginAt) : '—'}</p>
                    </td>
                    <td className="p-3 text-end">
                      {u.isBlocked && <Badge tone="red">مسدود</Badge>}{' '}
                      {!isSelf && (
                        <Button variant={u.isBlocked ? 'secondary' : 'danger'} onClick={() => block.mutate(u)}>
                          {u.isBlocked ? 'رفع مسدودی' : 'مسدود کردن'}
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />}
    </>
  )
}
