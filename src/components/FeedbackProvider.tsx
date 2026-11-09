import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { FeedbackContext, type ConfirmOptions, type ToastTone } from '../lib/feedback'
import { AlertIcon, CheckIcon, CloseIcon } from './Icons'
import { Button, Modal } from './ui'

type Toast = { id: number; message: string; tone: ToastTone }
type Pending = ConfirmOptions & { resolve: (ok: boolean) => void }

const TONE = {
  success: 'bg-night text-white [&_.ico]:bg-success',
  error: 'bg-danger text-white [&_.ico]:bg-white/20',
  info: 'bg-night text-white [&_.ico]:bg-brand',
}

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<Pending | null>(null)
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const toast = useCallback(
    (message: string, tone: ToastTone = 'success') => {
      const id = nextId.current++
      setToasts((t) => [...t.slice(-3), { id, message, tone }])
      window.setTimeout(() => dismiss(id), tone === 'error' ? 6000 : 3500)
    },
    [dismiss],
  )

  const confirm = useCallback((options: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...options, resolve })), [])

  const close = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
  }

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm])

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div key={t.id} role="status" className={`animate-toast pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl py-2.5 ps-2.5 pe-3 text-sm shadow-xl ${TONE[t.tone]}`}>
            <span className="ico grid size-7 shrink-0 place-items-center rounded-xl">
              {t.tone === 'error' ? <AlertIcon className="size-4" /> : <CheckIcon className="size-4" />}
            </span>
            <span className="flex-1 leading-6">{t.message}</span>
            <button type="button" aria-label="بستن" onClick={() => dismiss(t.id)} className="opacity-60 transition hover:opacity-100">
              <CloseIcon className="size-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal open={!!pending} title={pending?.title ?? ''} onClose={() => close(false)}>
        {pending && (
          <>
            {pending.message && <p className="text-sm leading-7 text-muted">{pending.message}</p>}
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>انصراف</Button>
              <Button autoFocus variant={pending.danger ? 'dangerSolid' : 'primary'} onClick={() => close(true)}>
                {pending.confirmLabel ?? 'تایید'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </FeedbackContext.Provider>
  )
}
