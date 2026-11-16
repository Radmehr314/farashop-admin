import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { useParams } from 'react-router'
import { PrintIcon } from '../components/Icons'
import { Button, ErrorText, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { fa } from '../lib/format'
import { addressText, faDate, faDigits, PAYMENT_METHOD, type Invoice, type Order } from '../lib/orders'

const ink = 'text-[#1e1526]'
const line = 'border-[#d9d2e0]'

function PrintShell({ page, children }: { page: string; children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    const wasDark = root.classList.contains('dark')
    root.classList.remove('dark')
    return () => {
      if (wasDark) root.classList.add('dark')
    }
  }, [])
  return (
    <div className={`min-h-screen bg-[#f4f2f6] p-4 print:bg-white print:p-0 ${ink}`}>
      <style>{`@page { size: ${page}; margin: ${page === 'A4' ? '12mm' : '3mm'}; } @media print { .no-print { display: none !important; } * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }`}</style>
      <div className="no-print mx-auto mb-4 flex max-w-[210mm] justify-end">
        <Button onClick={() => window.print()}><PrintIcon className="size-4" /> چاپ</Button>
      </div>
      {children}
    </div>
  )
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={`overflow-hidden rounded-xl border ${line}`}>
      <h2 className="bg-[#f1e7f8] px-3 py-1.5 text-[12px] font-black">{title}</h2>
      <div className="p-3 text-[12px]">{children}</div>
    </section>
  )
}

