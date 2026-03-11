// components/ui/Spinner.tsx — Animated loading spinner

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const sizeClasses = {
  sm: 'w-4 h-4 border-2',
  md: 'w-8 h-8 border-2',
  lg: 'w-12 h-12 border-4',
}

export function Spinner({ size = 'md', className = '', label = 'Loading...' }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-block rounded-full border-amber-200 border-t-amber-500 animate-spin ${sizeClasses[size]} ${className}`}
    />
  )
}
