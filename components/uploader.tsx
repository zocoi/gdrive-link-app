import type { AppProps } from '@/lib/types'
import type { FC, DragEvent } from 'react'
import { useMemo, useState } from 'react'

type UploadStatus = 'queued' | 'uploading' | 'success' | 'error'

type UploadItem = {
  id: string
  file: File
  status: UploadStatus
  progress: number
  message?: string
  shareUrl?: string
}

const ACCEPTED_MIME_PREFIXES = ['image/', 'video/']
const FALLBACK_MAX_FILES = 6
const DEFAULT_PREFIX = ''

const formatBytes = (bytes: number) => {
  if (!Number.isFinite(bytes)) return 'unknown size'
  const units = ['B', 'KB', 'MB', 'GB']
  let value = bytes
  let unitIndex = 0
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }
  return `${value.toFixed(value >= 10 || value % 1 === 0 ? 0 : 1)} ${units[unitIndex]}`
}

type UploaderProps = AppProps & {
  onUploadComplete?: () => void
}

export const Uploader: FC<UploaderProps> = ({
  tokenEndpointUrl,
  tokenAuthToken,
  folderId,
  maxFiles,
  onUploadComplete,
}) => {
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const safeMaxFiles = useMemo(() => {
    if (typeof maxFiles === 'number' && maxFiles > 0) return maxFiles
    if (typeof maxFiles === 'string') {
      const parsed = Number.parseInt(maxFiles, 10)
      if (Number.isFinite(parsed) && parsed > 0) return parsed
    }
    return FALLBACK_MAX_FILES
  }, [maxFiles])

  const targetPrefix = (folderId || DEFAULT_PREFIX).trim()

  const isAcceptedFile = (file: File) => ACCEPTED_MIME_PREFIXES.some((prefix) => file.type.startsWith(prefix))

  const addUploads = (files: File[]) => {
    if (!tokenEndpointUrl?.trim()) {
      setError('Add an upload endpoint URL in settings to start sending files.')
      return
    }

    const newItems: UploadItem[] = []
    for (const file of files) {
      if (!isAcceptedFile(file)) {
        setError('Only photos and videos are allowed.')
        continue
      }
      newItems.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        status: 'queued',
        progress: 0,
      })
    }

    if (newItems.length === 0) return

    setError(null)
    let trimmed = false
    setUploads((prev) => {
      const availableSlots = Math.max(safeMaxFiles - prev.length, 0)
      const itemsToAdd = availableSlots > 0 ? newItems.slice(0, availableSlots) : []
      if (itemsToAdd.length < newItems.length) {
        trimmed = true
      }
      const nextUploads = [...prev, ...itemsToAdd]
      queueUploads(nextUploads)
      return nextUploads
    })
    if (trimmed) {
      setError(`You can queue up to ${safeMaxFiles} files at once.`)
    }
  }

  const queueUploads = (items: UploadItem[]) => {
    items
      .filter((item) => item.status === 'queued')
      .forEach((item) => {
        uploadSingle(item)
      })
  }

  const uploadSingle = (item: UploadItem) => {
    const uploadUrl = tokenEndpointUrl?.trim()
    if (!uploadUrl) return

    setUploads((current) =>
      current.map((existing) =>
        existing.id === item.id ? { ...existing, status: 'uploading', progress: 1 } : existing
      )
    )

    const formData = new FormData()
    formData.append('file', item.file)
    if (targetPrefix) {
      formData.append('prefix', targetPrefix)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl, true)
    xhr.setRequestHeader('Access-Control-Allow-Origin', '*')
    if (tokenAuthToken?.trim()) {
      xhr.setRequestHeader('Authorization', `Bearer ${tokenAuthToken.trim()}`)
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return
      const progress = Math.round((event.loaded / event.total) * 100)
      setUploads((current) =>
        current.map((existing) => (existing.id === item.id ? { ...existing, progress } : existing))
      )
    }

    xhr.onerror = () => {
      setUploads((current) =>
        current.map((existing) =>
          existing.id === item.id
            ? {
                ...existing,
                status: 'error',
                message: 'Network error while uploading.',
              }
            : existing
        )
      )
    }

    xhr.onload = () => {
      const success = xhr.status >= 200 && xhr.status < 300
      if (success) {
        let payload: unknown
        try {
          payload = JSON.parse(xhr.responseText)
        } catch (err) {
          payload = null
        }

        const data = payload as {
          id?: string
          publicUrl?: string
        }

        const shareUrl = data?.publicUrl

        setUploads((current) =>
          current.map((existing) =>
            existing.id === item.id
              ? {
                  ...existing,
                  status: 'success',
                  progress: 100,
                  shareUrl,
                  message: 'Uploaded',
                }
              : existing
          )
        )

        return
      }

      let failureMessage = 'Upload failed.'
      try {
        const parsed = JSON.parse(xhr.responseText) as { error?: { message?: string } }
        if (parsed?.error?.message) {
          failureMessage = parsed.error.message
        }
      } catch {
        failureMessage = xhr.responseText || failureMessage
      }

      setUploads((current) =>
        current.map((existing) =>
          existing.id === item.id ? { ...existing, status: 'error', message: failureMessage } : existing
        )
      )
    }

    xhr.send(formData)
    xhr.addEventListener('loadend', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onUploadComplete?.()
      }
    })
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const files = Array.from(fileList).slice(0, safeMaxFiles)
    addUploads(files)
  }

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    handleFiles(event.dataTransfer.files)
  }

  const hasUploads = uploads.length > 0

  return (
    <div className="rounded-linktree bg-white px-4 py-5 shadow-sm ring-1 ring-linktree-button-bg/15">
      <div className="text-sm font-semibold uppercase tracking-wide text-linktree-button-text/70">Add to the album</div>

      <label
        onDrop={onDrop}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[18px] border-2 border-dashed px-6 py-8 transition ${
          isDragging
            ? 'border-linktree-button-bg bg-linktree-button-bg/10'
            : 'border-linktree-button-bg/30 bg-linktree-button-bg/5'
        }`}
      >
        <input
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="text-3xl text-linktree-button-text/70" aria-hidden>
          ⬆️
        </div>
        <div className="mt-3 text-base font-semibold text-linktree-button-text">Add to the album</div>
        <div className="text-sm text-linktree-button-text/70">Upload from your device</div>
        <div className="mt-1 text-xs text-linktree-button-text/60">
          Up to {safeMaxFiles} files per drop (photos and videos only)
        </div>
      </label>

      {error ? (
        <div className="mt-3 rounded-linktree bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">{error}</div>
      ) : null}

      {hasUploads ? (
        <div className="mt-4 space-y-3">
          {uploads.map((item) => (
            <div key={item.id} className="rounded-linktree bg-linktree-button-bg/10 px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-linktree-button-text">{item.file.name}</div>
                  <div className="text-xs text-linktree-button-text/70">{formatBytes(item.file.size)}</div>
                </div>
                <div className="text-xs font-semibold uppercase tracking-wide text-linktree-button-text/70">
                  {item.status === 'uploading' && `${item.progress}%`}
                  {item.status === 'queued' && 'Queued'}
                  {item.status === 'success' && 'Done'}
                  {item.status === 'error' && 'Error'}
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-linktree bg-linktree-button-bg/20">
                <div
                  className={`h-full transition-all ${
                    item.status === 'error' ? 'bg-red-500/70' : 'bg-linktree-button-bg'
                  }`}
                  style={{ width: `${item.status === 'success' ? 100 : item.progress}%` }}
                />
              </div>
              {item.status === 'error' && item.message ? (
                <div className="mt-1 text-xs text-linktree-button-text/80">{item.message}</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
