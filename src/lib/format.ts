const nf = new Intl.NumberFormat('fa-IR')
const df = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', timeStyle: 'short' })

export const fa = (n: number) => nf.format(n)
export const toman = (rial: number) => `${nf.format(Math.floor(rial / 10))} تومان`
export const date = (iso: string) => df.format(new Date(iso))

export const STATUS_LABEL: Record<string, string> = {
  Draft: 'پیش‌نویس',
  Published: 'منتشرشده',
  Archived: 'بایگانی',
}

export const ROLE_LABEL: Record<string, string> = {
  Admin: 'مدیر',
  Operator: 'اپراتور',
  Customer: 'مشتری',
}

export function displayName(u: { firstName: string | null; lastName: string | null; username?: string | null; mobile: string }) {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || u.mobile
}

export function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'همین الان'
  if (diff < 3600) return `${nf.format(Math.floor(diff / 60))} دقیقه پیش`
  if (diff < 86400) return `${nf.format(Math.floor(diff / 3600))} ساعت پیش`
  if (diff < 86400 * 30) return `${nf.format(Math.floor(diff / 86400))} روز پیش`
  return df.format(new Date(iso))
}

export function longDate(d: Date) {
  const parts = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).formatToParts(d)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  return `${get('weekday')} ${get('day')} ${get('month')} ${get('year')}`
}
