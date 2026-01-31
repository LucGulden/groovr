import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Input from '../components/Input'
import Button from '../components/Button'
import { validateUsername, isUsernameAvailable } from '../lib/user'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, error: authError } = useAuth()

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)

  // Validation du formulaire
  const validateForm = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {}

    // Email
    if (!formData.email) {
      newErrors.email = "L'email est requis"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email invalide'
    }

    // Username
    if (!formData.username) {
      newErrors.username = "Le nom d'utilisateur est requis"
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Nom d\'utilisateur invalide (3-20 caractères, lettres, chiffres, - et _)'
    } else {
      // Vérifier la disponibilité
      try {
        setCheckingUsername(true)
        const available = await isUsernameAvailable(formData.username)
        if (!available) {
          newErrors.username = "Ce nom d'utilisateur est déjà pris"
        }
      } catch {
        newErrors.username = 'Impossible de vérifier la disponibilité'
      } finally {
        setCheckingUsername(false)
      }
    }

    // Password
    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères'
    }

    // Confirm password
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer le mot de passe'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Gestion de la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isValid = await validateForm()
    if (!isValid) return

    try {
      setLoading(true)
      await signUp({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      })
      navigate('/')
    } catch (error) {
      console.error("Erreur d'inscription:", error)
    } finally {
      setLoading(false)
    }
  }

  // Gestion des changements de champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
            Rejoignez FillCrate
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Commencez à partager votre passion pour les vinyles
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--background-lighter)] bg-[var(--background-light)] p-8">
          {/* Erreur globale */}
          {authError && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
              {authError.message}
            </div>
          )}

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="votre@email.com"
              disabled={loading}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              }
            />

            <Input
              label="Nom d'utilisateur"
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="johndoe"
              disabled={loading || checkingUsername}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Mot de passe"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              disabled={loading}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            <Input
              label="Confirmer le mot de passe"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="••••••••"
              disabled={loading}
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />

            <Button type="submit" className="w-full" loading={loading || checkingUsername} disabled={loading || checkingUsername}>
              Créer mon compte
            </Button>
          </form>

          {/* Lien vers Login */}
          <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
            Vous avez déjà un compte ?{' '}
            <Link
              to="/login"
              className="font-semibold text-[var(--primary)] hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}