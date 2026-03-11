// components/reader/BookPage.tsx — Single page: illustration left, text right

import Image from 'next/image'
import { Spinner } from '@/components/ui/Spinner'

interface BookPageProps {
  pageNumber: number
  totalPages: number
  text: string
  imageUrl: string | null
  childName: string
}

export function BookPage({ pageNumber, totalPages, text, imageUrl, childName }: BookPageProps) {
  return (
    <div
      className="flex-1 flex flex-col md:flex-row min-h-0"
      aria-label={`Page ${pageNumber} of ${totalPages}`}
    >
      {/* Illustration — left half on tablet+, full width on mobile */}
      <div className="relative flex-1 md:flex-none md:w-1/2 bg-amber-100 min-h-[280px] md:min-h-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Illustration for page ${pageNumber} of ${childName}'s book`}
            fill
            className="object-cover"
            priority={pageNumber === 1}
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-amber-100">
            <Spinner size="lg" label="Loading illustration" />
          </div>
        )}

        {/* Page number badge */}
        <div
          className="absolute bottom-3 left-3 bg-black/30 text-white text-xs font-medium rounded-full px-2.5 py-1 backdrop-blur-sm"
          aria-hidden="true"
        >
          {pageNumber}
        </div>
      </div>

      {/* Text — right half on tablet+, below image on mobile */}
      <div className="flex-1 md:w-1/2 flex items-center justify-center p-6 md:p-10 bg-white">
        <div className="max-w-sm w-full">
          {/* Decorative quote mark */}
          <div
            className="text-5xl font-serif text-amber-200 leading-none mb-2 select-none"
            aria-hidden="true"
          >
            &ldquo;
          </div>
          <p className="text-gray-800 text-xl md:text-2xl leading-relaxed font-medium">
            {text}
          </p>
        </div>
      </div>
    </div>
  )
}
