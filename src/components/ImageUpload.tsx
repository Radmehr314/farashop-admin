import { useRef, useState } from 'react'
import { api, ApiError, mediaUrl } from '../lib/api'

export function ImageUpload({ onUploaded, label = 'افزودن تصویر', multiple = false }: { onUploaded: (url: string) => void; label?: string; multiple?: boolean }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handle(files: FileList | null) {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      for (const file of Array.from(files)) {
        const res = await api.upload(file)
        onUploaded(res.url)
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'آپلود ناموفق بود')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        className="grid size-24 place-items-center rounded-lg border-2 border-dashed border-line text-xs text-muted transition hover:border-brand hover:text-brand disabled:opacity-50"
      >
        {busy ? 'در حال آپلود...' : label}
      </button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple={multiple} hidden onChange={(e) => void handle(e.target.files)} />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
}

export function Thumb({ url, onRemove, size = 'size-24' }: { url: string; onRemove?: () => void; size?: string }) {
  return (
    <div className={`group relative ${size} overflow-hidden rounded-lg border border-line bg-canvas`}>
      <img src={mediaUrl(url) ?? ''} alt="" className="size-full object-contain" />
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="حذف تصویر"
          className="absolute end-1 top-1 hidden size-6 place-items-center rounded-full bg-danger text-sm text-white group-hover:grid"
        >
          ×
        </button>
      )}
    </div>
  )
}
