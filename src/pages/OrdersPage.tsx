import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { SearchIcon } from '../components/Icons'
import { Badge, Button, Card, Empty, ErrorText, Input, PageHeader, Pagination, Spinner } from '../components/ui'
import { api, mediaUrl } from '../lib/api'
import { fa, relative, toman } from '../lib/format'
import { ORDER_STATUS, ORDER_TONE, PAYMENT_METHOD, type OrderRow, type OrderStatus, type OrdersSummary } from '../lib/orders'
import { tableClass as t } from '../lib/table'
import type { Paged } from '../lib/types'

const FILTERS: (OrderStatus | '')[] = ['', 'AwaitingPayment', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

function timeLeft(iso: string) {
  const minutes = Math.floor((new Date(iso).getTime() - Date.now()) / 60000)
  if (minutes <= 0) return 'مهلت پرداخت تمام شده'
  return minutes < 60 ? `${fa(minutes)} دقیقه تا پایان مهلت` : `${fa(Math.floor(minutes / 60))} ساعت تا پایان مهلت`
}

export function OrdersPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') ?? '') as OrderStatus | ''
  const search = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 1) || 1
  const [q, setQ] = useState(search)

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v)
      else next.delete(k)
    }
    setParams(next)
  }

  const summary = useQuery({ queryKey: ['orders-summary'], queryFn: () => api.get<OrdersSummary>('/api/admin/orders/summary') })
  const query = new URLSearchParams({ page: String(page), pageSize: '20' })
  if (status) query.set('status', status)
  if (search) query.set('q', search)
  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', status, search, page],
    queryFn: () => api.get<Paged<OrderRow>>(`/api/admin/orders?${query}`),
    placeholderData: keepPreviousData,
  })

  const count = (s: OrderStatus | '') =>
    summary.data ? (s ? summary.data.byStatus[s] : Object.values(summary.data.byStatus).reduce((a, b) => a + b, 0)) : null

  return (
    <>
      <PageHeader
        title="سفارش‌ها"
        subtitle={summary.data ? `امروز ${fa(summary.data.todayCount)} سفارش به ارزش ${toman(summary.data.todayTotal)}` : undefined}
      />

      <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
        {FILTERS.map((s) => {
          const active = s === status
          const n = count(s)
          return (
            <button
              key={s || 'all'}
              type="button"
              onClick={() => update({ status: s, page: '' })}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold transition ${active ? 'bg-brand text-white' : 'bg-surface text-muted shadow-card hover:text-ink'}`}
            >
              {s ? ORDER_STATUS[s] : 'همه'}
              {n !== null && <span className={`rounded-md px-1.5 text-xs ${active ? 'bg-white/20' : 'bg-surface-2'}`}>{fa(n)}</span>}
            </button>
          )
        })}
      </div>

      <Card className="mb-4">
        <form className="flex gap-3" onSubmit={(e) => { e.preventDefault(); update({ q: q.trim(), page: '' }) }}>
          <div className="relative flex-1">
            <SearchIcon className="pointer-events-none absolute inset-y-0 start-3 my-auto size-[18px] text-muted" />
            <Input className="ps-10" placeholder="شماره سفارش (FS-100001)، موبایل یا نام مشتری" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary">جست‌وجو</Button>
        </form>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorText error={error} />
      ) : !data?.items.length ? (
        <Empty>{search || status ? 'سفارشی با این مشخصات پیدا نشد.' : 'هنوز سفارشی ثبت نشده است.'}</Empty>
      ) : (
        <div className={t.wrap}>
          <table className={`${t.table} min-w-[820px]`}>
            <thead className={t.head}>
              <tr>
                <th className={t.th}>سفارش</th>
                <th className={t.th}>مشتری</th>
                <th className={t.th}>مبلغ</th>
                <th className={t.th}>پرداخت</th>
                <th className={t.th}>وضعیت</th>
                <th className={t.th}>ثبت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((o) => (
                <tr key={o.id} className={t.row}>
                  <td className={t.td}>
                    <Link to={`/orders/${o.id}`} className="flex items-center gap-3">
                      {o.imageUrl ? <img src={mediaUrl(o.imageUrl) ?? ''} alt="" className="size-11 rounded-xl border border-line bg-white object-contain p-0.5" /> : <div className="size-11 rounded-xl bg-canvas" />}
                      <div>
                        <p className="ltr text-start font-black hover:text-brand">{o.code}</p>
                        <p className="text-xs text-muted">{fa(o.itemCount)} کالا</p>
                      </div>
                    </Link>
                  </td>
                  <td className={t.td}>
                    <p className="font-medium">{o.customerName ?? '—'}</p>
                    <p className="ltr text-start text-xs text-muted">{o.customerMobile}</p>
                  </td>
                  <td className={`${t.td} font-bold`}>{toman(o.total)}</td>
                  <td className={`${t.td} text-xs text-muted`}>{PAYMENT_METHOD[o.paymentMethod]}</td>
                  <td className={t.td}>
                    <Badge tone={ORDER_TONE[o.status]}>{ORDER_STATUS[o.status]}</Badge>
                    {o.status === 'AwaitingPayment' && o.paymentDueAt && (
                      <p className="mt-1 text-[11px] text-muted">{timeLeft(o.paymentDueAt)}</p>
                    )}
                  </td>
                  <td className={`${t.td} text-xs text-muted`}>{relative(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {data && <Pagination page={page} total={data.total} pageSize={data.pageSize} onChange={(p) => update({ page: String(p) })} />}
    </>
  )
}
