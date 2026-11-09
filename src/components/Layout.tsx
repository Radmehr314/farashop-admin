import { NavLink, Outlet, useNavigate } from 'react-router'
import { logout } from '../lib/api'
import { ROLE_LABEL } from '../lib/format'
import { useSession } from '../lib/useSession'

const NAV = [
  { to: '/', label: 'داشبورد', end: true },
  { to: '/products', label: 'کالاها' },
  { to: '/categories', label: 'دسته‌بندی‌ها' },
  { to: '/brands', label: 'برندها' },
  { to: '/users', label: 'کاربران' },
]

const SOON = ['انبار و خرید', 'سفارش‌ها', 'مالی', 'تنظیمات']

export function Layout() {
  const session = useSession()
  const navigate = useNavigate()
  const user = session?.user

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-e border-line bg-white md:flex">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid size-9 place-items-center rounded-lg bg-brand text-lg font-black text-white">ف</span>
          <div>
            <p className="font-extrabold">فراشاپ</p>
            <p className="text-xs text-muted">پنل مدیریت</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm transition ${isActive ? 'bg-brand-soft font-bold text-brand' : 'text-muted hover:bg-canvas hover:text-ink'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <p className="px-3 pt-5 pb-1 text-xs text-muted/70">به‌زودی</p>
          {SOON.map((s) => (
            <span key={s} className="block cursor-default px-3 py-2 text-sm text-muted/50">{s}</span>
          ))}
        </nav>
        <div className="border-t border-line p-4 text-sm">
          <p className="font-medium">{user?.firstName ? `${user.firstName} ${user.lastName ?? ''}` : user?.mobile}</p>
          <p className="text-xs text-muted">{user?.roles.filter((r) => r !== 'Customer').map((r) => ROLE_LABEL[r] ?? r).join('، ')}</p>
          <button
            type="button"
            className="mt-3 text-xs text-danger"
            onClick={async () => {
              await logout()
              navigate('/login', { replace: true })
            }}
          >
            خروج از حساب
          </button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <nav className="flex gap-1 overflow-x-auto border-b border-line bg-white px-3 py-2 md:hidden">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `shrink-0 rounded-lg px-3 py-1.5 text-sm ${isActive ? 'bg-brand-soft text-brand' : 'text-muted'}`}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <main className="mx-auto max-w-6xl p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
