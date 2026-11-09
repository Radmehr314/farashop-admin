import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ImageUpload, Thumb } from '../components/ImageUpload'
import { Badge, Button, Card, Checkbox, Empty, ErrorText, Field, Input, Modal, PageHeader, Select, Spinner, Textarea } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { errorMessage, useConfirm, useToast } from '../lib/feedback'
import { fa } from '../lib/format'
import type { AttributeType, Category, CategoryAttribute } from '../lib/types'

type Form = Omit<Category, 'id' | 'productCount'>

const blank: Form = {
  parentId: null, name: '', slug: '', description: '', imageUrl: null, sortOrder: 0, isActive: true,
  metaTitle: '', metaDescription: '', attributes: [],
}

const TYPE_LABEL: Record<AttributeType, string> = { Text: 'متنی', Number: 'عددی', Boolean: 'بله/خیر', Select: 'انتخابی' }

function flatten(all: Category[], parentId: string | null = null, depth = 0): { c: Category; depth: number }[] {
  return all
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'fa'))
    .flatMap((c) => [{ c, depth }, ...flatten(all, c.id, depth + 1)])
}

function AttributeEditor({ value, onChange }: { value: CategoryAttribute[]; onChange: (v: CategoryAttribute[]) => void }) {
  const update = (i: number, patch: Partial<CategoryAttribute>) => onChange(value.map((a, idx) => (idx === i ? { ...a, ...patch } : a)))
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div className="space-y-3">
      {value.map((a, i) => (
        <div key={i} className="rounded-lg border border-line p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_120px_90px]">
            <Input placeholder="نام (مثلا تعداد اکانت SIP)" value={a.name} onChange={(e) => update(i, { name: e.target.value })} />
            <Input placeholder="کلید (sip_accounts)" className="ltr" value={a.key} onChange={(e) => update(i, { key: e.target.value.toLowerCase() })} />
            <Select value={a.type} onChange={(e) => update(i, { type: e.target.value as AttributeType })}>
              {Object.entries(TYPE_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
            <Input placeholder="واحد" value={a.unit ?? ''} onChange={(e) => update(i, { unit: e.target.value || null })} />
          </div>
          {a.type === 'Select' && (
            <Input
              className="mt-2"
              placeholder="گزینه‌ها، با کاما جدا کنید"
              value={a.options.join('،')}
              onChange={(e) => update(i, { options: e.target.value.split(/[,،]/).map((s) => s.trimStart()) })}
            />
          )}
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <Checkbox label="الزامی" checked={a.isRequired} onChange={(v) => update(i, { isRequired: v })} />
            <Checkbox label="قابل فیلتر" checked={a.isFilterable} onChange={(v) => update(i, { isFilterable: v })} />
            <div className="ms-auto flex gap-1">
              <Button variant="ghost" onClick={() => move(i, -1)} aria-label="بالا">↑</Button>
              <Button variant="ghost" onClick={() => move(i, 1)} aria-label="پایین">↓</Button>
              <Button variant="ghost" className="text-danger" onClick={() => onChange(value.filter((_, idx) => idx !== i))}>حذف</Button>
            </div>
          </div>
        </div>
      ))}
      <Button
        variant="secondary"
        onClick={() => onChange([...value, { key: '', name: '', type: 'Text', unit: null, options: [], isFilterable: false, isRequired: false, sortOrder: value.length }])}
      >
        افزودن ویژگی
      </Button>
    </div>
  )
}

export function CategoriesPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const { data, isLoading, error } = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/api/admin/catalog/categories') })
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null)
  const [formError, setFormError] = useState<ApiError | null>(null)

  const rows = useMemo(() => flatten(data ?? []), [data])

  const save = useMutation({
    mutationFn: (e: { id: string | null; form: Form }) =>
      e.id ? api.put<Category>(`/api/admin/catalog/categories/${e.id}`, e.form) : api.post<Category>('/api/admin/catalog/categories', e.form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['categories'] })
      toast('دسته ذخیره شد')
      setEditing(null)
    },
    onError: (e) => setFormError(e as ApiError),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/catalog/categories/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['categories'] })
      toast('دسته حذف شد')
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  const open = (c?: Category, parentId?: string) => {
    setFormError(null)
    setEditing(c ? { id: c.id, form: { ...c } } : { id: null, form: { ...blank, parentId: parentId ?? null } })
  }

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : e))
  const err = (k: string) => formError?.errors?.[k]?.[0]

  return (
    <>
      <PageHeader title="دسته‌بندی‌ها" actions={<Button onClick={() => open()}>دسته جدید</Button>} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorText error={error} />
      ) : rows.length === 0 ? (
        <Empty>هنوز دسته‌ای تعریف نشده است.</Empty>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {rows.map(({ c, depth }) => (
              <li key={c.id} className="flex items-center gap-3 py-2.5" style={{ paddingInlineStart: depth * 24 }}>
                {depth > 0 && <span className="text-muted">└</span>}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="ltr text-start text-xs text-muted">/{c.slug}</p>
                </div>
                <span className="text-xs text-muted">{fa(c.attributes.length)} ویژگی</span>
                <span className="text-xs text-muted">{fa(c.productCount)} کالا</span>
                {!c.isActive && <Badge tone="red">غیرفعال</Badge>}
                <Button variant="ghost" onClick={() => open(undefined, c.id)}>زیردسته</Button>
                <Button variant="secondary" onClick={() => open(c)}>ویرایش</Button>
                <Button variant="danger" onClick={async () => (await confirm({ title: `حذف دسته «${c.name}»`, message: 'این کار قابل بازگشت نیست.', confirmLabel: 'حذف', danger: true })) && remove.mutate(c.id)}>حذف</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!editing} wide title={editing?.id ? 'ویرایش دسته' : 'دسته جدید'} onClose={() => setEditing(null)}>
        {editing && (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              save.mutate(editing)
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نام دسته" error={err('name')}>
                <Input value={editing.form.name} onChange={(e) => set('name', e.target.value)} autoFocus />
              </Field>
              <Field label="نامک (URL)" hint="خالی بگذارید تا خودکار ساخته شود">
                <Input className="ltr" value={editing.form.slug ?? ''} onChange={(e) => set('slug', e.target.value)} />
              </Field>
              <Field label="دسته والد" error={err('parentId')}>
                <Select value={editing.form.parentId ?? ''} onChange={(e) => set('parentId', e.target.value || null)}>
                  <option value="">بدون والد (دسته اصلی)</option>
                  {rows.filter(({ c }) => c.id !== editing.id).map(({ c, depth }) => (
                    <option key={c.id} value={c.id}>{'— '.repeat(depth)}{c.name}</option>
                  ))}
                </Select>
              </Field>
              <Field label="ترتیب نمایش">
                <Input type="number" value={editing.form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />
              </Field>
            </div>
            <Field label="توضیحات">
              <Textarea rows={2} value={editing.form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <div className="flex items-end gap-4">
              {editing.form.imageUrl ? (
                <Thumb url={editing.form.imageUrl} onRemove={() => set('imageUrl', null)} />
              ) : (
                <ImageUpload label="تصویر دسته" onUploaded={(url) => set('imageUrl', url)} />
              )}
              <Checkbox label="فعال" checked={editing.form.isActive} onChange={(v) => set('isActive', v)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="عنوان سئو"><Input value={editing.form.metaTitle ?? ''} onChange={(e) => set('metaTitle', e.target.value)} /></Field>
              <Field label="توضیحات سئو"><Input value={editing.form.metaDescription ?? ''} onChange={(e) => set('metaDescription', e.target.value)} /></Field>
            </div>
            <div>
              <p className="mb-2 text-sm font-bold">ویژگی‌های اختصاصی دسته</p>
              {err('attributes') && <p className="mb-2 text-xs text-danger">{err('attributes')}</p>}
              <AttributeEditor value={editing.form.attributes} onChange={(v) => set('attributes', v)} />
            </div>
            {formError && !formError.errors && <ErrorText error={formError} />}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>انصراف</Button>
              <Button type="submit" disabled={save.isPending}>{save.isPending ? 'در حال ذخیره...' : 'ذخیره'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
