import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { PrintIcon } from '../components/Icons'
import { Badge, Button, Card, ErrorText, Field, Input, Modal, PageHeader, Spinner, Textarea } from '../components/ui'
import { api, ApiError, mediaUrl, STORE_URL } from '../lib/api'
import { errorMessage, useToast } from '../lib/feedback'
import { date, fa, toman } from '../lib/format'
import { ACTION_LABEL, addressText, faDigits, ORDER_STATUS, ORDER_TONE, PAYMENT_METHOD, type Order, type OrderStatus } from '../lib/orders'

type Form = { note: string; paymentReference: string; trackingCode: string; carrier: string }

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-2 text-sm">
      <dt className="shrink-0 text-muted">{label}</dt>
      <dd className="text-end font-medium">{children}</dd>
    </div>
  )
}

function TransitionModal({ order, to, onClose }: { order: Order; to: OrderStatus; onClose: () => void }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState<Form>({
    note: '',
    paymentReference: order.paymentReport?.reference ?? '',
    trackingCode: '',
    carrier: order.shipping.name,
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const set = (k: keyof Form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const run = useMutation({
    mutationFn: () => api.post<Order>(`/api/admin/orders/${order.id}/transition`, { to, ...form }),
    onSuccess: (updated) => {
      qc.setQueryData(['order', order.id], updated)
      void qc.invalidateQueries({ queryKey: ['orders'] })
      void qc.invalidateQueries({ queryKey: ['orders-summary'] })
      toast(`وضعیت سفارش به «${ORDER_STATUS[to]}» تغییر کرد`, 'success')
      onClose()
    },
    onError: (e) => {
      if (e instanceof ApiError && e.errors) setErrors(e.errors)
      else toast(errorMessage(e), 'error')
    },
  })

  const err = (k: string) => errors[k]?.[0]
  const cancelling = to === 'Cancelled'

  return (
    <Modal open title={ACTION_LABEL[to]} onClose={onClose}>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run.mutate() }}>
        {to === 'Paid' && (
          <Field label="شماره پیگیری واریز" error={err('paymentReference')} hint={order.paymentReport ? `ثبت‌شده توسط مشتری در ${date(order.paymentReport.at)}${order.paymentReport.cardLast4 ? ` · کارت مبدا **** ${order.paymentReport.cardLast4}` : ''}${order.paymentReport.note ? ` · ${order.paymentReport.note}` : ''}` : undefined}>
            <Input className="ltr" value={form.paymentReference} onChange={set('paymentReference')} autoFocus />
          </Field>
        )}
        {to === 'Shipped' && (
          <>
            <Field label="کد رهگیری مرسوله" error={err('trackingCode')}>
              <Input className="ltr" value={form.trackingCode} onChange={set('trackingCode')} autoFocus />
            </Field>
            <Field label="شرکت حمل" error={err('carrier')}>
              <Input value={form.carrier} onChange={set('carrier')} />
            </Field>
          </>
        )}
        <Field label={cancelling ? 'دلیل لغو (برای مشتری پیامک می‌شود)' : 'توضیح (اختیاری)'} error={err('note')}>
          <Textarea rows={3} value={form.note} onChange={set('note')} autoFocus={to === 'Processing' || to === 'Delivered' || cancelling} />
        </Field>
        {err('to') && <p className="text-sm text-danger">{err('to')}</p>}
        {cancelling && <p className="rounded-xl bg-danger/10 p-3 text-xs leading-6 text-danger">با لغو سفارش، موجودی کالاها به انبار برمی‌گردد.</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>انصراف</Button>
          <Button type="submit" variant={cancelling ? 'dangerSolid' : 'primary'} disabled={run.isPending}>
            {run.isPending ? 'در حال ثبت...' : ACTION_LABEL[to]}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function AdminNote({ order }: { order: Order }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [note, setNote] = useState(order.adminNote ?? '')
  const save = useMutation({
    mutationFn: () => api.put<Order>(`/api/admin/orders/${order.id}/note`, { note }),
    onSuccess: (updated) => {
      qc.setQueryData(['order', order.id], updated)
      toast('یادداشت ذخیره شد', 'success')
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })
  return (
    <Card title="یادداشت داخلی" subtitle="فقط برای کارکنان نمایش داده می‌شود">
      <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="مثلا هماهنگی تلفنی انجام شد" />
      <Button variant="secondary" className="mt-3" disabled={save.isPending || note === (order.adminNote ?? '')} onClick={() => save.mutate()}>
        ذخیره یادداشت
      </Button>
    </Card>
  )
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const [action, setAction] = useState<OrderStatus | null>(null)
  const { data: order, isLoading, error } = useQuery({ queryKey: ['order', id], queryFn: () => api.get<Order>(`/api/admin/orders/${id}`) })

  if (isLoading) return <Spinner />
  if (error || !order) return <ErrorText error={error ?? new Error('سفارش یافت نشد')} />

  const c = order.customer
  const forward = order.nextStatuses.filter((s) => s !== 'Cancelled')

  return (
    <>
      <PageHeader
        title={`سفارش ${order.code}`}
        subtitle={`ثبت‌شده در ${date(order.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            {order.status !== 'Cancelled' && (
              <>
                <a href={`/orders/${order.id}/invoice`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold hover:border-brand/40 hover:text-brand">
                  <PrintIcon className="size-4" /> {order.status === 'AwaitingPayment' ? 'پیش‌فاکتور' : 'فاکتور'}
                </a>
                <a href={`/orders/${order.id}/label`} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-bold hover:border-brand/40 hover:text-brand">
                  <PrintIcon className="size-4" /> برچسب ارسال
                </a>
              </>
            )}
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge tone={ORDER_TONE[order.status]}>{ORDER_STATUS[order.status]}</Badge>
                <span className="text-sm text-muted">{PAYMENT_METHOD[order.paymentMethod]}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {forward.map((s) => (
                  <Button key={s} onClick={() => setAction(s)}>{ACTION_LABEL[s]}</Button>
                ))}
                {order.canCancel && <Button variant="danger" onClick={() => setAction('Cancelled')}>لغو سفارش</Button>}
              </div>
            </div>
            {order.status === 'AwaitingPayment' && (
              order.paymentReport ? (
                <div className="mt-4 rounded-xl border border-brand/25 bg-brand-soft p-4 text-sm">
                  <p className="font-bold">مشتری واریز را ثبت کرده است · {date(order.paymentReport.at)}</p>
                  <dl className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div><dt className="text-xs text-muted">مبلغ مورد انتظار</dt><dd className="mt-0.5 font-black">{toman(order.total)}</dd></div>
                    <div><dt className="text-xs text-muted">شماره پیگیری</dt><dd className="ltr mt-0.5 text-start font-black tracking-wide">{order.paymentReference ?? order.paymentReport.reference}</dd></div>
                    <div><dt className="text-xs text-muted">۴ رقم آخر کارت مبدا</dt><dd className="ltr mt-0.5 text-start font-black tracking-widest">{order.paymentReport.cardLast4 ? `**** ${order.paymentReport.cardLast4}` : '—'}</dd></div>
                  </dl>
                  {order.paymentReport.note && <p className="mt-3 border-t border-brand/15 pt-3 text-muted">توضیح مشتری: <span className="text-ink">{order.paymentReport.note}</span></p>}
                  <p className="mt-3 text-xs text-muted">مبلغ، شماره پیگیری و کارت مبدا را با صورتحساب بانک تطبیق دهید و سپس پرداخت را تایید کنید.</p>
                </div>
              ) : (
                <p className="mt-4 rounded-xl bg-sun-soft p-3 text-sm leading-7 text-sun-ink">
                  منتظر واریز مشتری{order.paymentDueAt && <> تا {date(order.paymentDueAt)}</>}. بعد از این مهلت سفارش خودکار لغو می‌شود.
                </p>
              )
            )}
            {order.status === 'Cancelled' && <p className="mt-4 rounded-xl bg-danger/10 p-3 text-sm text-danger">{order.cancelReason}</p>}
          </Card>

          <Card title="کالاها" flush>
            <ul className="divide-y divide-line">
              {order.lines.map((l) => (
                <li key={l.variantId} className="flex items-center gap-4 px-5 py-3">
                  {l.imageUrl ? <img src={mediaUrl(l.imageUrl) ?? ''} alt="" className="size-14 rounded-xl border border-line bg-white object-contain p-1" /> : <div className="size-14 rounded-xl bg-canvas" />}
                  <div className="min-w-0 flex-1">
                    <a href={`${STORE_URL}/product/${l.productSlug}`} target="_blank" rel="noreferrer" className="line-clamp-2 text-sm font-bold hover:text-brand">{l.title}</a>
                    <p className="mt-0.5 text-xs text-muted">{l.variantName} · <span className="ltr inline-block">{l.sku}</span>{l.warranty && ` · ${l.warranty}`}</p>
                  </div>
                  <div className="text-end text-sm">
                    <p className="text-muted">{fa(l.quantity)} × {toman(l.unitPrice)}</p>
                    <p className="font-black">{toman(l.lineTotal)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <dl className="border-t border-line px-5 py-3">
              <Row label="جمع کالاها">{toman(order.subtotal)}</Row>
              <Row label={`هزینه ارسال · ${order.shipping.name}`}>{order.shippingCost ? toman(order.shippingCost) : 'رایگان'}</Row>
              <Row label="مبلغ کل"><span className="text-base font-black">{toman(order.total)}</span></Row>
            </dl>
          </Card>

          <Card title="تاریخچه">
            <ol className="space-y-3 border-s-2 border-brand/20 ps-4">
              {[...order.history].reverse().map((h, i) => (
                <li key={i} className="relative text-sm">
                  <span className="absolute -start-[23px] top-1.5 size-3 rounded-full bg-brand ring-4 ring-surface" />
                  <b>{ORDER_STATUS[h.status]}</b> <span className="text-xs text-muted">· {date(h.at)} · {h.by === 'customer' ? 'مشتری' : h.by === 'system' ? 'سیستم' : h.by}</span>
                  {h.note && <p className="mt-0.5 text-xs text-muted">{h.note}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="مشتری">
            <dl className="divide-y divide-line">
              {c.isLegal && <Row label="شرکت">{c.companyName}</Row>}
              {c.isLegal && <Row label="شناسه ملی"><span className="ltr">{c.companyNationalId}</span></Row>}
              {c.isLegal && c.economicCode && <Row label="کد اقتصادی"><span className="ltr">{c.economicCode}</span></Row>}
              <Row label="نام">{c.fullName || '—'}</Row>
              <Row label="موبایل"><a href={`tel:${c.mobile}`} className="ltr text-brand">{c.mobile}</a></Row>
              {c.nationalCode && <Row label="کد ملی"><span className="ltr">{c.nationalCode}</span></Row>}
              {c.email && <Row label="ایمیل"><span className="ltr">{c.email}</span></Row>}
            </dl>
          </Card>
          <Card title="تحویل">
            <p className="text-sm leading-7">{addressText(order.address)}</p>
            <dl className="mt-2 divide-y divide-line">
              <Row label="کد پستی"><span className="ltr">{faDigits(order.address.postalCode)}</span></Row>
              <Row label="تحویل‌گیرنده">{order.address.recipientName}</Row>
              <Row label="تلفن"><a href={`tel:${order.address.recipientMobile}`} className="ltr text-brand">{order.address.recipientMobile}</a></Row>
              {order.trackingCode && <Row label="رهگیری"><span className="ltr">{order.trackingCode}</span> · {order.carrier}</Row>}
            </dl>
            {order.customerNote && <p className="mt-3 rounded-xl bg-surface-2 p-3 text-sm"><span className="text-muted">توضیح مشتری:</span> {order.customerNote}</p>}
          </Card>
          <Card title="پرداخت">
            <dl className="divide-y divide-line">
              <Row label="روش">{PAYMENT_METHOD[order.paymentMethod]}</Row>
              <Row label="وضعیت">{order.paidAt ? `پرداخت‌شده · ${date(order.paidAt)}` : 'پرداخت‌نشده'}</Row>
              {(order.paymentReference ?? order.paymentReport?.reference) && <Row label="شماره پیگیری"><span className="ltr">{order.paymentReference ?? order.paymentReport?.reference}</span></Row>}
              {order.paymentReport?.cardLast4 && <Row label="کارت مبدا"><span className="ltr">**** {order.paymentReport.cardLast4}</span></Row>}
              {order.paymentReport && !order.paidAt && <Row label="اعلام واریز">{date(order.paymentReport.at)}</Row>}
            </dl>
          </Card>
          <AdminNote key={order.adminNote ?? ''} order={order} />
          <Link to="/orders" className="block text-center text-sm font-bold text-brand">بازگشت به سفارش‌ها</Link>
        </div>
      </div>

      {action && <TransitionModal order={order} to={action} onClose={() => setAction(null)} />}
    </>
  )
}
