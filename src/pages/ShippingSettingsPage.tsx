import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { PlusIcon } from '../components/Icons'
import { Button, Card, Checkbox, ErrorText, Field, Input, PageHeader, Spinner } from '../components/ui'
import { api } from '../lib/api'
import { errorMessage, useToast } from '../lib/feedback'
import { fa } from '../lib/format'
import type { ShippingMethod, ShippingSettings } from '../lib/orders'
import { useSession } from '../lib/useSession'

const toToman = (rial: number) => String(Math.floor(rial / 10))
const toRial = (toman: string) => Math.max(0, Number(toman.replace(/[^\d]/g, '')) || 0) * 10

function Editor({ initial, canEdit }: { initial: ShippingSettings; canEdit: boolean }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [threshold, setThreshold] = useState(toToman(initial.freeShippingThreshold))
  const [methods, setMethods] = useState<ShippingMethod[]>(initial.methods)

  const patch = (i: number, p: Partial<ShippingMethod>) => setMethods((m) => m.map((x, j) => (j === i ? { ...x, ...p } : x)))
  const save = useMutation({
    mutationFn: () => api.put<ShippingSettings>('/api/admin/ordering/shipping', { freeShippingThreshold: toRial(threshold), methods }),
    onSuccess: (data) => {
      qc.setQueryData(['shipping-settings'], data)
      toast('روش‌های ارسال ذخیره شد', 'success')
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  return (
    <div className="space-y-4">
      <Card title="ارسال رایگان">
        <Field label="سقف ارسال رایگان (تومان)" hint="برای سفارش‌های بالاتر از این مبلغ، روش‌هایی که «رایگان بالای سقف» دارند هزینه ندارند. صفر یعنی غیرفعال.">
          <Input className="ltr max-w-xs" inputMode="numeric" value={threshold} disabled={!canEdit} onChange={(e) => setThreshold(e.target.value)} />
        </Field>
        <p className="mt-2 text-xs text-muted">{Number(threshold) > 0 ? `فعلا: ${fa(Number(threshold))} تومان` : 'ارسال رایگان غیرفعال است'}</p>
      </Card>

      {methods.map((m, i) => (
        <Card key={i} title={m.name || 'روش جدید'} subtitle={m.code}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="نام نمایشی"><Input value={m.name} disabled={!canEdit} onChange={(e) => patch(i, { name: e.target.value })} /></Field>
            <Field label="کد (انگلیسی، یکتا)"><Input className="ltr" value={m.code} disabled={!canEdit} onChange={(e) => patch(i, { code: e.target.value })} /></Field>
            <Field label="هزینه (تومان)"><Input className="ltr" inputMode="numeric" value={toToman(m.cost)} disabled={!canEdit} onChange={(e) => patch(i, { cost: toRial(e.target.value) })} /></Field>
            <Field label="زمان تحویل"><Input value={m.estimatedDelivery ?? ''} disabled={!canEdit} onChange={(e) => patch(i, { estimatedDelivery: e.target.value })} placeholder="مثلا ۲ تا ۳ روز کاری" /></Field>
            <Field label="توضیح" className="md:col-span-2"><Input value={m.description ?? ''} disabled={!canEdit} onChange={(e) => patch(i, { description: e.target.value })} /></Field>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
            <Checkbox label="فعال" checked={m.isActive} onChange={(v) => canEdit && patch(i, { isActive: v })} />
            <Checkbox label="فقط استان تهران" checked={m.tehranOnly} onChange={(v) => canEdit && patch(i, { tehranOnly: v })} />
            <Checkbox label="امکان پرداخت در محل" checked={m.allowsCashOnDelivery} onChange={(v) => canEdit && patch(i, { allowsCashOnDelivery: v })} />
            <Checkbox label="رایگان بالای سقف" checked={m.freeOverThreshold} onChange={(v) => canEdit && patch(i, { freeOverThreshold: v })} />
          </div>
          {canEdit && methods.length > 1 && (
            <Button variant="danger" className="mt-4" onClick={() => setMethods((list) => list.filter((_, j) => j !== i))}>حذف این روش</Button>
          )}
        </Card>
      ))}

      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setMethods((m) => [...m, { code: `method-${m.length + 1}`, name: '', description: null, cost: 0, estimatedDelivery: null, tehranOnly: false, allowsCashOnDelivery: false, freeOverThreshold: true, isActive: true, sortOrder: m.length + 1 }])}>
            <PlusIcon className="size-4" /> افزودن روش ارسال
          </Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</Button>
        </div>
      )}
    </div>
  )
}

export function ShippingSettingsPage() {
  const session = useSession()
  const canEdit = !!session?.user.roles.includes('Admin')
  const { data, isLoading, error } = useQuery({ queryKey: ['shipping-settings'], queryFn: () => api.get<ShippingSettings>('/api/admin/ordering/shipping') })

  return (
    <>
      <PageHeader title="روش‌های ارسال" subtitle={canEdit ? 'هزینه و شرایط هر روش در صفحه پرداخت مشتری اعمال می‌شود' : 'فقط مدیر می‌تواند این بخش را تغییر دهد'} />
      {isLoading ? <Spinner /> : error || !data ? <ErrorText error={error} /> : <Editor initial={data} canEdit={canEdit} />}
    </>
  )
}
