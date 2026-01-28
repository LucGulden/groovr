import imageCompression from 'browser-image-compression'
import { supabase } from '../supabaseClient'

const AVATAR_BUCKET = 'avatars'
const MAX_SIZE_PX = 256
const MAX_SIZE_MB = 0.5

/**
 * Compresse et redimensionne une image pour l'avatar
 * @param file - Fichier image original
 * @returns Fichier compressé
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_SIZE_PX,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  }

  try {
    const compressedFile = await imageCompression(file, options)
    return compressedFile
  } catch (error) {
    console.error('Erreur lors de la compression:', error)
    throw new Error('Impossible de compresser l\'image')
  }
}

/**
 * Upload la photo de profil vers Supabase Storage
 * @param userId - ID de l'utilisateur
 * @param file - Fichier image à uploader
 * @returns URL publique de l'image
 */
export async function uploadProfilePhoto(userId: string, file: File): Promise<string> {
  // Valider le type de fichier
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  // Valider la taille (max 5MB avant compression)
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('L\'image ne doit pas dépasser 5MB')
  }

  try {
    // Compresser l'image
    const compressedFile = await compressImage(file)

    // Chemin du fichier : {userId}/avatar.webp
    const filePath = `${userId}/avatar.webp`

    // Upload vers Supabase Storage (upsert pour remplacer si existe)
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(filePath, compressedFile, {
        cacheControl: '3600',
        upsert: true,
        contentType: 'image/webp',
      })

    if (uploadError) {
      console.error('Erreur upload:', uploadError)
      throw new Error('Impossible d\'uploader l\'image')
    }

    // Récupérer l'URL publique
    const { data: urlData } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(filePath)

    // Ajouter un timestamp pour éviter le cache navigateur
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`

    return publicUrl
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('Erreur lors de l\'upload de la photo')
  }
}

/**
 * Supprime la photo de profil d'un utilisateur
 * @param userId - ID de l'utilisateur
 */
export async function deleteProfilePhoto(userId: string): Promise<void> {
  const filePath = `${userId}/avatar.webp`

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('Erreur suppression:', error)
    throw new Error('Impossible de supprimer l\'image')
  }
}

/**
 * Génère une preview locale de l'image (avant upload)
 * @param file - Fichier image
 * @returns Data URL de l'image
 */
export function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erreur lors de la lecture de l\'image'))
    reader.readAsDataURL(file)
  })
}