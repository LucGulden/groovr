import imageCompression from 'browser-image-compression'
import { supabase } from '../supabaseClient'

const COVERS_BUCKET = 'covers'
const MAX_SIZE_PX = 600
const MAX_SIZE_MB = 0.5

/**
 * Compresse et redimensionne une image pour les covers
 */
async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: MAX_SIZE_MB,
    maxWidthOrHeight: MAX_SIZE_PX,
    useWebWorker: true,
    fileType: 'image/webp' as const,
  }

  try {
    return await imageCompression(file, options)
  } catch (error) {
    console.error('Erreur lors de la compression:', error)
    throw new Error('Impossible de compresser l\'image')
  }
}

/**
 * Télécharge une image depuis une URL et la convertit en File
 * Utilisé pour copier les covers Spotify dans notre storage
 */
async function fetchImageAsFile(imageUrl: string, filename: string): Promise<File> {
  const response = await fetch(imageUrl)
  
  if (!response.ok) {
    throw new Error('Impossible de télécharger l\'image')
  }

  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type })
}

/**
 * Upload une cover d'album vers Supabase Storage
 * @param albumId - ID de l'album
 * @param file - Fichier image à uploader
 * @returns URL publique de l'image
 */
export async function uploadAlbumCover(albumId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('L\'image ne doit pas dépasser 10MB')
  }

  try {
    const compressedFile = await compressImage(file)
    const filePath = `albums/${albumId}.webp`

    const { error: uploadError } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(filePath, compressedFile, {
        cacheControl: '31536000', // 1 an de cache
        upsert: true,
        contentType: 'image/webp',
      })

    if (uploadError) {
      console.error('Erreur upload cover album:', uploadError)
      throw new Error('Impossible d\'uploader la cover')
    }

    const { data: urlData } = supabase.storage
      .from(COVERS_BUCKET)
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Erreur lors de l\'upload de la cover')
  }
}

/**
 * Upload une cover de vinyle vers Supabase Storage
 * @param vinylId - ID du vinyle
 * @param file - Fichier image à uploader
 * @returns URL publique de l'image
 */
export async function uploadVinylCover(vinylId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Le fichier doit être une image')
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('L\'image ne doit pas dépasser 10MB')
  }

  try {
    const compressedFile = await compressImage(file)
    const filePath = `vinyls/${vinylId}.webp`

    const { error: uploadError } = await supabase.storage
      .from(COVERS_BUCKET)
      .upload(filePath, compressedFile, {
        cacheControl: '31536000',
        upsert: true,
        contentType: 'image/webp',
      })

    if (uploadError) {
      console.error('Erreur upload cover vinyl:', uploadError)
      throw new Error('Impossible d\'uploader la cover')
    }

    const { data: urlData } = supabase.storage
      .from(COVERS_BUCKET)
      .getPublicUrl(filePath)

    return urlData.publicUrl
  } catch (error) {
    if (error instanceof Error) throw error
    throw new Error('Erreur lors de l\'upload de la cover')
  }
}

/**
 * Copie une cover depuis une URL externe (ex: Spotify) vers notre Storage
 * @param albumId - ID de l'album
 * @param imageUrl - URL de l'image source
 * @returns URL publique de l'image copiée
 */
export async function copyExternalCoverToStorage(
  albumId: string,
  imageUrl: string,
): Promise<string> {
  try {
    const file = await fetchImageAsFile(imageUrl, `cover-${albumId}.jpg`)
    return await uploadAlbumCover(albumId, file)
  } catch (error) {
    console.error('Erreur copie cover externe:', error)
    throw new Error('Impossible de copier la cover')
  }
}

/**
 * Supprime une cover d'album
 */
export async function deleteAlbumCover(albumId: string): Promise<void> {
  const filePath = `albums/${albumId}.webp`

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('Erreur suppression cover album:', error)
    throw new Error('Impossible de supprimer la cover')
  }
}

/**
 * Supprime une cover de vinyle
 */
export async function deleteVinylCover(vinylId: string): Promise<void> {
  const filePath = `vinyls/${vinylId}.webp`

  const { error } = await supabase.storage
    .from(COVERS_BUCKET)
    .remove([filePath])

  if (error) {
    console.error('Erreur suppression cover vinyl:', error)
    throw new Error('Impossible de supprimer la cover')
  }
}

/**
 * Génère une preview locale de l'image (avant upload)
 */
export function generateImagePreview(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Erreur lors de la lecture de l\'image'))
    reader.readAsDataURL(file)
  })
}