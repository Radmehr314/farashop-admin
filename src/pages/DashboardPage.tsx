import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Card, PageHeader } from '../components/ui'
import { api } from '../lib/api'
import { fa } from '../lib/format'
import type { Brand, Category, Paged, ProductRow, User } from '../lib/types'

function Stat({ label, value, to }: { label: string; value: number | undefined; to: string }) {
  return (
    <Link to={to} className="rounded-xl border border-line bg-white p-5 transition hover:border-brand">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-extrabold">{value === undefined ? '...' : fa(value)}</p>
    </Link>
  )
}

export function DashboardPage() {
  const products = useQuery({ queryKey: ['products', 'count'], queryFn: () => api.get<Paged<ProductRow>>('/api/admin/catalog/products?pageSize=1') })
  const published = useQuery({ queryKey: ['products', 'count', 'published'], queryFn: () => api.get<Paged<ProductRow>>('/api/admin/catalog/products?pageSize=1&status=Published') })
  const categories = useQuery({ queryKey: ['categories'], queryFn: () => api.get<Category[]>('/api/admin/catalog/categories') })
  const brands = useQuery({ queryKey: ['brands'], queryFn: () => api.get<Brand[]>('/api/admin/catalog/brands') })
  const users = useQuery({ queryKey: ['users', 'count'], queryFn: () => api.get<Paged<User>>('/api/admin/users?pageSize=1') })

  return (
    <>
      <PageHeader title="داشبورد" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="کل کالاها" value={products.data?.total} to="/products" />
        <Stat label="کالاهای منتشرشده" value={published.data?.total} to="/products" />
        <Stat label="دسته‌بندی‌ها" value={categories.data?.length} to="/categories" />
        <Stat label="برندها" value={brands.data?.length} to="/brands" />
        <Stat label="کاربران" value={users.data?.total} to="/users" />
      </div>
      <Card title="شروع سریع" className="mt-6">
        <ol className="list-inside list-decimal space-y-2 text-sm leading-7 text-muted">
          <li>دسته‌بندی‌ها و ویژگی‌های هر دسته را تعریف کنید (مثلا برای IP Phone: تعداد اکانت SIP، PoE).</li>
          <li>برندها را اضافه کنید.</li>
          <li>کالا را بسازید، مشخصات و تصاویر را وارد کنید و برای هر تنوع قیمت و موجودی ثبت کنید.</li>
          <li>وضعیت کالا را «منتشرشده» کنید تا در ویترین نمایش داده شود.</li>
        </ol>
      </Card>
    </>
  )
}
