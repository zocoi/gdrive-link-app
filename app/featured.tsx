import { Carousel } from '@/components/carousel'
import { Hero } from '@/components/hero'
import './globals.css'
import type { AppProps } from '@/lib/types'
import { useState } from 'react'

export default function Featured(props: AppProps) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="space-y-3 p-3">
      <Hero {...props} />
      <Carousel {...props} listEndpointUrl="http://localhost:3001/list-drive-images" refreshKey={refreshKey} />
    </div>
  )
}
