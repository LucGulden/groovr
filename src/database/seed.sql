-- Données de test pour le développement
-- Description: Quelques données d'exemple pour tester l'application
-- ATTENTION: À utiliser uniquement en développement, JAMAIS en production !

-- Note: Ces INSERT vont échouer car les UUID des utilisateurs doivent exister dans auth.users
-- Vous devez d'abord créer des comptes via l'interface Supabase ou votre app

-- ============================================================================
-- EXEMPLE D'ALBUMS
-- ============================================================================

INSERT INTO albums (spotify_id, spotify_url, title, artist, cover_url, year) VALUES
  ('3mH6qwIy9crq0I9YQbOuDf', 'https://open.spotify.com/album/3mH6qwIy9crq0I9YQbOuDf', 'Blonde', 'Frank Ocean', 'https://i.scdn.co/image/ab67616d0000b273c5649add07ed3720be9d5526', 2016),
  ('6pwuKxMUkNg673KETsXPUV', 'https://open.spotify.com/album/6pwuKxMUkNg673KETsXPUV', 'The Dark Side of the Moon', 'Pink Floyd', 'https://i.scdn.co/image/ab67616d0000b273ea7caaff71dea1051d49b2fe', 1973),
  ('2guirTSEqLizK7j9i1MTTZ', 'https://open.spotify.com/album/2guirTSEqLizK7j9i1MTTZ', 'Random Access Memories', 'Daft Punk', 'https://i.scdn.co/image/ab67616d0000b27397a1db9e8e2bfba3a93cd20d', 2013);

-- ============================================================================
-- EXEMPLE DE VINYLES
-- ============================================================================

-- Récupérer l'ID d'un album pour le lier
-- Remplacez XXX par l'UUID réel après avoir inséré les albums ci-dessus

-- INSERT INTO vinyls (album_id, title, artist, cover_url, release_year, year, label, catalog_number, country, format)
-- VALUES 
--   ('XXX-album-uuid', 'Blonde', 'Frank Ocean', 'https://example.com/cover.jpg', 2016, 2016, 'Boys Don''t Cry', 'BDC-01', 'US', 'LP'),
--   ('XXX-album-uuid', 'The Dark Side of the Moon', 'Pink Floyd', 'https://example.com/cover.jpg', 1973, 2016, 'Harvest', 'SHVL 804', 'UK', 'LP');

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Pour ajouter des données de test complètes :
-- 1. Créez d'abord des utilisateurs via Supabase Auth
-- 2. Récupérez leurs UUID depuis la table auth.users
-- 3. Utilisez ces UUID pour insérer dans users, user_releases, follows
-- 
-- ============================================================================