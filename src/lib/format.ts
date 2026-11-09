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
