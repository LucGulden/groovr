-- Policies de sécurité (Row Level Security)
-- Description: Configuration RLS pour protéger les données des utilisateurs
-- À exécuter APRÈS 001_initial_schema.sql

-- ============================================================================
-- ACTIVATION DE RLS SUR TOUTES LES TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE vinyls ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- POLICIES POUR LA TABLE USERS
-- ============================================================================

-- Lecture : Les profils publics sont visibles par tous
CREATE POLICY "users_public_read"
  ON users FOR SELECT
  USING (is_private = FALSE);

-- Lecture : Les profils privés ne sont visibles que par le propriétaire
CREATE POLICY "users_private_read_own"
  ON users FOR SELECT
  USING (is_private = TRUE AND auth.uid() = uid);

-- Lecture : Les profils privés sont visibles par les followers approuvés
CREATE POLICY "users_private_read_followers"
  ON users FOR SELECT
  USING (
    is_private = TRUE AND
    EXISTS (
      SELECT 1 FROM follows
      WHERE follows.following_id = users.uid
        AND follows.follower_id = auth.uid()
        AND follows.status = 'active'
    )
  );

-- Mise à jour : Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- Suppression : Les utilisateurs peuvent supprimer leur propre profil
CREATE POLICY "users_delete_own"
  ON users FOR DELETE
  USING (auth.uid() = uid);

-- ============================================================================
-- POLICIES POUR LA TABLE ALBUMS
-- ============================================================================

-- Lecture : Les albums sont visibles publiquement
CREATE POLICY "albums_public_read"
  ON albums FOR SELECT
  USING (true);

-- Création : Seuls les utilisateurs authentifiés peuvent créer des albums
CREATE POLICY "albums_authenticated_insert"
  ON albums FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- POLICIES POUR LA TABLE VINYLS
-- ============================================================================

-- Lecture : Les vinyles sont visibles publiquement
CREATE POLICY "vinyls_public_read"
  ON vinyls FOR SELECT
  USING (true);

-- Création : Seuls les utilisateurs authentifiés peuvent créer des vinyles
CREATE POLICY "vinyls_authenticated_insert"
  ON vinyls FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Mise à jour : Seuls les utilisateurs authentifiés peuvent modifier
CREATE POLICY "vinyls_authenticated_update"
  ON vinyls FOR UPDATE
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- POLICIES POUR LA TABLE USER_RELEASES
-- ============================================================================

-- Lecture : Les collections publiques sont visibles par tous
CREATE POLICY "user_releases_public_read"
  ON user_releases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.uid = user_releases.user_id
        AND users.is_private = FALSE
    )
  );

-- Lecture : Les utilisateurs peuvent voir leur propre collection (même si privée)
CREATE POLICY "user_releases_owner_read"
  ON user_releases FOR SELECT
  USING (auth.uid() = user_id);

-- Lecture : Les followers peuvent voir les collections privées
CREATE POLICY "user_releases_followers_read"
  ON user_releases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN follows ON follows.following_id = users.uid
      WHERE users.uid = user_releases.user_id
        AND users.is_private = TRUE
        AND follows.follower_id = auth.uid()
        AND follows.status = 'active'
    )
  );

-- Création : Les utilisateurs peuvent ajouter à leur propre collection
CREATE POLICY "user_releases_owner_insert"
  ON user_releases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Mise à jour : Les utilisateurs peuvent modifier leur propre collection
CREATE POLICY "user_releases_owner_update"
  ON user_releases FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Suppression : Les utilisateurs peuvent supprimer de leur propre collection
CREATE POLICY "user_releases_owner_delete"
  ON user_releases FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- POLICIES POUR LA TABLE FOLLOWS
-- ============================================================================

-- Lecture : Les relations de follow sont visibles publiquement
CREATE POLICY "follows_public_read"
  ON follows FOR SELECT
  USING (true);

-- Création : Les utilisateurs peuvent follow d'autres utilisateurs
CREATE POLICY "follows_create_own"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Mise à jour : Les utilisateurs peuvent modifier leurs propres follows (changer status)
CREATE POLICY "follows_update_own"
  ON follows FOR UPDATE
  USING (auth.uid() = follower_id OR auth.uid() = following_id)
  WITH CHECK (auth.uid() = follower_id OR auth.uid() = following_id);

-- Suppression : Les utilisateurs peuvent unfollow
CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================================
-- NOTES SUR LA SÉCURITÉ
-- ============================================================================
-- 
-- 1. RLS est activé sur toutes les tables sensibles
-- 2. Les utilisateurs ne peuvent modifier que leurs propres données
-- 3. Les profils privés sont protégés (visibles uniquement par followers)
-- 4. Les albums et vinyles sont publics (catalogue partagé)
-- 5. Les collections respectent le paramètre is_private de l'utilisateur
-- 
-- ============================================================================