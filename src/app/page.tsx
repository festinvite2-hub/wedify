'use client'
 
import dynamic from 'next/dynamic'
 
const WeddingPlanner = dynamic(
  () => import('@/components/WeddingPlanner'),
  { ssr: false }
)
 
export default function Home() {
  return <WeddingPlanner />
}
