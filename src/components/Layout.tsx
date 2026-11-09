import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { logout, STORE_URL } from '../lib/api'
import { displayName, ROLE_LABEL } from '../lib/format'
import { setTheme, useTheme } from '../lib/theme'
import { useSession } from '../lib/useSession'
import { BoxIcon, CloseIcon, DashboardIcon, FolderIcon, LogoutIcon, MenuIcon, MoonIcon, PanelIcon, ShieldIcon, StoreIcon, SunIcon, TagIcon, UsersIcon } from './Icons'
import { Logo } from './Logo'
import { Avatar } from './ui'

type Item = { to: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; end?: boolean }

const GROUPS: { title: string; items: Item[] }[] = [
  { title: 'نمای کلی', items: [{ to: '/', label: 'داشبورد', icon: DashboardIcon, end: true }] },
  {
    title: 'کاتالوگ',
    items: [
      { to: '/products', label: 'کالاها', icon: BoxIcon },
      { to: '/categories', label: 'دسته‌بندی‌ها', icon: FolderIcon },
      { to: '/brands', label: 'برندها', icon: TagIcon },
    ],
  },
  { title: 'افراد', items: [{ to: '/users', label: 'کاربران و کارکنان', icon: UsersIcon }] },
  { title: 'حساب', items: [{ to: '/account', label: 'حساب من و امنیت', icon: ShieldIcon }] },
]

const SOON = ['سفارش‌ها', 'انبار و خرید', 'مالی', 'تنظیمات']

const TITLES: [string, string][] = [
  ['/products/new', 'کالای جدید'],
  ['/products/', 'ویرایش کالا'],
  ['/products', 'کالاها'],
  ['/categories', 'دسته‌بندی‌ها'],
  ['/brands', 'برندها'],
  ['/users', 'کاربران و کارکنان'],
  ['/account', 'حساب من'],
]

const COLLAPSE_KEY = 'fs_admin_sidebar'

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

function Sidebar({ collapsed = false, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const session = useSession()
  const roles = session?.user.roles.filter((r) => r !== 'Customer').map((r) => ROLE_LABEL[r] ?? r).join('، ')

  return (
    <div className="flex h-full flex-col border-e border-line bg-surface">
      <Link to="/" onClick={onNavigate} className={`flex h-[72px] shrink-0 items-center border-b border-line ${collapsed ? 'justify-center' : 'px-5'}`}>
        <Logo compact={collapsed} />
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
        {GROUPS.map((g) => (
          <div key={g.title}>
            {collapsed ? <div className="mx-3 mb-2 h-px bg-line" /> : <p className="px-3 pb-2 text-[11px] font-bold text-muted/80">{g.title}</p>}
            <div className="space-y-1">
              {g.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={collapsed ? label : undefined}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `flex h-11 items-center gap-3 rounded-xl text-sm transition ${collapsed ? 'justify-center' : 'px-3'} ${
                      isActive ? 'bg-brand-soft font-bold text-brand' : 'text-ink/75 hover:bg-surface-2 hover:text-ink'
                    }`
                  }
                >
                  <Icon className="size-5 shrink-0" />
                  {!collapsed && label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
        {!collapsed && (
          <div>
            <p className="px-3 pb-2 text-[11px] font-bold text-muted/80">به‌زودی</p>
            {SOON.map((s) => (
              <span key={s} className="flex h-10 cursor-default items-center justify-between px-3 text-sm text-muted/60">
                {s}
                <span className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[10px] font-bold">به‌زودی</span>
              </span>
            ))}
          </div>
        )}
      </nav>

      {!collapsed && roles && (
        <div className="border-t border-line px-5 py-4 text-xs text-muted">
          نقش: <span className="font-bold text-ink">{roles}</span>
        </div>
      )}
    </div>
  )
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-10 place-items-center rounded-xl text-muted transition hover:bg-surface-2 hover:text-ink">
      {children}
    </button>
  )
}

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const session = useSession()
  const theme = useTheme()
  const [drawer, setDrawer] = useState(false)
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const title = TITLES.find(([p]) => location.pathname.startsWith(p))?.[1] ?? 'داشبورد'
  const user = session?.user

  useEffect(() => {
    document.title = `${title} | پنل مدیریت فراشاپ`
  }, [title])

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? '0' : '1')
      } catch {
        /* storage unavailable */
      }
      return !c
    })

  return (
    <div className="flex min-h-screen">
      <aside className={`sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block ${collapsed ? 'w-[76px]' : 'w-[264px]'}`}>
        <Sidebar collapsed={collapsed} />
      </aside>

      {drawer && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="منو">
          <div className="absolute inset-0 bg-night/50 backdrop-blur-[2px]" onClick={() => setDrawer(false)} />
          <div className="animate-toast absolute inset-y-0 start-0 w-[280px] shadow-2xl">
            <Sidebar onNavigate={() => setDrawer(false)} />
            <button type="button" aria-label="بستن منو" onClick={() => setDrawer(false)} className="absolute top-4 end-3 grid size-10 place-items-center rounded-xl text-muted hover:bg-surface-2">
              <CloseIcon className="size-5" />
            </button>
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
          <div className="flex h-[72px] items-center gap-2 px-4 md:px-6">
            <span className="lg:hidden">
              <IconButton label="باز کردن منو" onClick={() => setDrawer(true)}>
                <MenuIcon className="size-5" />
              </IconButton>
            </span>
            <span className="hidden lg:block">
              <IconButton label={collapsed ? 'باز کردن منو' : 'جمع کردن منو'} onClick={toggleCollapsed}>
                <PanelIcon className="size-5" />
              </IconButton>
            </span>
            <p className="ms-1 truncate text-sm text-muted">
              پنل مدیریت <span className="mx-1.5 text-line">/</span> <span className="font-bold text-ink">{title}</span>
            </p>

            <div className="ms-auto flex items-center gap-1.5">
              <a
                href={STORE_URL}
                target="_blank"
                rel="noopener"
                className="hidden h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-surface-2 hover:text-ink sm:flex"
              >
                <StoreIcon className="size-[18px]" /> فروشگاه
              </a>
              <IconButton label={theme === 'dark' ? 'حالت روشن' : 'حالت تیره'} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <SunIcon className="size-5" /> : <MoonIcon className="size-5" />}
              </IconButton>
              {user && (
                <Link to="/account" className="flex h-11 items-center gap-2.5 rounded-xl border border-line ps-1.5 pe-3 transition hover:border-brand/40">
                  <Avatar name={displayName(user)} seed={user.id} size="size-8" />
                  <span className="hidden text-start leading-tight md:block">
                    <span className="block text-sm font-bold">{displayName(user)}</span>
                    <span className="ltr block text-[11px] text-muted">{user.username ?? user.mobile}</span>
                  </span>
                </Link>
              )}
              <button
                type="button"
                onClick={async () => {
                  await logout()
                  navigate('/login', { replace: true })
                }}
                className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <LogoutIcon className="size-[18px]" />
                <span className="hidden sm:inline">خروج</span>
              </button>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
