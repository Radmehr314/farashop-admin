import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { PlusIcon, SearchIcon } from '../components/Icons'
import { Badge, Button, Card, Empty, ErrorText, Input, PageHeader, Pagination, Select, Spinner } from '../components/ui'
import { tableClass as t } from '../lib/table'
import { api, mediaUrl } from '../lib/api'
import { date, fa, STATUS_LABEL, toman } from '../lib/format'
import type { Category, Paged, ProductRow } from '../lib/types'

export function ProductsPage() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [page, setPage] = useState(1)

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/api/admin/catalog/categories') })
  const params = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (search) params.set('q', search)
  if (status) params.set('status', status)
  if (categoryId) params.set('categoryId', categoryId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', search, status, categoryId, page],
    queryFn: () => api.get<Paged<ProductRow>>(`/api/admin/catalog/products?${params}`),
    placeholderData: keepPreviousData,
  })

  return (
    <>
      <PageHeader title="کالاها" subtitle={data ? `${fa(data.total)} کالا در کاتالوگ` : undefined} actions={<Button onClick={() => navigate('/products/new')}><PlusIcon className="size-4" /> کالای جدید</Button>} />
      <Card className="mb-4">
        <form
          className="grid gap-3 sm:grid-cols-[1fr_200px_160px_auto]"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            setSearch(q.trim())
          }}
        >
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-[18px] text-muted" />
            <Input className="ps-10" placeholder="جست‌وجوی عنوان یا SKU" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1) }}>
            <option value="">همه دسته‌ها</option>
            {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
            <option value="">همه وضعیت‌ها</option>
            {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>
          <Button type="submit" variant="secondary">جست‌وجو</Button>
        </form>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorText error={error} />
      ) : !data?.items.length ? (
        <Empty>کالایی پیدا نشد.</Empty>
      ) : (
        <div className={t.wrap}>
          <table className={`${t.table} min-w-[760px]`}>
            <thead className={t.head}>
              <tr>
                <th className={t.th}>کالا</th>
                <th className={t.th}>دسته</th>
                <th className={t.th}>قیمت</th>
                <th className={t.th}>موجودی</th>
                <th className={t.th}>وضعیت</th>
                <th className={t.th}>آخرین تغییر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((p) => (
                <tr key={p.id} className={t.row}>
                  <td className={`${t.td}`}>
                    <Link to={`/products/${p.id}`} className="flex items-center gap-3">
                      {p.imageUrl ? <img src={mediaUrl(p.imageUrl) ?? ''} alt="" className="size-11 rounded-xl border border-line bg-white object-contain p-0.5" /> : <div className="size-11 rounded-xl bg-canvas" />}
                      <div>
                        <p className="font-bold hover:text-brand">{p.title}</p>
                        <p className="text-xs text-muted">{p.brandName ?? 'بدون برند'}، {fa(p.variantCount)} تنوع</p>
                      </div>
                    </Link>
                  </td>
                  <td className={`${t.td} text-muted`}>{p.categoryName}</td>
                  <td className={`${t.td}`}>{p.minPrice ? toman(p.minPrice) : <span className="text-muted">ثبت نشده</span>}</td>
                  <td className={`${t.td}`}>{p.totalStock > 0 ? fa(p.totalStock) : <Badge tone="red">ناموجود</Badge>}</td>
                  <td className={`${t.td}`}>
                    <Badge tone={p.status === 'Published' ? 'green' : p.status === 'Draft' ? 'amber' : 'gray'}>{STATUS_LABEL[p.status]}</Badge>
                  </td>
                  <td className={`${t.td} text-xs text-muted`}>{date(p.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} total={data.total} pageSize={data.pageSize} onChange={setPage} />}
    </>
  )
}
