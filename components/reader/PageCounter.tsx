// components/reader/PageCounter.tsx — "Page 3 of 10" display at bottom center

interface PageCounterProps {
  currentPage: number
  totalPages: number
}

export function PageCounter({ currentPage, totalPages }: PageCounterProps) {
  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      aria-label={`Page ${currentPage} of ${totalPages}`}
      className="flex items-center gap-2"
    >
      {/* Dot indicators */}
      <div className="flex gap-1.5" role="presentation" aria-hidden="true">
        {Array.from({ length: totalPages }, (_, i) => (
          <div
            key={i}
            className={[
              'rounded-full transition-all duration-300',
              i + 1 === currentPage
                ? 'w-3 h-3 bg-amber-500'
                : 'w-2 h-2 bg-amber-200',
            ].join(' ')}
          />
        ))}
      </div>

      {/* Text counter */}
      <span className="text-sm font-medium text-white/60 ml-1">
        {currentPage} / {totalPages}
      </span>
    </div>
  )
}
