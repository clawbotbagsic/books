// app/generating/page.tsx — Progress screen: live status during generation

'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { ProgressScreen } from '@/components/progress/ProgressScreen'
import { Spinner } from '@/components/ui/Spinner'

function GeneratingContent() {
  const searchParams = useSearchParams()
  const uuid = searchParams.get('uuid')

  if (!uuid) {
    // No UUID means someone navigated here directly — redirect to home
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No book in progress.</p>
          <a
            href="/"
            className="text-amber-600 hover:text-amber-700 font-medium underline"
          >
            Create a book
          </a>
        </div>
      </div>
    )
  }

  return <ProgressScreen bookUuid={uuid} />
}

export default function GeneratingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-amber-50 flex items-center justify-center">
          <Spinner size="lg" label="Loading..." />
        </div>
      }
    >
      <GeneratingContent />
    </Suspense>
  )
}
