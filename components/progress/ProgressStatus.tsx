// components/progress/ProgressStatus.tsx — Individual status line display

import { Spinner } from '@/components/ui/Spinner'

interface ProgressStatusProps {
  pagesComplete: number
  totalPages?: number
}

export function ProgressStatus({ pagesComplete, totalPages = 10 }: ProgressStatusProps) {
  const isWriting = pagesComplete === 0
  const isIllustrating = pagesComplete > 0 && pagesComplete < totalPages

  let statusText: string
  if (isWriting) {
    statusText = 'Writing your story...'
  } else if (isIllustrating) {
    statusText = `Illustrating page ${pagesComplete} of ${totalPages}...`
  } else {
    statusText = 'Finishing up...'
  }

  return (
    <div className="flex items-center gap-3" aria-live="polite" aria-atomic="true">
      <Spinner size="md" label={statusText} />
      <span className="text-gray-600 text-lg">{statusText}</span>
    </div>
  )
}
