interface LoadingSpinnerProps {
  fullScreen?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingSpinner({ 
  fullScreen = false, 
  size = 'md',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-4',
  }

  const spinner = (
    <div 
      className={`${sizeClasses[size]} animate-spin rounded-full border-[var(--primary)] border-t-transparent`} 
    />
  )

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        {spinner}
      </div>
    )
  }

  return spinner
}