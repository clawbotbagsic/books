// components/reader/BookPage.tsx — Single page: full-bleed illustration with text overlay
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
      className="relative flex-1 min-h-0 w-full overflow-hidden"
      aria-label={`Page ${pageNumber} of ${totalPages}`}
    >
      {/* Full-bleed illustration */}
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={`Illustration for page ${pageNumber} of ${childName}'s book`}
          fill
          className="object-cover"
          priority={pageNumber <= 3}
          loading={pageNumber <= 3 ? 'eager' : 'lazy'}
          sizes="100vw"
          placeholder="blur"
          blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8+vXrfwYiAOOoQoqVAQBMXwkLj8EDKAAAAABJRU5ErkJggg=="
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-amber-100">
          <Spinner size="lg" label="Loading illustration" />
        </div>
      )}

      {/* Text overlay — gradient strip at bottom */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pt-16 pb-6 px-6 md:px-10">
        <p className="text-white text-lg md:text-2xl leading-relaxed font-medium drop-shadow-lg max-w-2xl mx-auto text-center">
          {text}
        </p>
      </div>

      {/* Page number badge */}
      <div
        className="absolute bottom-3 left-3 bg-black/30 text-white text-xs font-medium rounded-full px-2.5 py-1 backdrop-blur-sm z-10"
        aria-hidden="true"
      >
        {pageNumber}
      </div>
    </div>
  )
}
