-- Supprimer la colonne release_year de vinyls
ALTER TABLE public.vinyls DROP COLUMN release_year;
ALTER TABLE public.vinyls ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Ajouter created_by sur albums
ALTER TABLE public.albums ADD COLUMN created_by UUID REFERENCES auth.users(id);

-- Rendre catalog_number NOT NULL (si tu veux aussi au niveau BDD)
ALTER TABLE public.vinyls ALTER COLUMN catalog_number SET NOT NULL;

-- ============================================================================
-- NETTOYAGE : Supprimer les données de test si nécessaire
-- ============================================================================
TRUNCATE public.user_vinyls, public.vinyls, public.albums CASCADE;

-- ============================================================================
-- ALBUMS : Contraintes NOT NULL
-- ============================================================================
ALTER TABLE public.albums ALTER COLUMN cover_url SET NOT NULL;
ALTER TABLE public.albums ALTER COLUMN year SET NOT NULL;

-- ============================================================================
-- VINYLS : Contraintes NOT NULL
-- ============================================================================
ALTER TABLE public.vinyls ALTER COLUMN album_id SET NOT NULL;
ALTER TABLE public.vinyls ALTER COLUMN cover_url SET NOT NULL;
ALTER TABLE public.vinyls ALTER COLUMN year SET NOT NULL;
ALTER TABLE public.vinyls ALTER COLUMN label SET NOT NULL;
ALTER TABLE public.vinyls ALTER COLUMN catalog_number SET NOT NULL;
ALTER TABLE public.vinyls ALTER COLUMN country SET NOT NULL;
ALTER TABLE public.vinyls ALTER COLUMN format SET NOT NULL;