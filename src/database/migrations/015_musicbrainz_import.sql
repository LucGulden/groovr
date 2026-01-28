-- Table albums
ALTER TABLE albums ADD COLUMN IF NOT EXISTS musicbrainz_release_group_id TEXT;

-- Table vinyls
ALTER TABLE vinyls ADD COLUMN IF NOT EXISTS musicbrainz_release_id TEXT;