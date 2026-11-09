import { useQuery } from '@tanstack/react-query'
import { useState, type ComponentType, type SVGProps } from 'react'
import { Link, useNavigate } from 'react-router'
import { BoxIcon, CheckIcon, FolderIcon, PlusIcon, TagIcon, UsersIcon } from '../components/Icons'
import { Avatar, Badge, Button, Card, Skeleton } from '../components/ui'
import { api, mediaUrl } from '../lib/api'
import { displayName, fa, longDate, relative, ROLE_LABEL, STATUS_LABEL, toman } from '../lib/format'
import { tableClass as t } from '../lib/table'
import type { Brand, Category, Paged, ProductRow, User } from '../lib/types'
import { useSession } from '../lib/useSession'

const count = (path: string) => () => api.get<Paged<unknown>>(path).then((r) => r.total)

function Kpi({ label, tag, value, sub, to, icon: Icon, tone }: {
  label: string
  tag: string
  value: number | undefined
  sub?: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  tone: string
}) {
  return (
    <Link to={to} className="group relative overflow-hidden rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:-translate-y-0.5 hover:border-brand/30">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`grid size-11 place-items-center rounded-xl ${tone}`}>
            <Icon className="size-[22px]" />
          </span>
          <p className="text-sm font-bold text-ink/80">{label}</p>
        </div>
        <span className={`ltr rounded-lg px-2 py-0.5 text-[10px] font-black tracking-wide ${tone}`}>{tag}</span>
      </div>
      {value === undefined ? <Skeleton className="mt-5 h-9 w-20" /> : <p className="mt-5 text-[34px] leading-none font-black">{fa(value)}</p>}
      <p className="mt-2 h-4 text-xs text-muted">{sub}</p>
    </Link>
  )
}

function Donut({ rows }: { rows: { label: string; value: number; color: string }[] }) {
  const total = rows.reduce((a, r) => a + r.value, 0)
  const r = 52
  const c = 2 * Math.PI * r
  const segments = rows.map((row, i) => ({
    ...row,
    len: total ? (row.value / total) * c : 0,
    offset: total ? (rows.slice(0, i).reduce((a, x) => a + x.value, 0) / total) * c : 0,
  }))
  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
      <div className="relative size-[150px] shrink-0">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={r} fill="none" stroke="var(--surface-2)" strokeWidth="16" />
          {total > 0 &&
            segments.map((seg) => (
              <circle key={seg.label} cx="70" cy="70" r={r} fill="none" stroke={seg.color} strokeWidth="16" strokeDasharray={`${seg.len} ${c - seg.len}`} strokeDashoffset={-seg.offset} />
            ))}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-black">{fa(total)}</p>
            <p className="text-[11px] text-muted">کالا</p>
          </div>
        </div>
      </div>
      <ul className="w-full max-w-[200px] space-y-3">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2.5 text-sm">
            <span className="size-3 rounded-md" style={{ background: row.color }} />
            <span className="flex-1 text-muted">{row.label}</span>
            <span className="font-bold">{fa(row.value)}</span>
            <span className="w-10 text-end text-xs text-muted">{total ? `${fa(Math.round((row.value / total) * 100))}٪` : '—'}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function CategoryBars({ categories }: { categories: Category[] }) {
  const rows = categories
    .filter((c) => c.productCount > 0 && !categories.some((x) => x.parentId === c.id))
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 7)
  const max = Math.max(1, ...rows.map((r) => r.productCount))
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted">هنوز کالایی در دسته‌ها ثبت نشده است.</p>
  return (
    <ul className="space-y-3.5">
      {rows.map((c, i) => (
        <li key={c.id} className="grid grid-cols-[120px_1fr_36px] items-center gap-3 text-sm sm:grid-cols-[150px_1fr_36px]">
          <span className="truncate text-ink/80">{c.name}</span>
          <span className="h-3 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full transition-[width] duration-700"
              style={{ width: `${(c.productCount / max) * 100}%`, background: i === 0 ? 'var(--color-sun)' : 'var(--brand)', opacity: i === 0 ? 1 : 1 - i * 0.09 }}
            />
          </span>
          <span className="text-end font-bold">{fa(c.productCount)}</span>
        </li>
      ))}
    </ul>
  )
}

