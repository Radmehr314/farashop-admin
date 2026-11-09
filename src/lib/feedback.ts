import { createContext, useContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export type ConfirmOptions = {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
}

export type Feedback = {
  toast: (message: string, tone?: ToastTone) => void
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

export const FeedbackContext = createContext<Feedback | null>(null)

function useFeedback(): Feedback {
  const ctx = useContext(FeedbackContext)
  if (!ctx) throw new Error('FeedbackProvider is missing')
  return ctx
}

export const useToast = () => useFeedback().toast
export const useConfirm = () => useFeedback().confirm

export const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'خطایی رخ داد')
