import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Avatar from './Avatar'
import Input from './Input'
import Button from './Button'
import { uploadProfilePhoto, generateImagePreview } from '../lib/avatars'
import {
  updateUserProfile,
  checkUsernameAvailability,
  validateUsername,
  validateBio,
} from '../lib/user'
import { useUserStore } from '../stores/userStore'
import type { User } from '../types/user'

interface EditProfileFormProps {
  user: User;
  onSuccess?: () => void;
}

interface FormData {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
}

export default function EditProfileForm({ user, onSuccess }: EditProfileFormProps) {
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { updateAppUser } = useUserStore()

  const [formData, setFormData] = useState<FormData>({
    username: user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
  })

  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoUrl || null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState(true)

  // Vérifier la disponibilité du username en temps réel
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username === user.username) {
        setUsernameAvailable(true)
        return
      }

      if (!validateUsername(formData.username)) {
        setUsernameAvailable(false)
        return
      }

      setCheckingUsername(true)
      try {
        const available = await checkUsernameAvailability(formData.username, user.uid)
        setUsernameAvailable(available)
      } catch (error) {
        console.error('Erreur lors de la vérification du username:', error)
      } finally {
        setCheckingUsername(false)
      }
    }

    const debounce = setTimeout(checkUsername, 500)
    return () => clearTimeout(debounce)
  }, [formData.username, user.username, user.uid])

  // Gestion de la sélection de fichier
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Valider le fichier
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, photo: 'Le fichier doit être une image' })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors({ ...errors, photo: "L'image ne doit pas dépasser 5MB" })
      return
    }

    try {
      const preview = await generateImagePreview(file)
      setPhotoFile(file)
      setPhotoPreview(preview)
      setErrors({ ...errors, photo: '' })
    } catch {
      setErrors({ ...errors, photo: "Erreur lors de la lecture de l'image" })
    }
  }

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.username) {
      newErrors.username = "Le nom d'utilisateur est requis"
    } else if (!validateUsername(formData.username)) {
      newErrors.username =
        "Nom d'utilisateur invalide (3-20 caractères, lettres, chiffres, - et _)"
    } else if (!usernameAvailable) {
      newErrors.username = "Ce nom d'utilisateur est déjà pris"
    }

    if (formData.bio && !validateBio(formData.bio)) {
      newErrors.bio = 'La bio ne peut pas dépasser 200 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setLoading(true)

      let photoUrl = user.photoUrl

      // Upload de la nouvelle photo si sélectionnée
      if (photoFile) {
        photoUrl = await uploadProfilePhoto(user.uid, photoFile)
      }

      const updates = {
        username: formData.username,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        bio: formData.bio || undefined,
        photoUrl: photoUrl || undefined,
      }

      // Mise à jour du profil en BDD
      await updateUserProfile(user.uid, updates)

      // Mise à jour du store Zustand (met à jour la navbar automatiquement)
      updateAppUser(updates)

      // Callback de succès
      if (onSuccess) {
        onSuccess()
      } else {
        navigate(`/profile/${formData.username}`)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error)
      setErrors({
        submit:
          error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil',
      })
    } finally {
      setLoading(false)
    }
  }

  // Gestion des changements de champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Erreur globale */}
      {errors.submit && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
          {errors.submit}
        </div>
      )}

      {/* Photo de profil */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Photo de profil
        </label>
        <div className="flex items-center gap-6">
          <Avatar src={photoPreview} username={formData.username} size="xl" />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Changer la photo
            </Button>
            <p className="text-xs text-[var(--foreground-muted)]">JPG, PNG ou GIF. Max 5MB.</p>
            {errors.photo && <p className="text-xs text-red-500">{errors.photo}</p>}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>

      {/* Username */}
      <div>
        <Input
          label="Nom d'utilisateur"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          error={errors.username}
          disabled={loading || checkingUsername}
        />
        {checkingUsername && (
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">Vérification...</p>
        )}
        {!checkingUsername &&
          formData.username !== user.username &&
          formData.username.length >= 3 &&
          usernameAvailable && (
            <p className="mt-1 text-xs text-green-500">✓ Nom d'utilisateur disponible</p>
          )}
      </div>

      {/* First Name */}
      <Input
        label="Prénom (optionnel)"
        type="text"
        name="firstName"
        value={formData.firstName}
        onChange={handleChange}
        disabled={loading}
      />

      {/* Last Name */}
      <Input
        label="Nom (optionnel)"
        type="text"
        name="lastName"
        value={formData.lastName}
        onChange={handleChange}
        disabled={loading}
      />

      {/* Bio */}
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
          Bio (optionnel)
        </label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          disabled={loading}
          maxLength={200}
          rows={4}
          className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Parlez-nous de votre passion pour les vinyles..."
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-[var(--foreground-muted)]">
            {formData.bio.length}/200 caractères
          </p>
          {errors.bio && <p className="text-xs text-red-500">{errors.bio}</p>}
        </div>
      </div>

      {/* Bouton de soumission */}
      <Button
        type="submit"
        loading={loading}
        disabled={loading || checkingUsername || !usernameAvailable}
        className="w-full"
      >
        Enregistrer les modifications
      </Button>
    </form>
  )
}