import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ImageUpload, Thumb } from '../components/ImageUpload'
import { Badge, Button, Card, Checkbox, ErrorText, Field, Input, PageHeader, Select, Spinner, Textarea } from '../components/ui'
import { api, ApiError } from '../lib/api'
import { fa, STATUS_LABEL } from '../lib/format'
import type { Brand, Category, CategoryAttribute, Product, ProductImage, ProductStatus, SpecValue, Variant } from '../lib/types'

type Form = {
  categoryId: string
  brandId: string | null
  title: string
  englishTitle: string
  slug: string
  summary: string
  description: string
  status: ProductStatus
  faraTamasCompatible: boolean
  metaTitle: string
  metaDescription: string
  specs: SpecValue[]
  images: ProductImage[]
}

const blank: Form = {
  categoryId: '', brandId: null, title: '', englishTitle: '', slug: '', summary: '', description: '', status: 'Draft',
  faraTamasCompatible: false, metaTitle: '', metaDescription: '', specs: [], images: [],
}

function fromProduct(p: Product): Form {
  return {
    categoryId: p.categoryId, brandId: p.brandId, title: p.title, englishTitle: p.englishTitle ?? '', slug: p.slug,
    summary: p.summary ?? '', description: p.description ?? '', status: p.status, faraTamasCompatible: p.faraTamasCompatible,
    metaTitle: p.metaTitle ?? '', metaDescription: p.metaDescription ?? '', specs: p.specs, images: p.images,
  }
}

function SpecInput({ attr, value, onChange }: { attr: CategoryAttribute; value: string; onChange: (v: string) => void }) {
  if (attr.type === 'Boolean')
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        <option value="دارد">دارد</option>
        <option value="ندارد">ندارد</option>
      </Select>
    )
  if (attr.type === 'Select')
    return (
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        {attr.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </Select>
    )
  return <Input type={attr.type === 'Number' ? 'number' : 'text'} value={value} onChange={(e) => onChange(e.target.value)} />
}

function VariantRow({ variant, productId, canDelete }: { variant: Variant; productId: string; canDelete: boolean }) {
  const qc = useQueryClient()
  const [v, setV] = useState({ sku: variant.sku, name: variant.name, weightGrams: variant.weightGrams, isActive: variant.isActive })
  const [o, setO] = useState({
    price: variant.offer ? String(variant.offer.price / 10) : '',
    compareAtPrice: variant.offer?.compareAtPrice ? String(variant.offer.compareAtPrice / 10) : '',
    stock: String(variant.offer?.stock ?? 0),
    preparationDays: String(variant.offer?.preparationDays ?? 1),
    warranty: variant.offer?.warranty ?? '',
    isActive: variant.offer ? variant.offer.status === 'Active' : true,
  })
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      await api.put(`/api/admin/catalog/variants/${variant.id}`, { ...v, sortOrder: variant.sortOrder, options: variant.options })
      if (o.price)
        await api.put(`/api/admin/catalog/variants/${variant.id}/offer`, {
          price: Math.round(Number(o.price) * 10),
          compareAtPrice: o.compareAtPrice ? Math.round(Number(o.compareAtPrice) * 10) : null,
          stock: Number(o.stock),
          preparationDays: Number(o.preparationDays),
          warranty: o.warranty || null,
          isActive: o.isActive,
        })
    },
    onSuccess: () => {
      setMsg({ ok: true, text: 'ذخیره شد' })
      void qc.invalidateQueries({ queryKey: ['product', productId] })
      void qc.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (e) => setMsg({ ok: false, text: (e as Error).message }),
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/api/admin/catalog/variants/${variant.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product', productId] }),
    onError: (e) => alert((e as Error).message),
  })

  return (
    <div className="rounded-lg border border-line p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <Field label="نام تنوع"><Input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })} /></Field>
        <Field label="SKU"><Input className="ltr" value={v.sku} onChange={(e) => setV({ ...v, sku: e.target.value })} /></Field>
        <Field label="وزن (گرم)"><Input type="number" min={0} value={v.weightGrams} onChange={(e) => setV({ ...v, weightGrams: Number(e.target.value) })} /></Field>
        <div className="flex items-end pb-2"><Checkbox label="تنوع فعال" checked={v.isActive} onChange={(x) => setV({ ...v, isActive: x })} /></div>
      </div>
      <div className="mt-3 grid gap-3 rounded-lg bg-canvas p-3 sm:grid-cols-5">
        <Field label="قیمت فروش (تومان)"><Input type="number" min={0} value={o.price} onChange={(e) => setO({ ...o, price: e.target.value })} /></Field>
        <Field label="قیمت قبل از تخفیف"><Input type="number" min={0} value={o.compareAtPrice} onChange={(e) => setO({ ...o, compareAtPrice: e.target.value })} /></Field>
        <Field label="موجودی"><Input type="number" min={0} value={o.stock} onChange={(e) => setO({ ...o, stock: e.target.value })} /></Field>
        <Field label="آماده‌سازی (روز)"><Input type="number" min={0} value={o.preparationDays} onChange={(e) => setO({ ...o, preparationDays: e.target.value })} /></Field>
        <Field label="گارانتی"><Input value={o.warranty} onChange={(e) => setO({ ...o, warranty: e.target.value })} /></Field>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Checkbox label="قابل فروش" checked={o.isActive} onChange={(x) => setO({ ...o, isActive: x })} />
        {msg && <span className={`text-xs ${msg.ok ? 'text-success' : 'text-danger'}`}>{msg.text}</span>}
        <div className="ms-auto flex gap-2">
          {canDelete && <Button variant="danger" onClick={() => confirm('این تنوع حذف شود؟') && remove.mutate()}>حذف</Button>}
          <Button onClick={() => { setMsg(null); save.mutate() }} disabled={save.isPending}>{save.isPending ? '...' : 'ذخیره تنوع و قیمت'}</Button>
        </div>
      </div>
    </div>
  )
}

