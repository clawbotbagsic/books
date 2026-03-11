// components/ui/Input.tsx — Shared input primitive with label and error state

interface InputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  type?: 'text' | 'password' | 'email'
  placeholder?: string
  maxLength?: number
  error?: string
  disabled?: boolean
  required?: boolean
  hint?: string
  className?: string
}

export function Input({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  error,
  disabled = false,
  required = false,
  hint,
  className = '',
}: InputProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-amber-600 ml-1" aria-hidden="true">*</span>}
      </label>

      {hint && (
        <p id={`${id}-hint`} className="text-xs text-gray-500">
          {hint}
        </p>
      )}

      <input
        id={id}
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        disabled={disabled}
        required={required}
        aria-describedby={
          [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
            .filter(Boolean)
            .join(' ') || undefined
        }
        aria-invalid={!!error}
        className={[
          'w-full rounded-xl border px-4 py-3 text-base text-gray-900 bg-white',
          'min-h-[44px] placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error ? 'border-red-400' : 'border-gray-300',
          'transition-colors duration-150',
        ].join(' ')}
      />

      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600 mt-0.5">
          {error}
        </p>
      )}
    </div>
  )
}
