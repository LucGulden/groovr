-- =============================================================================
-- Migration : Création de la table artists et relations album_artists/vinyl_artists
-- =============================================================================

-- 1. Créer la table artists
CREATE TABLE IF NOT EXISTS artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  spotify_id TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index sur le nom pour les recherches
CREATE INDEX IF NOT EXISTS idx_artists_name ON artists(name);
CREATE INDEX IF NOT EXISTS idx_artists_spotify_id ON artists(spotify_id);

-- =============================================================================

-- 2. Créer les tables de jointure

CREATE TABLE IF NOT EXISTS album_artists (
  album_id UUID NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  PRIMARY KEY (album_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_album_artists_album_id ON album_artists(album_id);
CREATE INDEX IF NOT EXISTS idx_album_artists_artist_id ON album_artists(artist_id);

-- ---

CREATE TABLE IF NOT EXISTS vinyl_artists (
  vinyl_id UUID NOT NULL REFERENCES vinyls(id) ON DELETE CASCADE,
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
  position INT DEFAULT 0,
  PRIMARY KEY (vinyl_id, artist_id)
);

CREATE INDEX IF NOT EXISTS idx_vinyl_artists_vinyl_id ON vinyl_artists(vinyl_id);
CREATE INDEX IF NOT EXISTS idx_vinyl_artists_artist_id ON vinyl_artists(artist_id);

-- =============================================================================

-- 3. Remplir la table artists avec les artistes uniques depuis albums
INSERT INTO artists (name)
SELECT DISTINCT TRIM(artist) FROM albums 
WHERE artist IS NOT NULL AND TRIM(artist) != ''
ON CONFLICT (name) DO NOTHING;

-- Remplir la table artists avec les artistes uniques depuis vinyls
INSERT INTO artists (name)
SELECT DISTINCT TRIM(artist) FROM vinyls 
WHERE artist IS NOT NULL AND TRIM(artist) != ''
ON CONFLICT (name) DO NOTHING;

-- =============================================================================

-- 4. Remplir album_artists
INSERT INTO album_artists (album_id, artist_id, position)
SELECT albums.id, artists.id, 0
FROM albums
JOIN artists ON TRIM(albums.artist) = artists.name
WHERE albums.artist IS NOT NULL AND TRIM(albums.artist) != ''
ON CONFLICT DO NOTHING;

-- Remplir vinyl_artists
INSERT INTO vinyl_artists (vinyl_id, artist_id, position)
SELECT vinyls.id, artists.id, 0
FROM vinyls
JOIN artists ON TRIM(vinyls.artist) = artists.name
WHERE vinyls.artist IS NOT NULL AND TRIM(vinyls.artist) != ''
ON CONFLICT DO NOTHING;

-- =============================================================================

-- 5. Supprimer les colonnes artist des tables albums et vinyls
ALTER TABLE albums DROP COLUMN artist;
ALTER TABLE vinyls DROP COLUMN artist;
