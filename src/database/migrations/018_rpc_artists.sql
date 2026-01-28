CREATE OR REPLACE FUNCTION create_album_with_artist(
  p_title TEXT,
  p_artist_name TEXT,
  p_year INT,
  p_cover_url TEXT,
  p_spotify_id TEXT,
  p_spotify_url TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id UUID;
  v_album_id UUID;
BEGIN
  -- 1. Créer ou récupérer l'artiste via ensure_artist()
  v_artist_id := ensure_artist(p_artist_name);
  
  -- 2. Créer l'album
  INSERT INTO albums (title, year, cover_url, spotify_id, spotify_url, created_by)
  VALUES (p_title, p_year, p_cover_url, p_spotify_id, p_spotify_url, p_created_by)
  RETURNING id INTO v_album_id;
  
  -- 3. Créer la relation album-artiste
  INSERT INTO album_artists (album_id, artist_id, position)
  VALUES (v_album_id, v_artist_id, 0);
  
  RETURN v_album_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_album_with_artist TO authenticated;

CREATE OR REPLACE FUNCTION create_vinyl_with_artist(
  p_album_id UUID,
  p_title TEXT,
  p_artist_name TEXT,
  p_year INT,
  p_label TEXT,
  p_catalog_number TEXT,
  p_country TEXT,
  p_format TEXT,
  p_cover_url TEXT,
  p_created_by UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_artist_id UUID;
  v_vinyl_id UUID;
BEGIN
  -- 1. Créer ou récupérer l'artiste via ensure_artist()
  v_artist_id := ensure_artist(p_artist_name);
  
  -- 2. Créer le vinyle
  INSERT INTO vinyls (
    album_id,
    title,
    year,
    label,
    catalog_number,
    country,
    format,
    cover_url,
    created_by
  )
  VALUES (
    p_album_id,
    p_title,
    p_year,
    p_label,
    p_catalog_number,
    p_country,
    p_format,
    p_cover_url,
    p_created_by
  )
  RETURNING id INTO v_vinyl_id;
  
  -- 3. Créer la relation vinyl-artiste
  INSERT INTO vinyl_artists (vinyl_id, artist_id, position)
  VALUES (v_vinyl_id, v_artist_id, 0);
  
  RETURN v_vinyl_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_vinyl_with_artist TO authenticated;