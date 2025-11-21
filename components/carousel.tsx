import type { AppProps } from '@/lib/types'
import type { FC } from 'react'
import { useEffect, useMemo, useState } from 'react'

type DriveImage = {
  id: string
  name?: string
  url: string
  link?: string
  fallback?: string
}

const DEFAULT_PREFIX = ''
const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='240' height='180' viewBox='0 0 240 180'><rect width='240' height='180' fill='%23666'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' font-size='14' fill='white' font-family='Arial, sans-serif'>Image unavailable</text></svg>`
  )

export const Carousel: FC<AppProps & { listEndpointUrl?: string; refreshKey?: number }> = ({
  folderId,
  listEndpointUrl,
  refreshKey,
}) => {
  const [images, setImages] = useState<DriveImage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalImage, setModalImage] = useState<DriveImage | null>(null)

  const targetPrefix = useMemo(() => (folderId && folderId.trim() ? folderId.trim() : DEFAULT_PREFIX), [folderId])

  const fetchImages = async () => {
    setLoading(true)
    setError(null)
    try {
      if (!listEndpointUrl?.trim()) {
        throw new Error('Add a list endpoint URL in settings.')
      }
      const response = await fetch(
        `${listEndpointUrl}${listEndpointUrl.includes('?') ? '&' : '?'}prefix=${encodeURIComponent(targetPrefix)}`
      )
      if (!response.ok) {
        throw new Error(`List endpoint failed (${response.status})`)
      }
      const payload = (await response.json()) as {
        files?: Array<{
          id?: string
          name?: string
          webViewLink?: string
          thumbnailLink?: string
          updated?: string
          timeCreated?: string
        }>
      }
      const mapped =
        payload.files
          ?.filter((file): file is Required<Pick<typeof file, 'id' | 'name'>> & typeof file => Boolean(file?.id))
          .map((file) => ({
            id: file.id!,
            name: file.name || file.id,
            link: file.webViewLink || file.thumbnailLink,
            url: file.webViewLink || file.thumbnailLink || '',
            fallback: file.thumbnailLink || file.webViewLink,
            sortTs: file.updated || file.timeCreated || '',
          })) ?? []
      const sorted = [...mapped].sort((a, b) => {
        const aTs = a.sortTs ? Date.parse(a.sortTs) : 0
        const bTs = b.sortTs ? Date.parse(b.sortTs) : 0
        return bTs - aTs
      })
      const unique = Array.from(
        sorted.reduce((acc, item) => {
          const key = (item.name || item.id || '').toLowerCase()
          if (!acc.has(key)) acc.set(key, item)
          return acc
        }, new Map<string, DriveImage>())
      ).map(([, value]) => value)
      setImages(unique)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load images.')
      setImages([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (listEndpointUrl?.trim()) {
      void fetchImages()
    }
  }, [targetPrefix, listEndpointUrl, refreshKey])

  return (
    <div className="rounded-[18px] bg-white px-4 py-5 shadow-sm ring-1 ring-linktree-button-bg/15">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-linktree-button-text/70" aria-hidden>
            📸
          </span>
          <div className="text-sm font-semibold tracking-wide text-linktree-button-text/80">LIVE GALLERY</div>
        </div>
        <div className="text-sm font-medium text-linktree-button-text/60">
          {images.length} photo{images.length === 1 ? '' : 's'}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-linktree bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-500">{error}</div>
      ) : null}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-linktree-button-text/70">Loading images...</div>
        ) : images.length === 0 ? (
          <div className="text-sm text-linktree-button-text/70">No images found in the folder yet.</div>
        ) : (
          <div className="flex snap-x gap-3 overflow-x-auto pb-2">
            {images.map((image) => (
              <div
                key={image.id}
                className="relative h-28 w-28 flex-shrink-0 snap-center overflow-hidden rounded-[16px] bg-linktree-button-bg/10 shadow-sm"
                onClick={() => setModalImage(image)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    setModalImage(image)
                  }
                }}
              >
                <img
                  src={image.url}
                  alt={image.name || 'Gallery image'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  onError={(event) => {
                    const img = event.target as HTMLImageElement
                    if (image.fallback && img.dataset.state !== 'fallback') {
                      img.dataset.state = 'fallback'
                      img.src = image.fallback
                      return
                    }
                    if (img.dataset.state !== 'placeholder') {
                      img.dataset.state = 'placeholder'
                      img.src = PLACEHOLDER_IMG
                    }
                  }}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1 text-[11px] font-semibold text-white line-clamp-1">
                  {image.name || 'Image'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalImage ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-[18px] bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={modalImage.url}
              alt={modalImage.name || 'Gallery image'}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
            <button
              type="button"
              className="absolute right-3 top-3 rounded-full bg-white/80 px-3 py-1 text-sm font-semibold text-black"
              onClick={() => setModalImage(null)}
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
