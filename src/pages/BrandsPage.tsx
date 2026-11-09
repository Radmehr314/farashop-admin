import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ImageUpload, Thumb } from '../components/ImageUpload'
import { Badge, Button, Card, Checkbox, Empty, ErrorText, Field, Input, Modal, PageHeader, Spinner, Textarea } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { errorMessage, useConfirm, useToast } from '../lib/feedback'
import type { Brand } from '../lib/types'

type Form = Omit<Brand, 'id'>
const blank: Form = { name: '', englishName: '', slug: '', logoUrl: null, description: '', isActive: true }

export function BrandsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const confirm = useConfirm()
  const { data, isLoading, error } = useQuery({ queryKey: ['brands'], queryFn: () => api.get<Brand[]>('/api/admin/catalog/brands') })
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null)
  const [formError, setFormError] = useState<ApiError | null>(null)

  const save = useMutation({
    mutationFn: (e: { id: string | null; form: Form }) =>
      e.id ? api.put<Brand>(`/api/admin/catalog/brands/${e.id}`, e.form) : api.post<Brand>('/api/admin/catalog/brands', e.form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['brands'] })
      toast('برند ذخیره شد')
      setEditing(null)
    },
    onError: (e) => setFormError(e as ApiError),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/api/admin/catalog/brands/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['brands'] })
      toast('برند حذف شد')
    },
    onError: (e) => toast(errorMessage(e), 'error'),
  })

  const set = <K extends keyof Form>(key: K, value: Form[K]) => setEditing((e) => (e ? { ...e, form: { ...e.form, [key]: value } } : e))

  return (
    <>
      <PageHeader title="برندها" actions={<Button onClick={() => { setFormError(null); setEditing({ id: null, form: blank }) }}>برند جدید</Button>} />
      {isLoading ? (
        <Spinner />
      ) : error ? (
        <ErrorText error={error} />
      ) : !data?.length ? (
        <Empty>هنوز برندی ثبت نشده است.</Empty>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {data.map((b) => (
              <li key={b.id} className="flex items-center gap-3 py-2.5">
                {b.logoUrl ? <Thumb url={b.logoUrl} size="size-10" /> : <div className="size-10 rounded-lg bg-canvas" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{b.name} {b.englishName && <span className="text-sm text-muted">({b.englishName})</span>}</p>
                  <p className="ltr text-start text-xs text-muted">/{b.slug}</p>
                </div>
                {!b.isActive && <Badge tone="red">غیرفعال</Badge>}
                <Button variant="secondary" onClick={() => { setFormError(null); setEditing({ id: b.id, form: { ...b } }) }}>ویرایش</Button>
                <Button variant="danger" onClick={async () => (await confirm({ title: `حذف برند «${b.name}»`, message: 'این کار قابل بازگشت نیست.', confirmLabel: 'حذف', danger: true })) && remove.mutate(b.id)}>حذف</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal open={!!editing} title={editing?.id ? 'ویرایش برند' : 'برند جدید'} onClose={() => setEditing(null)}>
        {editing && (
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); save.mutate(editing) }}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="نام فارسی" error={formError?.errors?.name?.[0]}>
                <Input autoFocus value={editing.form.name} onChange={(e) => set('name', e.target.value)} />
              </Field>
              <Field label="نام انگلیسی">
                <Input className="ltr" value={editing.form.englishName ?? ''} onChange={(e) => set('englishName', e.target.value)} />
              </Field>
            </div>
            <Field label="نامک (URL)" hint="خالی بگذارید تا از نام انگلیسی ساخته شود">
              <Input className="ltr" value={editing.form.slug} onChange={(e) => set('slug', e.target.value)} />
            </Field>
            <Field label="توضیحات">
              <Textarea rows={2} value={editing.form.description ?? ''} onChange={(e) => set('description', e.target.value)} />
            </Field>
            <div className="flex items-end gap-4">
              {editing.form.logoUrl ? <Thumb url={editing.form.logoUrl} onRemove={() => set('logoUrl', null)} /> : <ImageUpload label="لوگو" onUploaded={(u) => set('logoUrl', u)} />}
              <Checkbox label="فعال" checked={editing.form.isActive} onChange={(v) => set('isActive', v)} />
            </div>
            {formError && !formError.errors && <ErrorText error={formError} />}
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Button variant="secondary" onClick={() => setEditing(null)}>انصراف</Button>
              <Button type="submit" disabled={save.isPending}>ذخیره</Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
