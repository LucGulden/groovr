-- Migration 001: Schéma initial de Groovr
-- Description: Création de toutes les tables de base pour le réseau social vinyle
-- Date: 2024-12-30

-- ============================================================================
-- 1. TABLE USERS
-- ============================================================================
-- Profils utilisateurs étendus (lié à auth.users de Supabase)
CREATE TABLE users (
  uid UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  photo_url TEXT,
  bio TEXT,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. TABLE ALBUMS
-- ============================================================================
-- Référentiel des albums (provenant de Spotify API)
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  spotify_id TEXT UNIQUE NOT NULL,
  spotify_url TEXT,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. TABLE VINYLS
-- ============================================================================
-- Informations détaillées sur les pressages vinyle (Discogs)
CREATE TABLE vinyls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  cover_url TEXT,
  release_year INTEGER,
  year INTEGER, -- année de pressage spécifique
  label TEXT,
  catalog_number TEXT,
  country TEXT,
  format TEXT, -- LP, EP, Single, 7", 12", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. TABLE USER_RELEASES
-- ============================================================================
-- Association entre utilisateurs et vinyles (collection + wishlist)
CREATE TABLE user_releases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  release_id UUID REFERENCES vinyls(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('collection', 'wishlist')),
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, release_id, type)
);

-- ============================================================================
-- 5. TABLE FOLLOWS
-- ============================================================================
-- Relations entre utilisateurs (follow/unfollow)
CREATE TABLE follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES users(uid) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- ============================================================================
-- INDEX POUR OPTIMISATION DES PERFORMANCES
-- ============================================================================

-- Albums
CREATE INDEX idx_albums_spotify_id ON albums(spotify_id);
CREATE INDEX idx_albums_artist ON albums(artist);

-- Vinyls
CREATE INDEX idx_vinyls_album_id ON vinyls(album_id);
CREATE INDEX idx_vinyls_artist ON vinyls(artist);
CREATE INDEX idx_vinyls_title ON vinyls(title);

-- User Releases
CREATE INDEX idx_user_releases_user_id ON user_releases(user_id);
CREATE INDEX idx_user_releases_release_id ON user_releases(release_id);
CREATE INDEX idx_user_releases_type ON user_releases(type);
CREATE INDEX idx_user_releases_added_at ON user_releases(added_at DESC);

-- Follows
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
CREATE INDEX idx_follows_status ON follows(status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer le trigger sur users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un profil utilisateur lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (uid, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger qui s'exécute automatiquement quand un utilisateur s'inscrit via Supabase Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- FIN DE LA MIGRATION 001
-- ============================================================================