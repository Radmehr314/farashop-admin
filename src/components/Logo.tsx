import { useId } from 'react'

export function LogoMark({ className = 'size-10' }: { className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <defs>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id={`${id}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill={`url(#${id}g)`} />
      <path d="M14 0h20a14 14 0 0 1 14 14v2C34 20 18 18 0 26V14A14 14 0 0 1 14 0z" fill={`url(#${id}h)`} />
      <rect x="11.5" y="27" width="6" height="10" rx="3" fill="#fff" />
      <rect x="21" y="20" width="6" height="17" rx="3" fill="#fff" />
      <rect x="30.5" y="12" width="6" height="25" rx="3" fill="#fbbf24" />
    </svg>
  )
}

export function Logo({ subtitle = 'پنل مدیریت', tone = 'auto', compact = false }: { subtitle?: string; tone?: 'auto' | 'light'; compact?: boolean }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className={compact ? 'size-9' : 'size-10'} />
      {!compact && (
        <span className="leading-none">
          <span className={`block text-[19px] font-black tracking-tight ${tone === 'light' ? 'text-white' : 'text-ink'}`}>
            فراشاپ<span className="text-sun">.</span>
          </span>
          <span className={`mt-1.5 block text-[11px] font-medium ${tone === 'light' ? 'text-white/55' : 'text-muted'}`}>{subtitle}</span>
        </span>
      )}
    </span>
  )
}
