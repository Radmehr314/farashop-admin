import { useEffect, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { CloseIcon, EyeIcon, EyeOffIcon } from './Icons'

const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

type Variant = 'primary' | 'secondary' | 'danger' | 'dangerSolid' | 'ghost' | 'sun'

export function Button({ variant = 'primary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-brand text-white shadow-[0_6px_16px_-8px_var(--color-brand)] hover:bg-brand-strong',
        variant === 'secondary' && 'border border-line bg-surface text-ink hover:border-brand/40 hover:text-brand',
        variant === 'danger' && 'border border-danger/25 bg-surface text-danger hover:bg-danger hover:text-white',
        variant === 'dangerSolid' && 'bg-danger text-white hover:brightness-95',
        variant === 'ghost' && 'font-medium text-muted hover:bg-canvas hover:text-ink',
        variant === 'sun' && 'bg-sun text-ink hover:brightness-95',
        className,
      )}
    />
  )
}

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-brand focus:ring-4 focus:ring-brand/15 disabled:bg-surface-2'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(control, 'h-10', className)} />
}

export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={cx(control, 'ltr h-10 ps-11', className)} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'پنهان کردن رمز' : 'نمایش رمز'}
        className="absolute inset-y-0 end-0 grid w-11 place-items-center text-muted transition hover:text-ink"
      >
        {visible ? <EyeOffIcon className="size-[18px]" /> : <EyeIcon className="size-[18px]" />}
      </button>
    </div>
  )
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(control, 'py-2.5 leading-7', className)} />
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={cx(control, 'h-10', className)}>
      {children}
    </select>
  )
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block text-sm', className)}>
      <span className="mb-1.5 block font-medium text-ink/80">{label}</span>
      {children}
      {hint && !error && <span className="mt-1.5 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1.5 block text-xs font-medium text-danger">{error}</span>}
    </label>
  )
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-4 accent-brand" />
      {label}
    </label>
  )
}

export function Card({ title, subtitle, actions, children, className, flush }: { title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string; flush?: boolean }) {
  return (
    <section className={cx('rounded-2xl border border-line bg-surface shadow-card', className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            {title && <h2 className="font-bold">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={flush ? '' : 'p-5'}>{children}</div>
    </section>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  )
}

export function Badge({ tone = 'gray', children }: { tone?: 'gray' | 'green' | 'blue' | 'red' | 'amber'; children: ReactNode }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold',
        tone === 'gray' && 'bg-canvas text-muted',
        tone === 'green' && 'bg-success/10 text-success',
        tone === 'blue' && 'bg-brand-soft text-brand',
        tone === 'red' && 'bg-danger/10 text-danger',
        tone === 'amber' && 'bg-sun-soft text-sun-ink',
      )}
    >
      {children}
    </span>
  )
}

const AVATAR_TONES = ['bg-brand-soft text-brand', 'bg-sun-soft text-sun-ink', 'bg-sale-soft text-sale', 'bg-violet-soft text-violet-ink']

export function Avatar({ name, seed, size = 'size-10' }: { name: string; seed: string; size?: string }) {
  const initial = name.trim().charAt(0) || '؟'
  const tone = AVATAR_TONES[[...seed].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length]
  return <span className={cx('grid shrink-0 place-items-center rounded-xl text-sm font-black', size, tone)}>{initial}</span>
}

export function Modal({ open, title, onClose, children, wide }: { open: boolean; title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-night/50 p-4 pt-16 backdrop-blur-[2px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={cx('animate-toast w-full rounded-2xl bg-surface shadow-2xl', wide ? 'max-w-3xl' : 'max-w-lg')}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-bold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="بستن" className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-canvas hover:text-ink">
            <CloseIcon className="size-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export function Empty({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface px-6 py-12 text-center">
      <p className="text-sm text-muted">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Spinner() {
  return <div className="mx-auto my-12 size-8 animate-spin rounded-full border-4 border-brand-soft border-t-brand" aria-label="در حال بارگذاری" />
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-xl bg-line/60', className)} />
}

export function ErrorText({ error }: { error: unknown }) {
  if (!error) return null
  return (
    <p role="alert" className="rounded-xl bg-danger/5 px-3 py-2 text-sm text-danger">
      {error instanceof Error ? error.message : 'خطایی رخ داد'}
    </p>
  )
}

export function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / pageSize)
  if (pages <= 1) return null
  return (
    <div className="mt-5 flex items-center justify-center gap-3 text-sm">
      <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>قبلی</Button>
      <span className="text-muted">صفحه {page.toLocaleString('fa-IR')} از {pages.toLocaleString('fa-IR')}</span>
      <Button variant="secondary" disabled={page >= pages} onClick={() => onChange(page + 1)}>بعدی</Button>
    </div>
  )
}