export function DashboardPage() {
  const navigate = useNavigate()
  const session = useSession()
  const products = useQuery({ queryKey: ['products', 'count'], queryFn: count('/api/admin/catalog/products?pageSize=1') })
  const published = useQuery({ queryKey: ['products', 'count', 'Published'], queryFn: count('/api/admin/catalog/products?pageSize=1&status=Published') })
  const drafts = useQuery({ queryKey: ['products', 'count', 'Draft'], queryFn: count('/api/admin/catalog/products?pageSize=1&status=Draft') })
  const archived = useQuery({ queryKey: ['products', 'count', 'Archived'], queryFn: count('/api/admin/catalog/products?pageSize=1&status=Archived') })
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/api/admin/catalog/categories') })
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => api.get<Brand[]>('/api/admin/catalog/brands') })
  const users = useQuery({ queryKey: ['users', 'count'], queryFn: count('/api/admin/users?pageSize=1') })
  const staff = useQuery({ queryKey: ['users', 'count', 'staff'], queryFn: count('/api/admin/users?pageSize=1&staff=true') })
  const recentProducts = useQuery({ queryKey: ['products', 'recent'], queryFn: () => api.get<Paged<ProductRow>>('/api/admin/catalog/products?pageSize=6') })
  const recentUsers = useQuery({ queryKey: ['users', 'recent'], queryFn: () => api.get<Paged<User>>('/api/admin/users?pageSize=6') })

  const name = session ? displayName(session.user) : ''
  const [today] = useState(() => longDate(new Date()))

  const leafCategories = (categories.data ?? []).filter((c) => !(categories.data ?? []).some((x) => x.parentId === c.id))
  const steps = [
    { done: (categories.data?.length ?? 0) > 0, label: 'تعریف دسته‌بندی‌ها و ویژگی‌ها', to: '/categories' },
    { done: (brands.data?.length ?? 0) > 0, label: 'افزودن برندها', to: '/brands' },
    { done: (products.data ?? 0) > 0, label: 'ساخت کالا با قیمت و موجودی', to: '/products/new' },
    { done: (published.data ?? 0) > 0, label: 'انتشار کالا در فروشگاه', to: '/products' },
  ]
  const doneSteps = steps.filter((s) => s.done).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{today}</p>
          <h2 className="mt-1 text-2xl font-black sm:text-[28px]">سلام، {name}</h2>
          <p className="mt-1.5 text-sm text-muted">خلاصه وضعیت فروشگاه فراشاپ در یک نگاه</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => navigate('/categories')}>
            <FolderIcon className="size-4" /> دسته‌بندی‌ها
          </Button>
          <Button onClick={() => navigate('/products/new')}>
            <PlusIcon className="size-4" /> کالای جدید
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="کالاها" tag="Products" value={products.data} sub={published.data !== undefined ? `${fa(published.data)} کالای منتشرشده` : undefined} to="/products" icon={BoxIcon} tone="bg-brand-soft text-brand" />
        <Kpi label="دسته‌بندی‌ها" tag="Categories" value={categories.data?.length} sub={categories.data ? `${fa(leafCategories.length)} دسته‌ی نهایی` : undefined} to="/categories" icon={FolderIcon} tone="bg-sun-soft text-sun-ink" />
        <Kpi label="برندها" tag="Brands" value={brands.data?.length} sub={brands.data ? `${fa(brands.data.filter((b) => b.isActive).length)} برند فعال` : undefined} to="/brands" icon={TagIcon} tone="bg-sale-soft text-sale" />
        <Kpi label="کاربران" tag="Users" value={users.data} sub={staff.data !== undefined ? `${fa(staff.data)} نفر از کارکنان` : undefined} to="/users" icon={UsersIcon} tone="bg-violet-soft text-violet-ink" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="کالاها بر اساس دسته‌بندی" subtitle="دسته‌های نهایی با بیشترین کالا">
          {categories.isLoading ? <Skeleton className="h-56" /> : <CategoryBars categories={categories.data ?? []} />}
        </Card>
        <Card title="وضعیت کاتالوگ" subtitle="نسبت کالاهای منتشرشده، پیش‌نویس و بایگانی">
          {published.data === undefined || drafts.data === undefined || archived.data === undefined ? (
            <Skeleton className="h-40" />
          ) : (
            <Donut
              rows={[
                { label: STATUS_LABEL.Published, value: published.data, color: 'var(--brand)' },
                { label: STATUS_LABEL.Draft, value: drafts.data, color: 'var(--color-sun)' },
                { label: STATUS_LABEL.Archived, value: archived.data, color: 'var(--muted)' },
              ]}
            />
          )}
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <Card title="آخرین کالاها" subtitle="به‌ترتیب آخرین تغییر" actions={<Link to="/products" className="text-sm font-bold text-brand">همه کالاها</Link>} flush>
          {recentProducts.isLoading ? (
            <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : !recentProducts.data?.items.length ? (
            <p className="p-10 text-center text-sm text-muted">هنوز کالایی ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className={`${t.table} min-w-[560px]`}>
                <thead className={t.head}>
                  <tr>
                    <th className={t.th}>کالا</th>
                    <th className={t.th}>قیمت</th>
                    <th className={t.th}>وضعیت</th>
                    <th className={t.th}>تغییر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {recentProducts.data.items.map((p) => (
                    <tr key={p.id} className={t.row}>
                      <td className={t.td}>
                        <Link to={`/products/${p.id}`} className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img src={mediaUrl(p.imageUrl) ?? ''} alt="" className="size-11 rounded-xl border border-line bg-white object-contain p-0.5" />
                          ) : (
                            <span className="size-11 rounded-xl bg-surface-2" />
                          )}
                          <span className="min-w-0">
                            <span className="block max-w-[260px] truncate font-bold hover:text-brand">{p.title}</span>
                            <span className="block text-xs text-muted">{p.categoryName}</span>
                          </span>
                        </Link>
                      </td>
                      <td className={`${t.td} whitespace-nowrap`}>{p.minPrice ? toman(p.minPrice) : <span className="text-muted">—</span>}</td>
                      <td className={t.td}>
                        <Badge tone={p.status === 'Published' ? 'green' : p.status === 'Draft' ? 'amber' : 'gray'}>{STATUS_LABEL[p.status]}</Badge>
                      </td>
                      <td className={`${t.td} whitespace-nowrap text-xs text-muted`}>{relative(p.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card title="کاربران جدید" actions={<Link to="/users" className="text-sm font-bold text-brand">همه</Link>} flush>
            {recentUsers.isLoading ? (
              <div className="p-5"><Skeleton className="h-32" /></div>
            ) : (
              <ul className="divide-y divide-line">
                {recentUsers.data?.items.map((u) => {
                  const n = displayName(u)
                  const staffRole = u.roles.find((r) => r !== 'Customer')
                  return (
                    <li key={u.id} className="flex items-center gap-3 px-5 py-3">
                      <Avatar name={n} seed={u.id} size="size-9" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold">{n}</span>
                        <span className="ltr block text-start text-xs text-muted">{u.mobile}</span>
                      </span>
                      {staffRole ? <Badge tone="blue">{ROLE_LABEL[staffRole]}</Badge> : <span className="text-xs text-muted">{relative(u.createdAt)}</span>}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>

          <Card title="راه‌اندازی فروشگاه" subtitle={`${fa(doneSteps)} از ${fa(steps.length)} مرحله`}>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full bg-success transition-[width] duration-700" style={{ width: `${(doneSteps / steps.length) * 100}%` }} />
            </div>
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li key={s.label}>
                  <Link to={s.to} className="flex items-center gap-3 rounded-xl p-2 text-sm transition hover:bg-surface-2">
                    <span className={`grid size-7 shrink-0 place-items-center rounded-lg text-xs font-black ${s.done ? 'bg-success text-white' : 'bg-surface-2 text-muted'}`}>
                      {s.done ? <CheckIcon className="size-4" /> : fa(i + 1)}
                    </span>
                    <span className={s.done ? 'text-muted line-through decoration-muted/40' : 'font-medium'}>{s.label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </Card>
        </div>
      </div>
    </div>
  )
}
