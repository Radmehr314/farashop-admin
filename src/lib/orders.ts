export type OrderStatus = 'AwaitingPayment' | 'Paid' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'
export type PaymentMethod = 'BankTransfer' | 'CashOnDelivery'

export type AddressSnapshot = {
  recipientName: string
  recipientMobile: string
  province: string
  city: string
  line: string
  plaque: string | null
  unit: string | null
  postalCode: string
}

export type CustomerSnapshot = {
  mobile: string
  fullName: string | null
  email: string | null
  isLegal: boolean
  nationalCode: string | null
  companyName: string | null
  companyNationalId: string | null
  economicCode: string | null
}

export type OrderLine = {
  variantId: string
  productSlug: string
  title: string
  variantName: string
  sku: string
  imageUrl: string | null
  unitPrice: number
  compareAtPrice: number | null
  quantity: number
  lineTotal: number
  warranty: string | null
}

export type StatusEvent = { status: OrderStatus; at: string; note: string | null; by: string }

export type Order = {
  id: string
  number: number
  code: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  lines: OrderLine[]
  customer: CustomerSnapshot
  address: AddressSnapshot
  shipping: { code: string; name: string; cost: number }
  subtotal: number
  shippingCost: number
  total: number
  customerNote: string | null
  adminNote: string | null
  paymentReference: string | null
  trackingCode: string | null
  carrier: string | null
  paymentDueAt: string | null
  paidAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  createdAt: string
  history: StatusEvent[]
  canCancel: boolean
  nextStatuses: OrderStatus[]
  paymentReport: { reference: string; cardLast4: string | null; note: string | null; at: string } | null
}

export type OrderRow = {
  id: string
  number: number
  code: string
  status: OrderStatus
  paymentMethod: PaymentMethod
  total: number
  itemCount: number
  imageUrl: string | null
  customerName: string | null
  customerMobile: string
  createdAt: string
  paymentDueAt: string | null
}

export type OrdersSummary = { byStatus: Record<OrderStatus, number>; todayCount: number; todayTotal: number }

export type Seller = {
  name: string
  legalName: string | null
  nationalId: string | null
  economicCode: string | null
  registrationNumber: string | null
  address: string | null
  postalCode: string | null
  phone: string | null
}

export type Invoice = {
  kind: 'Proforma' | 'Invoice'
  code: string
  number: number
  issuedAt: string
  validUntil: string | null
  seller: Seller
  buyer: CustomerSnapshot
  address: AddressSnapshot
  lines: { row: number; title: string; sku: string; quantity: number; unitPrice: number; total: number; net: number; vat: number }[]
  shippingName: string
  shippingCost: number
  shippingNet: number
  shippingVat: number
  net: number
  vat: number
  total: number
  vatRate: number
  paymentMethod: PaymentMethod
  status: OrderStatus
  bankTransfer: { bankName: string; accountHolder: string; cardNumber: string; sheba: string } | null
  paymentReference: string | null
}

export type ShippingMethod = {
  code: string
  name: string
  description: string | null
  cost: number
  estimatedDelivery: string | null
  tehranOnly: boolean
  allowsCashOnDelivery: boolean
  freeOverThreshold: boolean
  isActive: boolean
  sortOrder: number
}

export type ShippingSettings = { freeShippingThreshold: number; methods: ShippingMethod[] }

export const ORDER_STATUS: Record<OrderStatus, string> = {
  AwaitingPayment: 'در انتظار پرداخت',
  Paid: 'پرداخت‌شده',
  Processing: 'در حال آماده‌سازی',
  Shipped: 'ارسال‌شده',
  Delivered: 'تحویل‌شده',
  Cancelled: 'لغوشده',
}

export const ORDER_TONE: Record<OrderStatus, 'gray' | 'green' | 'blue' | 'red' | 'amber'> = {
  AwaitingPayment: 'amber',
  Paid: 'blue',
  Processing: 'blue',
  Shipped: 'blue',
  Delivered: 'green',
  Cancelled: 'red',
}

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  BankTransfer: 'کارت به کارت / واریز',
  CashOnDelivery: 'پرداخت در محل',
}

export const ACTION_LABEL: Record<OrderStatus, string> = {
  AwaitingPayment: '',
  Paid: 'تایید پرداخت',
  Processing: 'شروع آماده‌سازی',
  Shipped: 'ثبت ارسال',
  Delivered: 'تحویل شد',
  Cancelled: 'لغو سفارش',
}

const jalali = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { year: 'numeric', month: 'long', day: 'numeric' })
export const faDate = (iso: string) => jalali.format(new Date(iso))
export const faDigits = (value: string) => value.replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)])

export const addressText = (a: AddressSnapshot) =>
  faDigits(`${a.province}، ${a.city}، ${a.line}${a.plaque ? `، پلاک ${a.plaque}` : ''}${a.unit ? `، واحد ${a.unit}` : ''}`)
