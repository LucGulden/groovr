interface AvatarProps {
  src?: string | null
  username: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

/**
 * Génère une couleur déterministe basée sur le username
 */
function getColorFromUsername(username: string): string {
  const colors = [
    '#E67E22', // Orange (primary)
    '#8B4513', // Marron (secondary)
    '#3498db', // Bleu
    '#e74c3c', // Rouge
    '#2ecc71', // Vert
    '#9b59b6', // Violet
    '#f39c12', // Jaune orangé
    '#1abc9c', // Turquoise
  ]

  // Générer un index basé sur le username
  let hash = 0
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colors.length

  return colors[index]
}

/**
 * Extrait les initiales du username
 */
function getInitials(username: string): string {
  if (!username) return '?'

  // Prendre les 2 premiers caractères du username
  return username.substring(0, 2).toUpperCase()
}

export default function Avatar({ src, username, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-16 w-16 text-xl',
    xl: 'h-24 w-24 text-3xl',
  }

  const sizePx = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
  }

  const backgroundColor = getColorFromUsername(username)
  const initials = getInitials(username)

  if (src) {
    return (
      <div className={`relative ${sizeClasses[size]}`}>
        <img
          src={src}
          alt={username}
          width={sizePx[size]}
          height={sizePx[size]}
          className={`rounded-full border-2 border-[var(--primary)] object-cover ${sizeClasses[size]} ${className}`}
        />
      </div>
    )
  }

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full border-2 border-[var(--primary)] font-bold text-white ${className}`}
      style={{ backgroundColor }}
    >
      {initials}
    </div>
  )
}