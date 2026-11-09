import { Navigate, Route, Routes, useLocation } from 'react-router'
import { ShieldIcon } from './components/Icons'
import { Layout } from './components/Layout'
import { Button } from './components/ui'
import { logout } from './lib/api'
import { isBackoffice, useSession } from './lib/useSession'
import { AccountPage } from './pages/AccountPage'
import { BrandsPage } from './pages/BrandsPage'
import { CategoriesPage } from './pages/CategoriesPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { ProductEditPage } from './pages/ProductEditPage'
import { ProductsPage } from './pages/ProductsPage'
import { UsersPage } from './pages/UsersPage'

function Protected({ children }: { children: React.ReactNode }) {
  const session = useSession()
  const location = useLocation()
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (!isBackoffice(session))
    return (
      <div className="grid min-h-screen place-items-center p-6 text-center">
        <div className="max-w-sm rounded-3xl border border-line bg-surface p-8">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-danger/10 text-danger">
            <ShieldIcon className="size-7" />
          </span>
          <p className="mt-5 text-lg font-black">این حساب به پنل مدیریت دسترسی ندارد</p>
          <p className="ltr mt-2 text-sm text-muted">{session.user.username ?? session.user.mobile}</p>
          <Button variant="secondary" className="mt-6 w-full" onClick={() => void logout()}>
            ورود با حساب دیگر
          </Button>
        </div>
      </div>
    )
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="brands" element={<BrandsPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductEditPage />} />
        <Route path="products/:id" element={<ProductEditPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
