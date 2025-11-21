import { Carousel } from '@/components/carousel'
import { Hero } from '@/components/hero'
import './globals.css'
import type { AppProps } from '@/lib/types'
export default function Featured(props: AppProps) {
  return (
    <div className="space-y-3 p-3">
      <Hero {...props} />
      <Carousel {...props} listEndpointUrl="http://localhost:3001/list-drive-images" />
    </div>
  )
}
