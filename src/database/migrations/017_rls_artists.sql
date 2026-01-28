-- =============================================================================
-- RLS Policies pour artists, album_artists, vinyl_artists
-- =============================================================================

-- ENABLE RLS
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE album_artists ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinyl_artists ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- ARTISTS TABLE POLICIES
-- =============================================================================

-- Tout le monde peut lire les artistes
CREATE POLICY "Artists are publicly readable"
  ON artists
  FOR SELECT
  USING (true);

-- Les insertions se font UNIQUEMENT via la fonction RPC ensure_artist()
-- Tous les INSERT directs sont bloqués
CREATE POLICY "Artists cannot be directly inserted"
  ON artists
  FOR INSERT
  WITH CHECK (false);

-- Empêcher les users normaux de modifier les artistes
CREATE POLICY "Artists are not directly modifiable"
  ON artists
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Artists cannot be deleted"
  ON artists
  FOR DELETE
  USING (false);

-- =============================================================================
-- ALBUM_ARTISTS TABLE POLICIES
-- =============================================================================

-- Tout le monde peut lire les relations album-artistes
CREATE POLICY "Album artists are publicly readable"
  ON album_artists
  FOR SELECT
  USING (true);

-- Les insertions se font via trigger lors de la création d'album
-- Aucune modification directe autorisée pour les users
CREATE POLICY "Album artists cannot be directly modified"
  ON album_artists
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Album artists updates disabled"
  ON album_artists
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Album artists deletes disabled"
  ON album_artists
  FOR DELETE
  USING (false);

-- =============================================================================
-- VINYL_ARTISTS TABLE POLICIES
-- =============================================================================

-- Tout le monde peut lire les relations vinyl-artistes
CREATE POLICY "Vinyl artists are publicly readable"
  ON vinyl_artists
  FOR SELECT
  USING (true);

-- Les insertions se font via trigger lors de la création de vinyl
-- Aucune modification directe autorisée pour les users
CREATE POLICY "Vinyl artists cannot be directly modified"
  ON vinyl_artists
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Vinyl artists updates disabled"
  ON vinyl_artists
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Vinyl artists deletes disabled"
  ON vinyl_artists
  FOR DELETE
  USING (false);

-- =============================================================================
-- FONCTION RPC : ensure_artist()
-- =============================================================================
-- Cette fonction gère la création/récupération d'un artiste de manière sécurisée
-- Elle contourne les RLS avec SECURITY DEFINER et retourne l'artist_id

CREATE OR REPLACE FUNCTION ensure_artist(artist_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_id UUID;
BEGIN
  -- Vérifier que le nom n'est pas vide
  IF artist_name IS NULL OR TRIM(artist_name) = '' THEN
    RAISE EXCEPTION 'Artist name cannot be empty';
  END IF;

  -- Chercher l'artiste existant (case-insensitive)
  SELECT id INTO artist_id
  FROM artists
  WHERE LOWER(TRIM(name)) = LOWER(TRIM(artist_name))
  LIMIT 1;

  -- Si l'artiste existe, le retourner
  IF artist_id IS NOT NULL THEN
    RETURN artist_id;
  END IF;

  -- Sinon, créer un nouvel artiste et le retourner
  INSERT INTO artists (name)
  VALUES (TRIM(artist_name))
  RETURNING id INTO artist_id;

  RETURN artist_id;
END;
$$;

-- Accorder les permissions pour que les users authentifiés puissent l'appeler
GRANT EXECUTE ON FUNCTION ensure_artist(TEXT) TO authenticated;

-- =============================================================================