export function ProductEditPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const qc = useQueryClient()

  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/api/admin/catalog/categories') })
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => api.get<Brand[]>('/api/admin/catalog/brands') })
  const product = useQuery({ queryKey: ['product', id], queryFn: () => api.get<Product>(`/api/admin/catalog/products/${id}`), enabled: !isNew })

  const [form, setForm] = useState<Form>(blank)
  const [formError, setFormError] = useState<ApiError | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (product.data) setForm(fromProduct(product.data))
  }, [product.data])

  const category = useMemo(() => categories.data?.find((c) => c.id === form.categoryId), [categories.data, form.categoryId])
  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setSaved(false)
    setForm((f) => ({ ...f, [key]: value }))
  }
  const specValue = (key: string) => form.specs.find((s) => s.key === key)?.value ?? ''
  const setSpec = (key: string, value: string) => set('specs', [...form.specs.filter((s) => s.key !== key), { key, value }])
  const err = (k: string) => formError?.errors?.[k]?.[0]

  const save = useMutation({
    mutationFn: () => (isNew ? api.post<Product>('/api/admin/catalog/products', form) : api.put<Product>(`/api/admin/catalog/products/${id}`, form)),
    onSuccess: (p) => {
      setFormError(null)
      setSaved(true)
      qc.setQueryData(['product', p.id], p)
      void qc.invalidateQueries({ queryKey: ['products'] })
      if (isNew) navigate(`/products/${p.id}`, { replace: true })
    },
    onError: (e) => setFormError(e as ApiError),
  })

  const archive = useMutation({
    mutationFn: () => api.delete(`/api/admin/catalog/products/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['products'] })
      navigate('/products')
    },
  })

  const addVariant = useMutation({
    mutationFn: () => api.post<Variant>(`/api/admin/catalog/products/${id}/variants`, { name: `مدل ${fa((product.data?.variants.length ?? 0) + 1)}`, weightGrams: 0, isActive: true, sortOrder: product.data?.variants.length ?? 0 }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['product', id] }),
    onError: (e) => alert((e as Error).message),
  })

  if (!isNew && product.isLoading) return <Spinner />
  if (!isNew && product.error) return <ErrorText error={product.error} />

  const customSpecs = form.specs.filter((s) => !category?.attributes.some((a) => a.key === s.key))

  return (
    <>
      <PageHeader
        title={isNew ? 'کالای جدید' : form.title || 'ویرایش کالا'}
        actions={
          <>
            <Link to="/products"><Button variant="secondary">بازگشت</Button></Link>
            {!isNew && form.status !== 'Archived' && (
              <Button variant="danger" onClick={() => confirm('کالا بایگانی شود؟') && archive.mutate()}>بایگانی</Button>
            )}
          </>
        }
      />

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="grid gap-6 lg:grid-cols-[1fr_300px]"
      >
        <div className="space-y-6">
          <Card title="اطلاعات اصلی">
            <div className="space-y-4">
              <Field label="عنوان کالا" error={err('title')}>
                <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="مثلا تلفن تحت شبکه یالینک مدل T31P" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="عنوان انگلیسی"><Input className="ltr" value={form.englishTitle} onChange={(e) => set('englishTitle', e.target.value)} /></Field>
                <Field label="نامک (URL)" hint="خالی بگذارید تا از عنوان ساخته شود"><Input value={form.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
              </div>
              <Field label="خلاصه" error={err('summary')}>
                <Textarea rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} />
              </Field>
              <Field label="توضیحات کامل">
                <Textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
          </Card>

          <Card title="تصاویر">
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={img.url} className="relative">
                  <Thumb url={img.url} onRemove={() => set('images', form.images.filter((_, idx) => idx !== i))} />
                  {i === 0 && <span className="absolute bottom-1 start-1"><Badge tone="blue">اصلی</Badge></span>}
                  {i > 0 && (
                    <button
                      type="button"
                      className="mt-1 block w-full text-center text-xs text-brand"
                      onClick={() => set('images', [img, ...form.images.filter((_, idx) => idx !== i)])}
                    >
                      تصویر اصلی شود
                    </button>
                  )}
                </div>
              ))}
              <ImageUpload multiple onUploaded={(url) => setForm((f) => ({ ...f, images: [...f.images, { url, alt: null, sortOrder: f.images.length }] }))} />
            </div>
          </Card>

          <Card title="مشخصات فنی">
            {err('specs') && <p className="mb-3 text-sm text-danger">{err('specs')}</p>}
            {!category ? (
              <p className="text-sm text-muted">ابتدا دسته کالا را انتخاب کنید.</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {category.attributes.map((a) => (
                  <Field key={a.key} label={`${a.name}${a.unit ? ` (${a.unit})` : ''}${a.isRequired ? ' *' : ''}`}>
                    <SpecInput attr={a} value={specValue(a.key)} onChange={(v) => setSpec(a.key, v)} />
                  </Field>
                ))}
                {category.attributes.length === 0 && <p className="text-sm text-muted">برای این دسته ویژگی تعریف نشده است.</p>}
              </div>
            )}
            {customSpecs.length > 0 && (
              <div className="mt-4 border-t border-line pt-4 text-xs text-muted">
                مشخصات خارج از ویژگی‌های دسته: {customSpecs.map((s) => `${s.key}: ${s.value}`).join('، ')}
              </div>
            )}
          </Card>

          {!isNew && product.data && (
            <Card
              title="تنوع‌ها، قیمت و موجودی"
              actions={<Button variant="secondary" onClick={() => addVariant.mutate()} disabled={addVariant.isPending}>افزودن تنوع</Button>}
            >
              <div className="space-y-4">
                {product.data.variants.map((v) => (
                  <VariantRow key={`${v.id}-${v.offer?.id ?? 'none'}`} variant={v} productId={product.data.id} canDelete={product.data.variants.length > 1} />
                ))}
              </div>
              <p className="mt-3 text-xs text-muted">قیمت‌ها به تومان وارد می‌شوند. موجودی فعلا مستقیم ثبت می‌شود و در مرحله بعد از ماژول انبار (رسید خرید و سریال) محاسبه خواهد شد.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card title="انتشار">
            <div className="space-y-4">
              <Field label="وضعیت">
                <Select value={form.status} onChange={(e) => set('status', e.target.value as ProductStatus)}>
                  {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                </Select>
              </Field>
              <Field label="دسته" error={err('categoryId')}>
                <Select value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                  <option value="">انتخاب کنید</option>
                  {categories.data?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="برند" error={err('brandId')}>
                <Select value={form.brandId ?? ''} onChange={(e) => set('brandId', e.target.value || null)}>
                  <option value="">بدون برند</option>
                  {brands.data?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Field>
              <Checkbox label="سازگار با فراتماس" checked={form.faraTamasCompatible} onChange={(v) => set('faraTamasCompatible', v)} />
              {formError && !formError.errors && <ErrorText error={formError} />}
              {formError?.errors && !err('title') && !err('specs') && !err('categoryId') && <ErrorText error={formError} />}
              {saved && <p className="text-sm text-success">ذخیره شد</p>}
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending ? 'در حال ذخیره...' : isNew ? 'ایجاد کالا' : 'ذخیره تغییرات'}
              </Button>
              {isNew && <p className="text-xs text-muted">پس از ایجاد، قیمت و موجودی را در بخش تنوع‌ها ثبت کنید.</p>}
            </div>
          </Card>
          <Card title="سئو">
            <div className="space-y-4">
              <Field label="عنوان سئو"><Input value={form.metaTitle} onChange={(e) => set('metaTitle', e.target.value)} /></Field>
              <Field label="توضیحات سئو"><Textarea rows={3} value={form.metaDescription} onChange={(e) => set('metaDescription', e.target.value)} /></Field>
            </div>
          </Card>
        </div>
      </form>
    </>
  )
}
