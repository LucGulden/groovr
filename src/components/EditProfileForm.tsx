'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from './Avatar';
import Input from './Input';
import Button from './Button';
import { uploadProfilePhoto, generateImagePreview } from '@/lib/storage';
import { updateUserProfile, checkUsernameAvailability, validateUsername, validateBio } from '@/lib/user';
import type { User, UpdateProfileData, UpdateUserProfileData } from '@/types/user';

interface EditProfileFormProps {
  user: User;
  onSuccess?: () => void;
}

export default function EditProfileForm({ user, onSuccess }: EditProfileFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UpdateProfileData>({
    username: user.username,
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    bio: user.bio || '',
    isPrivate: user.isPrivate,
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photoURL || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(true);

  // Vérifier la disponibilité du username en temps réel
  useEffect(() => {
    const checkUsername = async () => {
      if (formData.username === user.username) {
        setUsernameAvailable(true);
        return;
      }

      if (!validateUsername(formData.username)) {
        setUsernameAvailable(false);
        return;
      }

      setCheckingUsername(true);
      try {
        const available = await checkUsernameAvailability(formData.username, user.uid);
        setUsernameAvailable(available);
      } catch (error) {
        console.error('Erreur lors de la vérification du username:', error);
      } finally {
        setCheckingUsername(false);
      }
    };

    const debounce = setTimeout(checkUsername, 500);
    return () => clearTimeout(debounce);
  }, [formData.username, user.username, user.uid]);

  // Gestion de la sélection de fichier
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider le fichier
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, photo: 'Le fichier doit être une image' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, photo: 'L\'image ne doit pas dépasser 2MB' });
      return;
    }

    try {
      const preview = await generateImagePreview(file);
      setPhotoFile(file);
      setPhotoPreview(preview);
      setErrors({ ...errors, photo: '' });
    } catch {
      setErrors({ ...errors, photo: 'Erreur lors de la lecture de l\'image' });
    }
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    } else if (!validateUsername(formData.username)) {
      newErrors.username = 'Nom d\'utilisateur invalide (3-20 caractères, lettres, chiffres, - et _)';
    } else if (!usernameAvailable) {
      newErrors.username = 'Ce nom d\'utilisateur est déjà pris';
    }

    if (formData.bio && !validateBio(formData.bio)) {
      newErrors.bio = 'La bio ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      let photoURL = user.photoURL;

      // Upload de la nouvelle photo si sélectionnée
      if (photoFile) {
        photoURL = await uploadProfilePhoto(user.uid, photoFile);
      }

      // Préparer les données de mise à jour (sans valeurs undefined)
      const updateData: UpdateUserProfileData = {
        username: formData.username,
        isPrivate: formData.isPrivate,
      };

      // Ajouter les champs optionnels seulement s'ils ont une valeur
      if (formData.firstName) updateData.firstName = formData.firstName;
      if (formData.lastName) updateData.lastName = formData.lastName;
      if (formData.bio) updateData.bio = formData.bio;
      if (photoURL) updateData.photoURL = photoURL;

      // Mise à jour du profil
      await updateUserProfile(user.uid, updateData);

      // Callback de succès
      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers le profil
        router.push(`/profile/${formData.username}`);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du profil' });
    } finally {
      setLoading(false);
    }
  };

  // Gestion des changements de champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

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
          <Avatar
            src={photoPreview}
            username={formData.username}
            size="xl"
          />
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
            >
              Changer la photo
            </Button>
            <p className="text-xs text-[var(--foreground-muted)]">
              JPG, PNG ou GIF. Max 2MB.
            </p>
            {errors.photo && (
              <p className="text-xs text-red-500">{errors.photo}</p>
            )}
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
      <Input
        label="Nom d'utilisateur"
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        disabled={loading || checkingUsername}
        icon={
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        }
      />
      {checkingUsername && (
        <p className="text-xs text-[var(--foreground-muted)]">Vérification...</p>
      )}
      {!checkingUsername && formData.username !== user.username && usernameAvailable && (
        <p className="text-xs text-green-500">{`✓ Nom d'utilisateur disponible`}</p>
      )}

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
          className="w-full rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] px-4 py-3 text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Parlez-nous de votre passion pour les vinyles..."
        />
        <div className="mt-1 flex items-center justify-between">
          <p className="text-xs text-[var(--foreground-muted)]">
            {formData.bio ? formData.bio.length : 0}/200 caractères
          </p>
          {errors.bio && (
            <p className="text-xs text-red-500">{errors.bio}</p>
          )}
        </div>
      </div>

      {/* Compte privé */}
      <div className="flex items-center gap-3 rounded-lg border border-[var(--background-lighter)] bg-[var(--background-light)] p-4">
        <input
          type="checkbox"
          name="isPrivate"
          checked={formData.isPrivate}
          onChange={handleChange}
          disabled={loading}
          className="h-5 w-5 rounded border-[var(--background-lighter)] text-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]"
        />
        <div>
          <label className="font-medium text-[var(--foreground)]">
            Compte privé
          </label>
          <p className="text-sm text-[var(--foreground-muted)]">
            Votre profil ne sera visible que par vos abonnés
          </p>
        </div>
      </div>

      {/* Bouton de soumission */}
      <Button
        type="submit"
        loading={loading}
        disabled={loading || checkingUsername || !usernameAvailable}
      >
        Enregistrer les modifications
      </Button>
    </form>
  );
}
