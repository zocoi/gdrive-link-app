import { Carousel } from '@/components/carousel'
import { Hero } from '@/components/hero'
import './globals.css'
import type { AppProps } from '@/lib/types'
export default function Featured(props: AppProps) {
  return (
    <div className="space-y-3 p-3">
      <Hero {...props} />
      <Carousel {...props} listEndpointUrl="https://adalberto-fragrant-unstatically.ngrok-free.dev/list-drive-images" />
    </div>
  )
}
