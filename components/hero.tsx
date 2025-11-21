import type { FC } from 'react'
import type { AppProps } from '@/lib/types'

export const Hero: FC<AppProps> = () => {
  return (
    <div
      className="relative overflow-hidden rounded-[28px]"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=80')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/35 to-black/10" />
      <div className="relative flex h-40 flex-col justify-end px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/75 text-black">📷</div>
          <div className="text-3xl font-semibold sm:text-4xl">Sarah &amp; Mike&apos;s Wedding</div>
        </div>
      </div>
    </div>
  )
}
