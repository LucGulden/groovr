interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string; // ← Rendre optionnel
  error?: string;
  icon?: React.ReactNode;
}

export default function Input({
  label,
  error,
  icon,
  className = '',
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      {label && ( // ← Afficher seulement si label existe
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[var(--foreground-muted)]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full rounded-lg border bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)]
            ${icon ? 'pl-12' : ''}
            ${error ? 'border-red-500' : 'border-[var(--background-lighter)]'}
            focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20
            disabled:cursor-not-allowed disabled:opacity-50
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}