function Pairs({ rows }: { rows: [string, string | null | undefined][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-1.5">
      {rows.filter(([, v]) => v).map(([k, v]) => (
        <div key={k} className={`flex gap-2 ${k === 'نشانی' ? 'col-span-2' : ''}`}>
          <dt className="shrink-0 text-[#6e6578]">{k}:</dt>
          <dd className="font-medium">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export function InvoicePrintPage() {
  const { id = '' } = useParams()
  const { data: inv, error, isLoading } = useQuery({ queryKey: ['invoice', id], queryFn: () => api.get<Invoice>(`/api/admin/orders/${id}/invoice`) })
  if (isLoading) return <Spinner />
  if (error || !inv) return <ErrorText error={error} />

  const proforma = inv.kind === 'Proforma'
  const s = inv.seller
  const b = inv.buyer
  const address = addressText(inv.address)
  const cell = `border ${line} px-1.5 py-1.5 text-center`

  return (
    <PrintShell page="A4">
      <article className="mx-auto max-w-[210mm] bg-white p-8 shadow-sm print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-2 border-[#5d1e79] pb-4">
          <div>
            <p className="text-2xl font-black text-[#5d1e79]">{s.name}</p>
            {s.legalName && <p className="mt-1 text-xs text-[#6e6578]">{s.legalName}</p>}
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black">{proforma ? 'پیش‌فاکتور فروش' : 'صورتحساب فروش کالا و خدمات'}</h1>
            {proforma && <p className="mt-1 text-[11px] text-[#6e6578]">پس از تایید پرداخت به فاکتور رسمی تبدیل می‌شود</p>}
          </div>
          <dl className="text-[12px]">
            <div className="flex gap-2"><dt className="text-[#6e6578]">شماره:</dt><dd className="ltr font-bold">{inv.code}</dd></div>
            <div className="mt-1 flex gap-2"><dt className="text-[#6e6578]">تاریخ:</dt><dd className="font-bold">{faDate(inv.issuedAt)}</dd></div>
            {inv.validUntil && <div className="mt-1 flex gap-2"><dt className="text-[#6e6578]">اعتبار تا:</dt><dd className="font-bold">{faDate(inv.validUntil)}</dd></div>}
          </dl>
        </header>

        <div className="mt-4 space-y-3">
          <Box title="مشخصات فروشنده">
            <Pairs rows={[['نام', s.legalName || s.name], ['شناسه ملی', s.nationalId], ['کد اقتصادی', s.economicCode], ['شماره ثبت', s.registrationNumber], ['تلفن', s.phone], ['کد پستی', s.postalCode], ['نشانی', s.address]]} />
          </Box>
          <Box title="مشخصات خریدار">
            <Pairs
              rows={b.isLegal
                ? [['نام شرکت', b.companyName], ['شناسه ملی', b.companyNationalId], ['کد اقتصادی', b.economicCode], ['نماینده', b.fullName], ['تلفن', b.mobile], ['کد پستی', faDigits(inv.address.postalCode)], ['نشانی', address]]
                : [['نام', b.fullName], ['کد ملی', b.nationalCode], ['تلفن', b.mobile], ['کد پستی', faDigits(inv.address.postalCode)], ['نشانی', address]]}
            />
          </Box>
        </div>

        <table className="mt-4 w-full border-collapse text-[11.5px]">
          <thead className="bg-[#f1e7f8] font-black">
            <tr>
              <th className={cell}>ردیف</th><th className={cell}>کد کالا</th><th className={`${cell} w-[34%]`}>شرح کالا یا خدمات</th><th className={cell}>تعداد</th>
              <th className={cell}>مبلغ واحد با مالیات</th><th className={cell}>مبلغ کل بدون مالیات</th><th className={cell}>مالیات و عوارض ({fa(inv.vatRate)}٪)</th><th className={cell}>جمع کل</th>
            </tr>
          </thead>
          <tbody>
            {inv.lines.map((l) => (
              <tr key={l.row}>
                <td className={cell}>{fa(l.row)}</td><td className={`${cell} ltr whitespace-nowrap`}>{l.sku}</td><td className={`${cell} text-start`}>{l.title}</td><td className={cell}>{fa(l.quantity)}</td>
                <td className={cell}>{fa(l.unitPrice)}</td><td className={cell}>{fa(l.net)}</td><td className={cell}>{fa(l.vat)}</td><td className={`${cell} font-bold`}>{fa(l.total)}</td>
              </tr>
            ))}
            {inv.shippingCost > 0 && (
              <tr>
                <td className={cell}>{fa(inv.lines.length + 1)}</td><td className={cell}>—</td><td className={`${cell} text-start`}>هزینه ارسال ({inv.shippingName})</td><td className={cell}>۱</td>
                <td className={cell}>{fa(inv.shippingCost)}</td><td className={cell}>{fa(inv.shippingNet)}</td><td className={cell}>{fa(inv.shippingVat)}</td><td className={`${cell} font-bold`}>{fa(inv.shippingCost)}</td>
              </tr>
            )}
          </tbody>
          <tfoot className="bg-[#faf8fb] font-bold">
            <tr>
              <td className={`${cell} text-start`} colSpan={5}>جمع کل (ریال)</td><td className={cell}>{fa(inv.net)}</td><td className={cell}>{fa(inv.vat)}</td><td className={`${cell} font-black`}>{fa(inv.total)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-3 flex flex-wrap justify-between gap-3 text-[12px]">
          <p>معادل <b>{fa(Math.floor(inv.total / 10))}</b> تومان · قیمت‌ها شامل مالیات بر ارزش افزوده است.</p>
          <p>روش پرداخت: <b>{PAYMENT_METHOD[inv.paymentMethod]}</b>{inv.paymentReference && <> · شماره پیگیری: <b className="ltr inline-block">{inv.paymentReference}</b></>}</p>
        </div>

        {proforma && inv.bankTransfer && (
          <div className="mt-4">
            <Box title="اطلاعات واریز">
              <Pairs rows={[['بانک', inv.bankTransfer.bankName], ['به نام', inv.bankTransfer.accountHolder], ['شماره کارت', inv.bankTransfer.cardNumber], ['شماره شبا', inv.bankTransfer.sheba]]} />
            </Box>
          </div>
        )}

        <footer className="mt-10 grid grid-cols-2 gap-6 text-center text-[12px]">
          <div className={`h-24 rounded-xl border border-dashed ${line} pt-3`}>مهر و امضای فروشنده</div>
          <div className={`h-24 rounded-xl border border-dashed ${line} pt-3`}>مهر و امضای خریدار</div>
        </footer>
      </article>
    </PrintShell>
  )
}

export function ShippingLabelPage() {
  const { id = '' } = useParams()
  const { data: order, error, isLoading } = useQuery({ queryKey: ['order', id], queryFn: () => api.get<Order>(`/api/admin/orders/${id}`) })
  const seller = useQuery({ queryKey: ['invoice', id], queryFn: () => api.get<Invoice>(`/api/admin/orders/${id}/invoice`), enabled: !!order && order.status !== 'Cancelled' })
  if (isLoading) return <Spinner />
  if (error || !order) return <ErrorText error={error} />

  const a = order.address
  const s = seller.data?.seller
  const collect = order.paymentMethod === 'CashOnDelivery' && !order.paidAt
  const items = order.lines.reduce((n, l) => n + l.quantity, 0)

  return (
    <PrintShell page="100mm 150mm">
      <article className={`mx-auto flex h-[144mm] w-[94mm] flex-col rounded-lg border-2 border-[#1e1526] bg-white text-[12px] print:rounded-none`}>
        <header className="flex items-center justify-between border-b-2 border-[#1e1526] px-3 py-2">
          <span className="text-lg font-black text-[#5d1e79]">فراشاپ</span>
          <span className="ltr text-xl font-black">{order.code}</span>
        </header>
        <section className="border-b border-dashed border-[#1e1526] px-3 py-2">
          <p className="text-[10px] font-bold text-[#6e6578]">فرستنده</p>
          <p className="font-bold">{s?.legalName || s?.name || 'فراشاپ'}</p>
          {s?.address && <p className="leading-5">{faDigits(s.address)}</p>}
          {s?.phone && <p className="ltr text-start">{s.phone}</p>}
        </section>
        <section className="flex-1 px-3 py-3">
          <p className="text-[10px] font-bold text-[#6e6578]">گیرنده</p>
          <p className="mt-1 text-lg font-black">{a.recipientName}</p>
          <p className="ltr text-start text-base font-bold">{a.recipientMobile}</p>
          <p className="mt-2 text-[13px] leading-6">{addressText(a)}</p>
          <p className="mt-3 text-[10px] font-bold text-[#6e6578]">کد پستی</p>
          <p className="ltr text-start text-2xl font-black tracking-[0.2em]">{a.postalCode}</p>
        </section>
        <footer className="grid grid-cols-2 border-t-2 border-[#1e1526] text-center">
          <div className="border-e border-[#1e1526] px-2 py-2">
            <p className="text-[10px] text-[#6e6578]">روش ارسال</p>
            <p className="font-bold">{order.shipping.name}</p>
          </div>
          <div className="px-2 py-2">
            <p className="text-[10px] text-[#6e6578]">تعداد اقلام</p>
            <p className="font-bold">{fa(items)}</p>
          </div>
          <div className={`col-span-2 border-t border-[#1e1526] px-2 py-2 ${collect ? 'bg-[#1e1526] text-white' : ''}`}>
            {collect ? <p className="font-black">دریافت در محل: {fa(Math.floor(order.total / 10))} تومان</p> : <p className="font-bold">پرداخت‌شده · {faDate(order.createdAt)}</p>}
          </div>
        </footer>
      </article>
    </PrintShell>
  )
}
