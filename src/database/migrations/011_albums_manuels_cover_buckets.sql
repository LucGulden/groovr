-- Migration 011: Support albums manuels + bucket covers
-- Date: 2025-01-11

-- ============================================================================
-- PARTIE 1 : Rendre spotify_id nullable
-- ============================================================================

ALTER TABLE public.albums 
  ALTER COLUMN spotify_id DROP NOT NULL;

-- Supprimer la contrainte unique sur spotify_id
ALTER TABLE public.albums 
  DROP CONSTRAINT albums_spotify_id_key;

-- Recréer en unique partiel (ignore les NULL)
CREATE UNIQUE INDEX albums_spotify_id_unique 
  ON public.albums (spotify_id) 
  WHERE spotify_id IS NOT NULL;

-- ============================================================================
-- PARTIE 2 : Bucket covers
-- ============================================================================

-- Créer le bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

-- Policy SELECT : public
CREATE POLICY "covers_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'covers');

-- Policy INSERT : authentifié
CREATE POLICY "covers_insert_authenticated"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'covers' AND auth.role() = 'authenticated');

-- Policy UPDATE : authentifié
CREATE POLICY "covers_update_authenticated"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

-- Policy DELETE : authentifié
CREATE POLICY "covers_delete_authenticated"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'covers' AND auth.role() = 'authenticated');

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================