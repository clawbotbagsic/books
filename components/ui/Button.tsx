// components/ui/Button.tsx — Shared button primitive

import { Spinner } from './Spinner'

interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
  'aria-label'?: string
}

const variantClasses = {
  primary:
    'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white shadow-sm font-semibold',
  secondary:
    'bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 border border-gray-300 font-medium',
  ghost:
    'bg-transparent hover:bg-amber-50 active:bg-amber-100 text-amber-700 font-medium',
}

const sizeClasses = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-5 py-3 text-base min-h-[44px]',
  lg: 'px-8 py-4 text-lg min-h-[56px]',
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      aria-label={ariaLabel}
      aria-busy={loading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
    >
      {loading && <Spinner size="sm" label="Loading" />}
      {children}
    </button>
  )
}
